---
description: Analyze changes, validate architecture and security, then create a well-structured commit
---

# Commit Command - Architectural Commit Process

When the user requests a commit, follow this **mandatory** process.

## 🔍 Phase 1: Analysis (REQUIRED)

### 1.1 Gather Context
```bash
# Check current status
git status

# Review staged changes
git diff --cached

# Review unstaged changes (if needed)
git diff

# Check recent commits for message style
git log --oneline -5
```

### 1.2 Analyze Changes

For EACH modified file, identify:
- **What changed**: Technical change description
- **Why it matters**: Architectural/functional impact
- **Risk level**: Security, breaking changes, technical debt

---

## ⛔ Phase 2: Validation Gates (BLOCKING)

### Gate 1: Electron Security

**BLOCK if ANY of these are violated:**

```typescript
// ❌ BLOCKING VIOLATIONS
- renderer/ accessing fs, path, child_process
- preload/ with business logic (> 50 lines)
- contextBridge exposing Node modules directly
- ipcRenderer used outside preload
- contextIsolation: false
- nodeIntegration: true
- sandbox: false (without justification)
```

**If blocked**: Explain violation, suggest fix, **do NOT commit**.

---

### Gate 2: Architecture Separation

**BLOCK if responsibilities are mixed:**

| Location | Allowed | Forbidden |
|----------|---------|-----------|
| `main/` | Services, IPC handlers, system APIs | React, DOM, UI logic |
| `preload/` | contextBridge only | Business logic, FS ops |
| `renderer/` | React, UI, styling | Node.js APIs, direct IPC |
| `shared/` | Types, contracts, constants | Implementation, logic |

**Examples that BLOCK:**
- File I/O in `renderer/`
- React components in `main/`
- Database logic in `preload/`
- IPC handler in `shared/`

---

### Gate 3: Type Safety & IPC

**BLOCK if:**
- New IPC channel without contract in `shared/ipc-contracts.ts`
- IPC channel not in `shared/ipc-channels.ts`
- `any` types without explicit justification comment
- Unvalidated IPC inputs in handlers

---

### Gate 4: Unit Tests

**BLOCK if new code without tests:**

**All new code MUST have unit tests:**
- New service → `.test.ts` file with ≥80% coverage
- New IPC handler → Test all channels and error cases
- New React component → `.test.tsx` with user interactions
- New utility function → Test all branches

**Required test validation:**

```bash
# Run tests before commit
npm run test
```

**BLOCK if:**
- New `.ts` file without corresponding `.test.ts`
- New `.tsx` file without corresponding `.test.tsx`
- Tests fail or error
- Coverage <80% for new files
- Critical path (IPC, security) not 100% covered

**Test file must be in same directory as source:**
```
src/main/services/new-service.ts
src/main/services/new-service.test.ts  ← REQUIRED
```

**If blocked**: Write tests first, verify they pass, then commit.

---

### Gate 5: Documentation

**BLOCK if structural change without docs:**

| Change Type | Required Documentation |
|-------------|----------------------|
| New service | Update `.wiki/architecture.md` |
| New IPC endpoint | Update `.wiki/examples.md` |
| Security pattern | Update `.wiki/security-checklist.md` |
| Build change | Update `.wiki/commands.md` |
| New convention | Create/update relevant `.wiki/` file |

**If docs missing**: Request documentation first, **do NOT commit**.

---

### Gate 6: Code Quality

**BLOCK if:**
- Obvious dead code introduced
- Console.log spam (>3 debug logs)
- Commented-out code blocks (>10 lines)
- Broken imports/references
- TypeScript errors ignored

---

## ✅ Phase 3: Decision

After all gates:

### ✅ APPROVED
- All gates passed
- Changes are coherent
- Risk is acceptable
- Documentation adequate

→ Proceed to Phase 4

### ⛔ BLOCKED
- Any gate failed
- Architectural concerns
- Security issues
- Missing documentation

→ **Stop here**, explain issues, suggest fixes, **do NOT create commit**

---

## 📝 Phase 4: Commit Message (If Approved)

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type (REQUIRED)
- `feat` - New feature or capability
- `fix` - Bug fix
- `refactor` - Code restructuring (no behavior change)
- `docs` - Documentation only
- `chore` - Build, deps, tooling
- `test` - Test additions/changes
- `security` - Security-related changes

### Scope (RECOMMENDED)
- `main` - Main process changes
- `renderer` - UI/React changes
- `preload` - Preload script
- `ipc` - IPC system
- `settings` - Settings manager
- `logger` - Logging
- `build` - Build/packaging
- `security` - Security measures

### Subject (REQUIRED)
- Imperative mood ("add", not "added" or "adds")
- No period at end
- Max 50 chars
- Start lowercase
- Be specific

**Good:**
- `feat(ipc): add file upload endpoint with validation`
- `fix(renderer): prevent XSS in user input display`
- `refactor(main): extract window state to service`

**Bad:**
- `wip`
- `fixes`
- `changes`
- `update stuff`
- `commit before leaving`

### Body (OPTIONAL)
- Explain WHY, not WHAT (code shows what)
- Mention architectural decisions
- Reference security implications
- Keep lines under 72 chars

### Footer (OPTIONAL)
- Breaking changes: `BREAKING CHANGE: description`
- References: `Refs: #123`
- Security: `Security: description`

---

## 🎯 Phase 5: Execution

### Create the commit
```bash
git add <files>

git commit -m "$(cat <<'EOF'
<generated message>
EOF
)"
```

### Verify
```bash
git log -1 --stat
git show HEAD
```

### Report to user
- Commit hash
- Files changed
- Summary of what was committed
- Any warnings or notes

---

## 🚫 Prohibited Behaviors

Claude **MUST NEVER**:

1. ❌ Commit without analyzing diff
2. ❌ Skip validation gates "to save time"
3. ❌ Approve insecure code "because it works"
4. ❌ Create vague commit messages
5. ❌ Commit incomplete features as "wip"
6. ❌ Ignore architectural violations
7. ❌ Commit undocumented structural changes
8. ❌ Use generic messages like "updates", "fixes", "changes"

---

## 🧠 Decision Framework

When uncertain:

```
Is this change architecturally sound?
├─ No → BLOCK
└─ Yes → Is it secure?
    ├─ No → BLOCK
    └─ Yes → Is it documented?
        ├─ No → BLOCK (if structural)
        └─ Yes → Is code quality acceptable?
            ├─ No → BLOCK
            └─ Yes → APPROVED
```

**Default stance: BLOCK**

Only approve when **confident** all criteria are met.

---

## 📋 Checklist Template

Use this for each commit request:

```
□ Git diff analyzed
□ Security validated (contextIsolation, nodeIntegration, etc.)
□ Architecture separation verified (main/preload/renderer/shared)
□ IPC contracts typed and registered
□ Unit tests written and passing (npm run test)
□ Test coverage adequate (≥80% for new files)
□ Documentation updated (if structural change)
□ Code quality acceptable
□ Commit message prepared
□ Decision: [APPROVED/BLOCKED]
```

---

## 🎭 Tone & Posture

Claude should be:

- **Critical**: Look for problems, not reasons to approve
- **Direct**: No sugarcoating, no apologies
- **Technical**: Focus on facts, not opinions
- **Impersonal**: Not "I think", but "This violates X"

**Not this:**
> "Great changes! I'll commit this for you 😊"

**But this:**
> "Validation passed. Creating commit with message: feat(ipc): add validated file upload endpoint"

**Or this:**
> "BLOCKED. Renderer at src/renderer/App.tsx:42 directly imports 'fs'. Move to main service."

---

## 💡 Examples

### Example 1: Approved Commit

**User**: "commit this"

**Claude Response**:
```
Analyzing changes...

Files modified:
- src/main/services/file-service.ts (new)
- src/main/ipc-handlers.ts (+15 lines)
- src/shared/ipc-channels.ts (+1)
- src/shared/ipc-contracts.ts (+8)
- .wiki/architecture.md (+12 lines)

Validation:
✅ Security: No violations
✅ Architecture: Service in main/, IPC properly separated
✅ Type Safety: Full contracts defined
✅ Documentation: Architecture updated
✅ Code Quality: Clean, no dead code

Creating commit:

feat(main): add file upload service with validation

Implements secure file upload via IPC:
- Input validation (path traversal prevention)
- File type whitelist
- Size limits enforced
- Documented in architecture.md

[abc123] feat(main): add file upload service with validation
 5 files changed, 36 insertions(+)
```

---

### Example 2: Blocked Commit

**User**: "commit"

**Claude Response**:
```
Analyzing changes...

Files modified:
- src/renderer/src/App.tsx (+8 lines)

Validation:
❌ BLOCKED - Security violation

Location: src/renderer/src/App.tsx:42
Issue: Direct import of Node.js 'fs' module in renderer

const fs = require('fs');  // ❌ VIOLATION
fs.readFileSync('/path');

Why this is blocked:
- Renderer must not access Node.js APIs directly
- Violates contextIsolation security model
- Breaks main/renderer separation

Required fix:
1. Move file reading to src/main/services/file-service.ts
2. Expose via IPC in src/main/ipc-handlers.ts
3. Call from renderer via window.api.invoke()

Commit BLOCKED. Please fix violations and try again.
```

---

### Example 3: Missing Documentation Block

**User**: "commit the new service"

**Claude Response**:
```
Analyzing changes...

Files modified:
- src/main/services/database-service.ts (new, 156 lines)
- src/main/ipc-handlers.ts (+42 lines)

Validation:
❌ BLOCKED - Missing documentation

New architectural component detected:
- Database service introduced (156 lines)
- New IPC pattern for queries
- State management approach changed

Required documentation:
1. Update .wiki/architecture.md
   - Add database service to architecture diagram
   - Document connection pooling strategy
   - Explain query pattern

2. Update .wiki/examples.md
   - Add database query example
   - Document error handling pattern

3. Consider creating .wiki/database.md
   - Schema documentation
   - Migration strategy
   - Backup approach

Commit BLOCKED. Document architectural changes first.
```

---

## 🔒 Security-Specific Blocks

If security violation detected, use this format:

```
🔒 SECURITY BLOCK

Violation: [specific issue]
Location: [file:line]
Severity: [HIGH/MEDIUM/LOW]

Risk:
[explain the security risk]

Required fix:
[specific remediation steps]

Reference: .wiki/security-checklist.md section [X]
```

---

## 🎯 Success Criteria

A commit is successful when:

1. ✅ All validation gates passed
2. ✅ Message is clear and follows convention
3. ✅ User understands what was committed
4. ✅ No architectural debt introduced
5. ✅ Documentation is current

---

## 📌 Final Rule

> **Every commit is permanent. No commit without confidence.**

When in doubt: **BLOCK**.

Ask questions, request fixes, demand documentation.

**Better to block 10 good commits than approve 1 bad one.**

---

**This is not a suggestion. This is the process.**
