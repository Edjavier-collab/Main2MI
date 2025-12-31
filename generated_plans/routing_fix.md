# Fix Account Creation & Routing

The user reported "unable to create an account". We identified two potential causes:
1.  **Routing 404s**: The app uses client-side routing (`/login`, etc.) but the Next.js server (App Router) only handles `/`. Refreshing or external links to `/login` result in 404. This breaks the auth flow if redirects or refreshes occur.
2.  **Navigation Logic**: `LoginView` depends on side-effects for navigation. Explicitly connecting `onLogin` to navigation is safer.

## Proposed Changes

### Routing
#### [NEW] [page.tsx](file:///Users/javi/Antigravity_MI/Main2MI/app/[...slug]/page.tsx)
- Create a catch-all route that renders the same application entry point as the root page. This ensures all client-side routes (like `/login`, `/upgrade`) are handled by the single-page application logic instead of 404ing.

### Components
#### [MODIFY] [ViewRenderer.tsx](file:///Users/javi/Antigravity_MI/Main2MI/components/views/ViewRenderer.tsx)
- Update `ViewRenderer` to pass `onNavigate(View.Dashboard)` to `LoginView`'s `onLogin` prop, ensuring explicit navigation upon successful auth action.

## Verification Plan

### Manual Verification
1.  Run `npm run dev`.
2.  Navigate to `/login` manually from the address bar. Verify it loads the Login view instead of 404.
3.  Refresh the page while on `/login` or `/upgrade`. Verify it reloads the app correctly.
4.  Test the "Sign Up" flow (using mock mode or real credentials if available) and verify it lands on Dashboard or Confirmation screen.
