# Journal.js Fixes TODO

## Issues to Fix

1. **Page navigation (pagination)**: When loading more entries, it replaces the existing entries instead of appending them.
2. **Tab switching**: When switching to different tabs (Entries, Timeline, etc.), the data isn't loaded automatically.
3. **Search functionality**: The searchEntries function is not implemented.
4. **Duplicate event listeners**: There are conflicting event listeners for quick mood buttons between HTML and JS.

## Plan

- [ ] Modify `displayEntries` to append entries when `loadMoreEntries` is called.
- [ ] Add event listeners for tab switching to load relevant data.
- [ ] Implement the `searchEntries` function.
- [ ] Remove duplicate event listeners from the HTML script section.

## Dependent Files

- `public/js/journal.js` (main fixes)
- `views/journal.hbs` (remove duplicate listeners)

## Followup steps

- [ ] Test pagination by loading more entries.
- [ ] Test tab switching and data loading.
- [ ] Test search functionality.
- [ ] Verify saving and mood logging still work.
