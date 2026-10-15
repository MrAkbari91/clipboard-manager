# Clipboard Brain --- Developer 2 Roadmap

## Branch: `feature/clipboard-ui`

### Responsibility

Build the React interface, history cards, search, filters, pinned items,
project views, settings, and renderer tests.

### 1. Branch setup

Start from the same baseline commit that contains
`src/shared/clipboard-contract.ts`:

``` bash
git switch main
git pull
git switch -c feature/clipboard-ui
```

Do not edit `electron/**`, `prisma/**`, preload, IPC handlers, or
database code. Do not write directly to SQLite from React.

### 2. Shared API contract

Use `window.clipboardBrain` and the shared types from
`src/shared/clipboard-contract.ts`. Do not invent a separate API.

Example calls:

``` ts
window.clipboardBrain.getItems({ search: "useState", sort: "newest" });
window.clipboardBrain.copyItem("item-id");
window.clipboardBrain.pinItem("item-id", true);
window.clipboardBrain.deleteItem("item-id");
window.clipboardBrain.setCapturePaused(true);
window.clipboardBrain.getProjects();
window.clipboardBrain.createProject({ name: "React App" });
window.clipboardBrain.assignProject("item-id", "project-id");
```

### 3. Phase A --- UI foundation

-   Build a desktop layout with sidebar, top bar, history list, and
    optional preview panel.
-   Add reusable buttons, inputs, menus, dialogs, badges, and alerts.
-   Add loading, empty, error, and no-results states.
-   Ensure keyboard focus is visible.
-   Keep the design clean and avoid unnecessary dependencies.

Suggested navigation: - All Items - Pinned - Projects - Settings

Only show Tags navigation when tag support exists in the agreed API.

### 4. Phase B --- Clipboard history

-   Load real entries using `getItems()`.
-   Show newest items first.
-   Build cards with content preview, type, timestamp, pinned status,
    and actions.
-   Add Copy, Pin/Unpin, Delete, and Clear History.
-   Subscribe to `onItemAdded` and unsubscribe when the component
    unmounts.
-   Show feedback only after the API operation succeeds.
-   Do not use fake arrays as production persistence.

**Done when:** actual saved items appear, copying works, pin/delete
updates the UI, and failures display helpful errors.

### 5. Phase C --- Search and filters

-   Add keyword search with a clear button.
-   Add content-type filters: All, Text, Code, URL, Color.
-   Add pinned-only filter.
-   Add newest/oldest sorting.
-   Add clear-filters action and no-results state.
-   Avoid stale results if a previous search resolves after a newer one.
-   Coordinate global keyboard shortcuts with Developer 1.

### 6. Phase D --- Projects and pinned items

-   Build a Pinned view backed by real data.
-   Build a project list and project creation dialog.
-   Allow assigning an item to a project.
-   Show items belonging to a project.
-   Add clear empty states.
-   Do not show unfinished controls as working features.

### 7. Phase E --- Settings and privacy

-   Add Pause Capture / Resume Capture using the API.
-   Load the actual capture status when the app opens.
-   Add a Clear History confirmation dialog.
-   Add retention settings only if the backend supports them.
-   Display a privacy note: clipboard data is stored locally and may
    contain sensitive information.
-   Do not send clipboard content to analytics or logs.

### 8. Phase F --- Tests and polish

-   Test search, filters, cards, dialogs, and error states.
-   Test long text, multiline code, Unicode, and emoji.
-   Test keyboard-only navigation and resized windows.
-   Verify every button performs its advertised action.
-   Remove dead controls and placeholder content before merge.

If the backend is not ready, use a development-only mock adapter behind
an interface. Keep it separate from production, and never imply mock
data has been persisted. Remove or disable the mock adapter in the
production build.

### 9. Ownership

Developer 2 owns: - `src/components/**` - `src/features/**` -
`src/pages/**` - `src/hooks/**` - renderer tests and UI documentation

Shared contract changes require agreement with Developer 1.

### 10. Validation and delivery

Run actual repository scripts:

``` bash
npm run lint
npm run typecheck
npm test
npm run build
```

If a script does not exist, report it as unavailable.

Before requesting merge, provide: - Completed UI screens and
interactions. - Integration with the shared API. - Test/build results. -
List of features blocked by missing backend APIs.

### 11. Commit and merge

``` bash
git add src
git commit -m "feat(ui): add clipboard history and search interface"
git push -u origin feature/clipboard-ui
```

Open a pull request. Integrate against Developer 1's real API before
merging.
