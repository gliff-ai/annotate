import { CSSProperties } from "react";

interface ToolTip {
  name: string;
  icon: string;
  shortcut?: string;
  shortcutSymbol?: string;
  styling?: CSSProperties;
}
type ToolTips = { [name: string]: ToolTip };

const tooltips: ToolTips = {
  minimiseMap: {
    name: "Minimise Map",
    icon: require(`./assets/minimise-icon.svg`) as string,
    shortcut: "ALT",
    shortcutSymbol: "-",
    styling: { marginRight: "132px" },
  },
  maximiseMap: {
    name: "Maximise Map",
    icon: require("./assets/maximise-icon.svg") as string,
    shortcut: "ALT",
    shortcutSymbol: "+",
  },
  zoomIn: {
    name: "Zoom In",
    icon: require(`./assets/zoom-in-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "+",
    styling: { marginRight: "10px" },
  },
  zoomOut: {
    name: "Zoom Out",
    icon: require(`./assets/zoom-out-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "-",
    styling: { marginRight: "10px" },
  },
  fitToPage: {
    name: "Fit to Page",
    icon: require(`./assets/reset-zoom-and-pan-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "]",
  },
  addNewAnnotation: {
    name: "Add New Annotation",
    icon: require(`./assets/new-annotation-icon.svg`) as string,
    shortcut: "=",
  },
  clearAnnotation: {
    name: "Clear Annotation",
    icon: require(`./assets/delete-annotation-icon.svg`) as string,
    shortcut: "-",
  },
  select: {
    name: "Select",
    icon: require(`./assets/select-icon.svg`) as string,
    shortcut: "A",
  },
  paintbrush: {
    name: "Brush",
    icon: require(`./assets/brush-icon.svg`) as string,
    shortcut: "B",
  },
  eraser: {
    name: "Eraser",
    icon: require(`./assets/eraser-icon.svg`) as string,
    shortcut: "E",
  },
  spline: {
    name: "Spline",
    icon: require(`./assets/splines-icon.svg`) as string,
    shortcut: "S",
  },
  magicspline: {
    name: "Magic Spline",
    icon: require(`./assets/magic-spline-icon.svg`) as string,
    shortcut: "M",
  },
  contrast: {
    name: "Contrast",
    icon: require(`./assets/contrast-icon.svg`) as string,
    shortcut: `\\`,
  },
  brightness: {
    name: "Brightness",
    icon: require(`./assets/brightness-icon.svg`) as string,
    shortcut: `/`,
  },
  channels: {
    name: "Channels",
    icon: require(`./assets/channels-icon.svg`) as string,
    shortcut: `C`,
  },
  labels: {
    name: "Annotation Label",
    icon: require(`./assets/annotation-label-icon.svg`) as string,
    shortcut: "L",
  },
};

export { ToolTip, ToolTips, tooltips };
