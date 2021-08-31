import type { Tooltip } from "@gliff-ai/style";

import { PaintbrushToolbox } from "@/toolboxes/paintbrush";
import { SplineToolbox } from "@/toolboxes/spline";
import { BoundingBoxToolbox } from "@/toolboxes/boundingBox";

import {imgSrc} from "@/imgSrc";

type ToolTips = { [name: string]: Tooltip };

const DefaultTools: ToolTips = {
  minimiseMap: {
    name: "Minimise Map",
    icon: imgSrc("minimise-icon"),
    shortcut: "ALT",
    shortcutSymbol: "-",
  },
  maximiseMap: {
    name: "Maximise Map",
    icon: imgSrc("/maximise-icon"),
    shortcut: "ALT",
    shortcutSymbol: "=",
  },
  zoomIn: {
    name: "Zoom In",
    icon: imgSrc("zoom-in-icon"),
    shortcut: "ALT",
    shortcutSymbol: "1",
  },
  zoomOut: {
    name: "Zoom Out",
    icon: imgSrc("zoom-out-icon"),
    shortcut: "ALT",
    shortcutSymbol: "2",
  },
  fitToPage: {
    name: "Fit to Page",
    icon: imgSrc("reset-zoom-and-pan-icon"),
    shortcut: "ALT",
    shortcutSymbol: "3",
  },
  addNewAnnotation: {
    name: "Add New Annotation",
    icon: imgSrc("new-annotation-icon"),
    shortcut: "=",
  },
  clearAnnotation: {
    name: "Clear Annotation",
    icon: imgSrc("delete-annotation-icon"),
    shortcut: "-",
  },
  select: {
    name: "Select",
    icon: imgSrc("select-icon"),
    shortcut: "A",
  },
  contrast: {
    name: "Contrast",
    icon: imgSrc("contrast-icon"),
    shortcut: `\\`,
  },
  brightness: {
    name: "Brightness",
    icon: imgSrc("brightness-icon"),
    shortcut: "/",
  },
  channels: {
    name: "Channels",
    icon: imgSrc("channels-icon"),
    shortcut: "C",
  },
  labels: {
    name: "Annotation Label",
    icon: imgSrc("annotation-label-icon"),
    shortcut: "CTRL",
    shortcutSymbol: "Space",
  },
  download: {
    name: "Download annotations",
    icon: imgSrc("download-icon"),
    shortcut: "D",
  },
  upload: {
    name: "Upload images",
    icon: imgSrc("upload-icon"),
    shortcut: "U",
  },
  save: {
    name: "Save annotations",
    icon: imgSrc("save-icon"),
    shortcut: "CTRL",
    shortcutSymbol: "S",
  },
  undo: {
    name: "Undo last action",
    icon: imgSrc("undo-icon"),
    shortcut: "CTRL",
    shortcutSymbol: "Z",
  },
  redo: {
    name: "Redo last action",
    icon: imgSrc("redo-icon"),
    shortcut: "CTRL",
    shortcutSymbol: "Y",
  },
} as const;

const Tools: ToolTips = {
  ...DefaultTools,
  ...PaintbrushToolbox,
  ...BoundingBoxToolbox,
  ...SplineToolbox,
};

export { Tools };
