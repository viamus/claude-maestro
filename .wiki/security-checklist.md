# Security Checklist

This document maintains the security posture of the claude-maestro application.

## Electron Security Configuration

### Current Settings (VERIFIED ✅)

**Location**: `src/main/main.ts:32-42`

```typescript
webPreferences: {
  contextIsolation: true,    // ✅ Isolates preload from renderer
  nodeIntegration: false,    // ✅ No Node.js in renderer
  sandbox: true,             // ✅ OS-level sandboxing
  webSecurity: true,         // ✅ Same-origin policy enforced
  preload: path.join(__dirname, '../preload/preload.js')
}
```

**Status**: All mandatory settings are correctly configured.

---

## IPC Security

### Exposed IPC Channels

All IPC channels must be:
1. ✅ Explicitly defined in `src/shared/ipc-channels.ts`
2. ✅ Type-safe via `src/shared/ipc-contracts.ts`
3. ✅ Input-validated in handlers

### Current IPC Endpoints

| Channel | Input Validation | Output Type | Security Notes |
|---------|-----------------|-------------|----------------|
| `ipc:ping` | None required (void) | `IPCResponse<string>` | Safe - no sensitive data |
| `ipc:settings:get` | ✅ SettingKey enum | `IPCResponse<T>` | Safe - typed key access |
| `ipc:settings:set` | ✅ Type checked | `IPCResponse<void>` | Safe - validated before write |
| `ipc:settings:getAll` | None required | `IPCResponse<AppSettings>` | Safe - read-only |
| `ipc:app:version` | None required | `IPCResponse<AppVersion>` | Safe - public info |
| `ipc:app:quit` | None required | `IPCResponse<void>` | Safe - user action |

**Last Updated**: 2024-12-24

---

## Preload Script Security

### contextBridge API Exposure

**Location**: `src/preload/preload.ts:28-46`

**Current Exposed API**:
```typescript
{
  invoke: IPCInvoke,        // Type-safe IPC only
  platform: string,         // Read-only system info
  versions: {               // Read-only version info
    node: string,
    chrome: string,
    electron: string
  }
}
```

**Security Audit**:
- ✅ No Node.js modules exposed (fs, child_process, etc.)
- ✅ No dangerous APIs (eval, require, etc.)
- ✅ All IPC goes through type-safe contracts
- ✅ Read-only data exposure only

---

## Content Security Policy

**Location**: `src/renderer/index.html:6-8`

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
/>
```

**Policy Breakdown**:
- `default-src 'self'` - Only load resources from same origin
- `script-src 'self'` - Only execute scripts from app bundle
- `style-src 'self' 'unsafe-inline'` - Allow inline styles (React)
- `img-src 'self' data:` - Allow app images and data URIs

**Note**: `'unsafe-inline'` for styles is required by React. Scripts remain safe.

---

## File System Access

### Current FS Operations

All file system operations occur in **main process only**:

| Service | Operations | Files Accessed | Validation |
|---------|-----------|----------------|------------|
| `SettingsManager` | Read/Write | `%APPDATA%/claude-maestro/settings.json` | ✅ Path fixed, JSON validated |
| `Logger` | Write | `%APPDATA%/claude-maestro/logs/main.log` | ✅ Path fixed, auto-rotation |

**Security Rules**:
- ✅ No dynamic paths from user input
- ✅ All paths use `app.getPath('userData')`
- ✅ No path traversal (`..`) allowed
- ✅ Files written with explicit encoding

---

## Dependency Security

### Production Dependencies

```json
{
  "electron-log": "^5.2.2"  // Logging only, no network access
}
```

**Security Status**:
- ✅ Minimal production dependencies
- ✅ No network-accessing libraries
- ✅ No eval/dynamic code execution in deps

### Development Dependencies

All dev dependencies are build-time only and not included in production bundle.

**Last Audit**: 2024-12-24

---

## Security Checklist for New Features

When adding ANY new feature, verify:

### ✅ IPC Endpoints
- [ ] Channel defined in `ipc-channels.ts`
- [ ] Contract typed in `ipc-contracts.ts`
- [ ] Input validation in handler
- [ ] No sensitive data in response
- [ ] Error messages don't leak info

### ✅ Exposed APIs (Preload)
- [ ] Minimal surface area
- [ ] No Node.js modules exposed
- [ ] Type-safe only
- [ ] Read-only where possible
- [ ] Documented in this checklist

### ✅ File Operations
- [ ] Only in main process
- [ ] Fixed paths (no user input)
- [ ] Path traversal prevented
- [ ] Error handling secure

### ✅ External Resources
- [ ] No remote code execution
- [ ] CSP allows only necessary sources
- [ ] HTTPS only for external URLs
- [ ] No inline event handlers in HTML

---

## Known Security Constraints

### `'unsafe-inline'` in CSP for Styles

**Why**: React and Vite use inline styles for HMR and component styling.

**Mitigation**:
- Scripts remain fully restricted (`script-src 'self'`)
- No inline `<style>` tags in HTML
- All styles via CSS files or React styled components

**Risk Level**: Low (inline styles cannot execute code)

---

## Threat Model

### Attack Vectors Considered

1. **Malicious IPC Messages**
   - ✅ Mitigated: Type checking + validation

2. **XSS in Renderer**
   - ✅ Mitigated: CSP + React escaping

3. **Path Traversal in FS**
   - ✅ Mitigated: Fixed paths only

4. **Remote Code Execution**
   - ✅ Mitigated: No eval, no remote scripts

5. **Prototype Pollution**
   - ✅ Mitigated: TypeScript strict mode

6. **Dependency Vulnerabilities**
   - ⚠️ Monitor: Run `npm audit` regularly

---

## Security Update Process

1. **Regular Audits**: Monthly review of this checklist
2. **Dependency Updates**: Run `npm audit` before releases
3. **Electron Updates**: Follow Electron security advisories
4. **Code Reviews**: All IPC/security changes need review

---

## Incident Response

If a security issue is discovered:

1. **Assess Impact**: Determine scope and severity
2. **Document**: Create entry in `.wiki/security-incidents.md`
3. **Fix**: Implement patch following security guidelines
4. **Update**: Modify this checklist if new rules needed
5. **Release**: Version bump and release notes

---

## References

- [Electron Security Guidelines](https://www.electronjs.org/docs/latest/tutorial/security)
- [OWASP Electron Security](https://owasp.org/www-community/Electron_Security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Last Full Audit**: 2024-12-24
**Next Scheduled Audit**: 2025-01-24
**Audited By**: Claude (Initial Bootstrap)
