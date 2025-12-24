# CI/CD Documentation

Complete guide for Continuous Integration and Continuous Deployment workflows in claude-maestro.

## Overview

The project uses **GitHub Actions** for automated validation on every commit and pull request.

### Workflows

| Workflow | File | Triggers | Purpose |
|----------|------|----------|---------|
| **CI - Build & Test** | `.github/workflows/ci.yml` | Push to `main`, PRs | Validate code quality, run tests, build application |
| **Security Audit** | `.github/workflows/security.yml` | Push, PRs, Daily schedule | Scan dependencies, validate Electron security, check licenses |

---

## CI - Build & Test

### Workflow Steps

#### 1. **Test Job**
Runs on: `windows-latest`

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. **Run linter** (`npm run lint`)
   - Validates code style
   - Blocks on linting errors
5. **Type checking** (all processes)
   - `tsc --noEmit` for main, preload, renderer
   - Ensures no TypeScript errors
6. **Run unit tests** (`npm run test`)
   - All tests must pass
   - Blocks on test failures
7. **Generate coverage report**
   - Uploads to Codecov
   - Tracks coverage trends

#### 2. **Build Job**
Runs on: `windows-latest`
Depends on: `test` (only runs if tests pass)

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. **Build main process**
5. **Build preload**
6. **Build renderer**
7. **Verify artifacts**
   - Checks `dist/main/main.js`
   - Checks `dist/preload/preload.js`
   - Checks `dist/renderer/index.html`
   - Fails if any artifact missing
8. **Upload artifacts**
   - Stores for 7 days
   - Available for download

#### 3. **Package Job**
Runs on: `windows-latest`
Depends on: `build`
Condition: Only on `push` to `main`

**Steps:**
1. Build complete application
2. Create Windows installer
3. Upload installer artifact (30 days retention)

### Triggers

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

**When it runs:**
- Every push to `main`
- Every pull request targeting `main`

### Failure Scenarios

**Test job fails if:**
- Linting errors exist
- TypeScript compilation errors
- Any unit test fails
- Test coverage drops

**Build job fails if:**
- TypeScript compilation fails
- Build artifacts not generated
- Missing required files

**Package job fails if:**
- Build fails
- electron-builder errors

---

## Security Audit

### Workflow Steps

#### 1. **Dependency Audit**
Runs on: `windows-latest`

**Scans for:**
- Known vulnerabilities in dependencies
- High/moderate severity issues
- Production vs dev dependency separation

**Commands:**
```bash
npm audit --audit-level=moderate  # All deps
npm audit --production --audit-level=high  # Prod only
npm outdated  # Check for updates
```

**Fails if:**
- High severity vulnerabilities in production
- Moderate+ in dependencies

#### 2. **CodeQL Analysis**
Runs on: `windows-latest`

**Performs:**
- Static code analysis
- Security pattern detection
- Vulnerability scanning

**Languages:** JavaScript, TypeScript
**Queries:** `security-extended`

**Uploads results to:**
- GitHub Security tab
- Code scanning alerts

#### 3. **Dependency Review**
Runs on: `windows-latest`
Condition: Only on pull requests

**Validates:**
- New dependencies added in PR
- License compatibility
- Known vulnerabilities

**Blocks if:**
- GPL-2.0 or GPL-3.0 licenses detected
- Moderate+ severity vulnerabilities

#### 4. **Electron Security Validation**
Runs on: `windows-latest`

**Custom PowerShell Validation:**

##### **Security Settings Check**
Validates `src/main/main.ts`:
```typescript
contextIsolation: true    ✅
nodeIntegration: false    ✅
sandbox: true             ✅
webSecurity: true         ✅
```

**Fails if ANY setting is missing or disabled.**

##### **Renderer Node.js Check**
Scans `src/renderer/` for forbidden imports:
- `fs`, `path`, `child_process`
- `os`, `crypto`, `net`
- `http`, `https`

**Blocks if renderer imports Node.js modules directly.**

##### **CSP Validation**
Checks `src/renderer/index.html`:
- ✅ CSP meta tag present
- ❌ `'unsafe-eval'` not allowed
- ❌ `'unsafe-inline'` for scripts blocked

##### **Secret Detection**
Scans for exposed credentials:
- Hardcoded passwords
- API keys
- Tokens
- Secrets

**Warns (doesn't block) if patterns found.**

#### 5. **License Compliance**
Runs on: `windows-latest`

**Allowed licenses:**
- MIT
- Apache-2.0
- BSD-2-Clause, BSD-3-Clause
- ISC
- 0BSD

**Blocks if:**
- GPL licenses detected
- Incompatible licenses in dependencies

#### 6. **Security Summary**
Runs on: `windows-latest`
Depends on: All security jobs

**Outputs:**
- Overall security status
- Per-job results
- Pass/fail summary

### Triggers

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
```

**When it runs:**
- Every push to `main`
- Every pull request
- **Daily** scheduled scan (monitors for new CVEs)

---

## Badge Status

Add to README.md:

```markdown
![CI](https://github.com/yourusername/claude-maestro/workflows/CI%20-%20Build%20%26%20Test/badge.svg)
![Security](https://github.com/yourusername/claude-maestro/workflows/Security%20Audit/badge.svg)
```

---

## Local Validation (Pre-commit)

Before pushing, validate locally:

```bash
# Run all quality checks
npm run lint
npm run test
npm run build

# Security checks
npm audit --production
```

**Recommended**: Setup pre-commit hooks.

---

## Artifact Downloads

### Test Coverage Report
- **Job**: Test
- **Artifact**: Uploaded to Codecov
- **View**: GitHub PR comments

### Build Artifacts
- **Job**: Build
- **Artifact**: `build-artifacts`
- **Retention**: 7 days
- **Contents**: `dist/` directory

### Windows Installer
- **Job**: Package
- **Artifact**: `windows-installer`
- **Retention**: 30 days
- **Contents**: `release/` directory
- **Condition**: Only on `main` push

**Download**: GitHub Actions > Workflow run > Artifacts section

---

## Debugging Workflow Failures

### Test Failures

1. Check **Test job** logs
2. Look for specific test failures
3. Run locally: `npm run test`
4. Fix failing tests
5. Push again

### Build Failures

1. Check **Build job** logs
2. Verify TypeScript errors
3. Run locally: `npm run build`
4. Check for missing dependencies

### Security Failures

1. Check **Security Audit** workflow
2. Identify failing job (dependency, CodeQL, Electron, etc.)
3. Review specific validation errors

**Common fixes:**
- `npm audit fix` - Fix vulnerabilities
- Update Electron security settings
- Remove Node.js imports from renderer
- Update CSP policy

---

## Required Checks

Before merge, these must pass:

- ✅ All tests passing
- ✅ Build successful
- ✅ No high-severity vulnerabilities
- ✅ Electron security validated
- ✅ No license violations
- ✅ CodeQL scan clean

**Branch protection rules** can enforce this.

---

## Workflow Customization

### Change Node Version

Edit in both workflows:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change version here
```

### Add Build Targets

Modify `ci.yml` package job:

```yaml
- name: Package for multiple platforms
  run: npm run package -- --win --linux
```

### Adjust Security Thresholds

Edit `security.yml`:

```yaml
- name: Run npm audit
  run: npm audit --audit-level=high  # Change from moderate
```

---

## Security Scanning Schedule

Current schedule: **Daily at midnight UTC**

Change schedule:

```yaml
schedule:
  - cron: '0 12 * * *'  # Daily at noon UTC
  - cron: '0 0 * * 1'   # Weekly on Monday
```

---

## Integration with Branch Protection

Recommended settings in GitHub:

**Branch protection rules for `main`:**
1. Require pull request reviews (1 approval)
2. Require status checks:
   - `test`
   - `build`
   - `dependency-audit`
   - `electron-security`
3. Require branches to be up to date
4. Include administrators

---

## Monitoring

### View Workflow Runs

GitHub repository → **Actions** tab

**Filter by:**
- Workflow name
- Branch
- Status (success/failure)
- Date range

### Notifications

Configure in GitHub settings:
- Email on workflow failures
- Slack/Discord integration
- GitHub mobile app alerts

---

## Best Practices

1. **Never skip CI**
   - Don't bypass failing checks
   - Fix issues, don't ignore them

2. **Monitor security daily**
   - Review daily scan results
   - Update dependencies regularly

3. **Keep workflows updated**
   - Update actions versions
   - Review GitHub Actions security advisories

4. **Test locally first**
   - Run `npm test` before push
   - Validate build works

5. **Use branch protection**
   - Enforce required checks
   - Prevent direct pushes to `main`

---

## Troubleshooting

### Workflow not running

**Check:**
- Workflow file syntax (YAML)
- Trigger conditions
- Branch name matches

### Jobs skipped

**Reasons:**
- Dependency job failed (build skips if test fails)
- Condition not met (package only runs on main)

### Artifacts not available

**Check:**
- Job completed successfully
- Retention period not expired
- Artifact upload step succeeded

---

## Cost Considerations

**GitHub Actions limits:**
- **Public repos**: Unlimited minutes
- **Private repos**: 2,000 minutes/month (free tier)

**Optimization:**
- Use caching (`cache: 'npm'`)
- Run expensive jobs only on `main`
- Parallel jobs when possible

---

## Future Enhancements

Planned improvements:
- [ ] Automated release creation
- [ ] Multi-platform builds (macOS, Linux)
- [ ] E2E tests integration
- [ ] Performance benchmarking
- [ ] Automated dependency updates (Dependabot)
- [ ] SAST (Static Application Security Testing)
- [ ] Container scanning

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [CodeQL](https://codeql.github.com/)
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [electron-builder](https://www.electron.build/)

---

**Status**: CI/CD pipeline fully configured and operational.
