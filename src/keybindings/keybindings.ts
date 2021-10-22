// Keys are defined here: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
// Modifiers are added by prefixing "shift" | "cmdCtrl" | "altOption" and then + the main key
// eg cmdCtrl+KeyA

// We have cmdCtrl and altOption which dynamically use the correct buttons to make it feel correct on a Mac/Non Mac

// WARNING Shortcuts containing 3 or more keys will NOT have them all shown in the tooltips
// Modifiers can be combined, but the order of modifier keys matters, they should be in alphabetical order
// eg alt+shift+KeyA

type NamespacedMethod = `${
  | "ui"
  | "download"
  | "paintbrush"
  | "background"
  | "boundingBox"
  | "spline"
  | "minimap"}.${string}`;

const unassigned = () => Symbol(null);

// TODO: all of these!
const displayNames = (
  isMac = false
): {
  [key: string]: string;
} =>
  ({
    Backspace: "&#x232b;",
    cmdCtrl: isMac ? "CMD" : "CTRL",
    altOption: isMac ? "OPT" : "ALT",
    Slash: "/",
    Equal: "=",
    Minus: "-",
  } as Readonly<{
    [key: string]: string;
  }>);

const keybindings = {
  Equal: ["ui.addAnnotation", ""],
  Minus: ["ui.clearActiveAnnotation", ""],
  KeyA: ["ui.toggleMode", ""],
  KeyB: ["paintbrush.selectBrush", ""],
  KeyE: ["paintbrush.selectEraser", ""],
  KeyP: ["paintbrush.togglePixelView", ""],
  KeyS: ["spline.selectSpline", ""],
  KeyD: ["download.openDownloadDropdown", ""],
  Backslash: ["ui.selectContrast", ""],
  Slash: ["ui.selectBrightness", ""],
  KeyC: ["ui.selectChannels", ""],
  "cmdCtrl+Space": ["ui.selectAnnotationLabel", ""],
  Backspace: ["spline.deleteSelectedPoint", ""],
  Escape: ["spline.deselectPoint", ""],
  "cmdCtrl+KeyS": ["ui.saveAnnotations", ""],
  "cmdCtrl+KeyQ": ["spline.convertSpline", ""],
  "cmdCtrl+KeyZ": ["ui.undo", ""],
  "cmdCtrl+KeyY": ["ui.redo", ""],
  "cmdCtrl+ArrowLeft": ["ui.previousAnnotation", ""],
  "cmdCtrl+ArrowRight": ["ui.nextAnnotation", ""],
  "altOption+Equal": ["minimap.handleDrawerOpen", ""],
  "altOption+Minus": ["minimap.handleDrawerClose", ""],
  "altOption+Digit1": ["ui.incrementScale", ""],
  "altOption+Digit2": ["ui.decrementScale", ""],
  "altOption+Digit3": ["ui.resetScaleAndPan", ""],

  [unassigned()]: ["spline.changeSplineModeToEdit", ""],
  [unassigned()]: ["spline.closeSpline", ""],
} as Readonly<{
  [key: string | symbol]: [NamespacedMethod, string];
}>;

export { keybindings, displayNames };
export type { NamespacedMethod };
