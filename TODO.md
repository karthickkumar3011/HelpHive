# Update Notifications, PostHelp tag suggestions, and loading states

## Status: Completed ✅

## Steps:
1. **✅** Update `client/src/pages/Notifications.jsx`: Icons + links for new types ('help_request'→post, 'hive_*'→/hives/:hiveId).
2. **✅** Update `client/src/pages/PostHelp.jsx`: Keyword suggestions (debounced, fuzzy match presets, chips append).
3. **✅** Enhance Home.jsx: Refresh loading state.
4. **✅** Enhance HiveDetails.jsx: Error/hive-not-found states, refresh btn.
5. **✅** Enhance Hives.jsx: Error state.
6. **✅** Loading/empty/error polished across Home/Hive pages/PostHelp.

## Verification:
- Notifications: Check new types render icons/links.
- PostHelp: Type description → see chips → click adds to tags.
- Refetch: Loading spinners on refresh, meaningful errors.

**All updates complete.** Run `cd client && npm start` to test.

