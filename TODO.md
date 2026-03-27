# Vercel Frontend Deployment Fix Plan

## Status: ESLint Build Errors

**Information Gathered:**
- Build failed: ESLint warnings → errors in CI
- Files: Explore.jsx (deps), Notifications.jsx (deps), PostHelp.jsx (deps), Profile.jsx (unused)

**Plan:**
1. Fix `client/src/pages/Explore.jsx`: Add `searchTimeout` to deps
2. Fix `client/src/pages/Notifications.jsx`: Add `fetchNotifications` to deps or disable
3. Fix `client/src/pages/PostHelp.jsx`: Add `keywordHints` dep or disable
4. Fix `client/src/pages/Profile.jsx`: Remove unused imports/state
5. `cd client && npm run build` test
6. `git add . && git commit -m "Fix ESLint for Vercel" && git push` → auto-deploy

**Dependent Files:** None

**Followup:** Test https://helphive-community-xxx.vercel.app

Approve to proceed with edits?

