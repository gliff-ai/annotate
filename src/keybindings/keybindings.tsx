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

// TODO: Icons for backspace etc
const displayNames = (
  isMac = false
): {
  [key: string]: string;
} =>
  ({
    Backspace: "Backspace",
    Escape: "Esc",
    cmdCtrl: isMac ? "CMD" : "CTRL",
    altOption: isMac ? "OPT" : "ALT",
    Slash: "/",
    Backslash: "\\",
    Equal: "=",
    Minus: "-",
    ArrowLeft: "Left",
    ArrowRight: "Right",
  } as Readonly<{
    [key: string]: string;
  }>);

const keybindings = {
  KeyA: ["ui.toggleMode", "Toggle select/draw mode"],

  Equal: ["ui.addAnnotation", "Add new annotation"],
  Minus: ["ui.clearActiveAnnotation", "Clear active annotation"],
  "cmdCtrl+KeyS": ["ui.saveAnnotations", "Save annotations"],
  "altOption+KeyL": ["ui.selectAnnotationLabel", "Show annotation labels"],

  "cmdCtrl+KeyZ": ["ui.undo", "Undo Last Action"],
  "cmdCtrl+KeyY": ["ui.redo", "Redo Last Undo"],

  KeyB: ["paintbrush.selectBrush", "Select Brush tool"],
  KeyE: ["paintbrush.selectEraser", "Select Brush Eraser tool"],
  KeyF: ["paintbrush.fillBrush", "Fill active brush"],
  KeyP: [
    "paintbrush.togglePixelView",
    "Convert vector brush strokes to pixels",
  ],
  KeyT: [
    "paintbrush.toggleShowTransparency",
    "Change paintbrush annotation transparency",
  ],

  KeyS: ["spline.selectSpline", "Select Spline tool"],
  KeyL: ["spline.selectLassoSpline", "Select Lasso Spline tool"],
  "altOption+KeyB": ["spline.selectBezierSpline", "Select Bezier Spline tool"],
  KeyO: ["spline.toggleSplineClosed", "Close active spline"],
  "altOption+C": ["spline.convertSpline", "Convert Spline to paintbrush"],
  Backspace: ["spline.deleteSelectedPoint", "Delete selected spline point"],
  Escape: ["spline.deselectPoint", "Deselect spline point"],

  KeyR: [
    "boundingBox.selectBoundingBox",
    "Select Retangular Bounding Box tool",
  ],

  Backslash: ["ui.selectContrast", "Open Contrast slider"],
  Slash: ["ui.selectBrightness", "Open Brightness slider"],
  KeyC: ["ui.selectChannels", "Open Channel selector"],

  KeyD: ["download.openDownloadDropdown", "Download Annotations"],
  // KeyU: ["download.openDownloadDropdown", "Upload images"], // TODO no method listener for this

  "cmdCtrl+ArrowLeft": ["ui.previousAnnotation", "Select previous annotation"],
  "cmdCtrl+ArrowRight": ["ui.nextAnnotation", "Select next annotation"],

  "cmdCtrl+Digit1": ["minimap.handleDrawerOpen", "Open minimap"],
  "cmdCtrl+Digit2": ["minimap.handleDrawerClose", "Close minimap"],
  "cmdCtrl+Equal": ["ui.incrementScale", "Zoom in"],
  "cmdCtrl+Minus": ["ui.decrementScale", "Zoom out"],

  // Duplicates for NumPad keys
  "cmdCtrl+NumpadAdd": ["ui.incrementScale", "Zoom in"],
  "cmdCtrl+NumpadSubtract": ["ui.decrementScale", "Zoom out"],

  "altOption+Digit0": ["ui.resetScaleAndPan", "Reset zoom and pan"],
  F1: ["ui.openKeybinds", "Open shortcuts"],

  [unassigned()]: ["spline.changeSplineModeToEdit", ""],
} as Readonly<{
  [key: string | symbol]: [NamespacedMethod, string];
}>;

export { keybindings, displayNames };
export type { NamespacedMethod };
