// Keys are defined here: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
// Modifiers are added by prefixing "alt" | "ctrl" | "meta" | "shift" and then + the main key
// eg ctrl+KeyA
// Modifiers can be combined, but the order of modifier keys matters, they should be in alphabetical order
// eg alt+shift+KeyA

export const keybindings = {
  Equal: "ui.addAnnotation",
  Minus: "ui.clearActiveAnnotation",
  KeyA: "ui.toggleMode",
  KeyB: "paintbrush.selectBrush",
  KeyE: "paintbrush.selectEraser",
  KeyS: "spline.selectSpline",
  KeyM: "spline.selectMagicspline",
  KeyD: "download.openDownloadDropdown",
  Backslash: "ui.selectContrast",
  Slash: "ui.selectBrightness",
  KeyC: "ui.selectChannels",
  KeyL: "ui.selectAnnotationLabel",
  Backspace: "spline.deleteSelectedPoint",
  Enter: "spline.changeSplineModeToEdit",
  Escape: "spline.deselectPoint",
  "ctrl+KeyS": "ui.saveAnnotations",
  "ctrl+KeyC": "spline.closeLoop",
  "ctrl+ArrowLeft": "ui.previousAnnotation",
  "ctrl+ArrowRight": "ui.nextAnnotation",
  "alt+Equal": "minimap.handleDrawerOpen",
  "alt+Minus": "minimap.handleDrawerClose",
  "alt+Digit1": "ui.incrementScale",
  "alt+Digit2": "ui.decrementScale",
  "alt+Digit3": "ui.resetScaleAndPan",
} as Readonly<{
  [key: string]: string;
}>;
