import { Tooltip } from "@gliff-ai/style";
import { PaintbrushToolbox } from "@/toolboxes/paintbrush";
import { SplineToolbox } from "@/toolboxes/spline";
import { BoundingBoxToolbox } from "@/toolboxes/boundingBox";

type ToolTips = { [name: string]: Tooltip };

const DefaultTools: ToolTips = {
  minimiseMap: {
    name: "Minimise Map",
    icon: require(`@/assets/minimise-icon.svg`) as string,
    shortcut: "ALT",
    shortcutSymbol: "-",
  },
  maximiseMap: {
    name: "Maximise Map",
    icon: require("@/assets/maximise-icon.svg") as string,
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
    icon: require("@/assets/download-icon.svg") as string,
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
  undo: {
    name: "Undo last action",
    icon: require(`@/assets/undo-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "Z",
  },
  redo: {
    name: "Redo last action",
    icon: require(`@/assets/redo-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "Y",
  },
} as const;

const tools = {
  ...DefaultTools,
  ...PaintbrushToolbox,
  ...BoundingBoxToolbox,
  ...SplineToolbox,
};

export { tools };
