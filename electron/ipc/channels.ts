export const IPC_CHANNELS = {
  GET_ITEMS: "clipboard:get-items",
  COPY_ITEM: "clipboard:copy-item",
  PIN_ITEM: "clipboard:pin-item",
  DELETE_ITEM: "clipboard:delete-item",
  CLEAR_HISTORY: "clipboard:clear-history",
  GET_CAPTURE_STATUS: "clipboard:get-capture-status",
  SET_CAPTURE_PAUSED: "clipboard:set-capture-paused",
  ITEM_ADDED: "clipboard:item-added",
  GET_PROJECTS: "clipboard:get-projects",
  CREATE_PROJECT: "clipboard:create-project",
  ASSIGN_PROJECT: "clipboard:assign-project",
  OPEN_STORAGE_FOLDER: "clipboard:open-storage-folder",
} as const;
