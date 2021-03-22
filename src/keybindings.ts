interface Keybindings {
  [key: string]: string;
}

export const keybindings = {
  Backspace: "deleteSelectedPoint",
  Enter: "changeSplineModeToEdit",
  Escape: "removePointSelection",
} as Keybindings;
