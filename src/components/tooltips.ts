interface ToolTip {
  name: string;
  icon: string;
  shortcut?: string;
  shortcutSymbol?: string;
}
type ToolTips = { [name: string]: ToolTip };

const tooltips: ToolTips = {
  minimiseMap: {
    name: "Minimise Map",
    icon: require(`@/assets/minimise-icon.svg`) as string,
    shortcut: "ALT",
    shortcutSymbol: "-",
  },
  maximiseMap: {
    name: "Maximise Map",
    icon: require("../assets/maximise-icon.svg") as string,
    shortcut: "ALT",
    shortcutSymbol: "=",
  },
  zoomIn: {
    name: "Zoom In",
    icon: require(`@/assets/zoom-in-icon.svg`) as string,
    shortcut: "ALT",
    shortcutSymbol: "1",
  },
  zoomOut: {
    name: "Zoom Out",
    icon: require(`@/assets/zoom-out-icon.svg`) as string,
    shortcut: "ALT",
    shortcutSymbol: "2",
  },
  fitToPage: {
    name: "Fit to Page",
    icon: require(`@/assets/reset-zoom-and-pan-icon.svg`) as string,
    shortcut: "ALT",
    shortcutSymbol: "3",
  },
  addNewAnnotation: {
    name: "Add New Annotation",
    icon: require(`@/assets/new-annotation-icon.svg`) as string,
    shortcut: "=",
  },
  clearAnnotation: {
    name: "Clear Annotation",
    icon: require(`@/assets/delete-annotation-icon.svg`) as string,
    shortcut: "-",
  },
  select: {
    name: "Select",
    icon: require(`@/assets/select-icon.svg`) as string,
    shortcut: "A",
  },
  paintbrush: {
    name: "Brush",
    icon: require(`@/assets/brush-icon.svg`) as string,
    shortcut: "B",
  },
  eraser: {
    name: "Eraser",
    icon: require(`@/assets/eraser-icon.svg`) as string,
    shortcut: "E",
  },
  fillbrush: {
    name: "Fill Active Paintbrush",
    icon: require(`@/assets/fill-icon.svg`) as string,
    shortcut: "F",
  },
  spline: {
    name: "Spline",
    icon: require(`@/assets/spline-icon.svg`) as string,
    shortcut: "S",
  },
  lassospline: {
    name: "Lasso Spline",
    icon: require(`@/assets/lasso-spline-icon.svg`) as string,
    shortcut: "O",
  },
  magicspline: {
    name: "Magic Spline",
    icon: require(`@/assets/magic-spline-icon.svg`) as string,
    shortcut: "M",
  },
  closespline: {
    name: "Close Active Spline",
    icon: require(`@/assets/close-spline-icon.svg`) as string,
    shortcut: "L",
  },
  convertspline: {
    name: "Convert Spline to Paintbrush",
    icon: require(`@/assets/convert-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "Q",
  },
  fillspline: {
    name: "Convert Spline to Paintbrush and Fill",
    icon: require(`@/assets/fill-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "F",
  },
  boundingBox: {
    name: "Rectangular Bounding Box",
    icon: require(`@/assets/bounding-box-icon.svg`) as string,
    shortcut: "R",
  },
  contrast: {
    name: "Contrast",
    icon: require(`@/assets/contrast-icon.svg`) as string,
    shortcut: `\\`,
  },
  brightness: {
    name: "Brightness",
    icon: require(`@/assets/brightness-icon.svg`) as string,
    shortcut: "/",
  },
  channels: {
    name: "Channels",
    icon: require(`@/assets/channels-icon.svg`) as string,
    shortcut: "C",
  },
  labels: {
    name: "Annotation Label",
    icon: require(`@/assets/annotation-label-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "Space",
  },
  download: {
    name: "Download annotations",
    icon: require("../assets/download-icon.svg") as string,
    shortcut: "D",
  },
  upload: {
    name: "Upload images",
    icon: require(`@/assets/upload-icon.svg`) as string,
    shortcut: "U",
  },
  save: {
    name: "Save annotations",
    icon: require(`@/assets/save-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "S",
  },
} as const;

export { ToolTip, ToolTips, tooltips };
