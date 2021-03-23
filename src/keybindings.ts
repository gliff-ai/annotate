interface Keybindings {
  [key: string]: string;
}

export const keybindings = {
  Backspace: "deleteSelectedPoint",
  Enter: "changeSplineModeToEdit",
  Escape: "deselectPoint",
} as Keybindings;
