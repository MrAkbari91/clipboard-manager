# Clipboard Brain --- Developer 1 Roadmap

## Branch: `feature/clipboard-core`

### Responsibility

Build the Electron main process, clipboard capture, local database, IPC
API, and Windows packaging support.

### 1. Branch setup

Create this branch from the agreed baseline commit on `main`:

``` bash
git switch main
git pull
git switch -c feature/clipboard-core
```

Do not edit React UI files owned by Developer 2. Never commit clipboard
content, database files, backups, or secrets.

### 2. Shared API contract

Before parallel work begins, commit a shared contract file at
`src/shared/clipboard-contract.ts`. Both developers must use the same
names and types.

``` ts
export type ClipboardContentType = "text" | "code" | "url" | "color";

export interface ClipboardItem {
  id: string;
  content: string;
  contentType: ClipboardContentType;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  title: string | null;
  projectId: string | null;
}

export interface ClipboardQuery {
  search?: string;
  contentType?: ClipboardContentType | "all";
  pinnedOnly?: boolean;
  projectId?: string | null;
  sort?: "newest" | "oldest";
}

export interface ClipboardBrainAPI {
  getItems(query?: ClipboardQuery): Promise<ClipboardItem[]>;
  copyItem(id: string): Promise<{ success: boolean }>;
  pinItem(id: string, isPinned: boolean): Promise<ClipboardItem>;
  deleteItem(id: string): Promise<{ success: boolean }>;
  clearHistory(): Promise<{ deletedCount: number }>;
  getCaptureStatus(): Promise<{ isPaused: boolean }>;
  setCapturePaused(isPaused: boolean): Promise<{ isPaused: boolean }>;
  onItemAdded(callback: (item: ClipboardItem) => void): () => void;
  getProjects(): Promise<Project[]>;
  createProject(input: { name: string; description?: string }): Promise<Project>;
  assignProject(itemId: string, projectId: string | null): Promise<ClipboardItem>;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}
```

Expose this API as `window.clipboardBrain`. Never expose raw
`ipcRenderer`, Node.js, or database access to the React renderer.

### 3. Phase A --- Electron foundation

-   Configure Electron main, preload, and renderer.
-   Use `contextIsolation: true` and `nodeIntegration: false`.
-   Add explicit, validated IPC handlers.
-   Keep main-process responsibilities separate from React.
-   Handle IPC errors with consistent, understandable messages.

**Done when:** the app opens, React renders, and the renderer cannot
directly access Node.js.

### 4. Phase B --- Clipboard capture

-   Monitor system clipboard text while the app is running.
-   Save only when clipboard text changes.
-   Ignore empty values and handle long text safely.
-   Detect basic types: URL, hex color, likely code, or plain text.
-   Emit a new-item event to the UI.
-   Add pause/resume capture.
-   Stop timers and listeners when quitting.
-   Never log clipboard content in production.

**Done when:** a new copied value is saved once, pause works, and
restarting the app does not erase history. Capture is not guaranteed
while the app is fully closed.

### 5. Phase C --- SQLite persistence

-   Store the database under Electron's `app.getPath("userData")`, not
    inside the installation folder.
-   Create versioned migrations and safe first-run initialization.
-   Implement list, update, pin, delete, and clear operations.
-   Add projects and item/project assignment.
-   Add indexes for search and sorting.
-   Handle database errors without silently losing data.
-   Test native SQLite/Prisma dependencies in packaged Electron builds.

Suggested tables: - `ClipboardItem`: content, type, timestamps, pinned
status, title, optional project ID. - `Project`: name, description,
creation date. - `Tag`: tag name. - `ClipboardItemTag`: relation between
items and tags.

**Done when:** a clean install creates a database, data persists after
restart, and migrations do not silently wipe records.

### 6. Phase D --- Search and filters

Implement the shared `getItems(query)` API: - Keyword search across
content and title. - Filter by content type, pinned status, and
project. - Sort newest or oldest. - Return stable, predictable
results. - Keep performance acceptable for large histories.

### 7. Phase E --- Privacy and packaging

-   Implement pause/resume and clear-history.
-   Add a configurable history limit if agreed for the MVP.
-   Exclude local databases and backups from Git.
-   Configure electron-builder.
-   Test first-run database creation on a clean Windows account.
-   Verify app upgrades preserve user data.
-   Clearly document that clipboard history stays local.

### 8. Ownership

Developer 1 owns: - `electron/**` - `prisma/**` - Electron/database/IPC
configuration - Main-process tests and documentation

Coordinate shared contract changes with Developer 2 before modifying
them.

### 9. Validation and delivery

Run actual scripts available in the repository:

``` bash
npm run lint
npm run typecheck
npm test
npm run build
```

Do not claim a missing script passed. Report unavailable checks
honestly.

Before requesting merge, provide: - Working clipboard capture and local
persistence. - IPC API matching the shared contract. - Test/build
results. - Known limitations and clean-machine test steps.

### 10. Commit and merge

``` bash
git add electron prisma package.json
git commit -m "feat(core): add clipboard capture and local persistence"
git push -u origin feature/clipboard-core
```

Open a pull request. Do not merge until integration checks pass.
