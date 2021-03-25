// Keys are defined here: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
// Modifiers are added by prefixing "alt" | "ctrl" | "meta" | "shift" and then + the main key
// eg ctrl+KeyA
// Modifiers can be combined, but the order of modifier keys matters, they should be in alphabetical order
// eg alt+shift+KeyA

export const keybindings = {
  Backspace: "spline.deleteSelectedPoint",
  Enter: "spline.changeSplineModeToEdit",
  Escape: "spline.deselectPoint",
  "ctrl+KeyC": "spline.closeLoop",
  "ctrl+ArrowLeft": "ui.previousAnnotation",
  "ctrl+ArrowRight": "ui.nextAnnotation",
} as Readonly<{
  [key: string]: string;
}>;
