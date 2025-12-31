# Fix Back Button (Missing Icons)

The user reported that the back button in the Reports view "is not working". Analysis of the screenshot shows an empty grey box where the button should be. The code uses FontAwesome icons (`fa-arrow-left`), but there is no detected import or link for FontAwesome in the project's layout or globals.

This likely affects ALL icons in the app (arrows, checks, locks, etc.), causing them to disappear.

## Proposed Changes

### Top Level Layout
#### [MODIFY] [app/layout.tsx](file:///Users/javi/Antigravity_MI/Main2MI/app/layout.tsx)
- Add the FontAwesome CDN link to the `<head>` (or just inside the `<body>` if Next.js `<head>` logic is complex, but standard approach is closest to head).
- Since `app/layout.tsx` is a Server Component, we can just add the `<link>` tag.

## Verification Plan
1.  Apply the fix.
2.  Reload the browser.
3.  Check the Reports View.
4.  Verify the "Back Arrow" icon is visible.
5.  Check other icons (like the "Lock" icons mentioned in the other task) to ensure they are also visible.
