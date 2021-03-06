import { Tooltip } from "@gliff-ai/style";
import { BackgroundTools, MinimapTools } from "@/toolboxes/background";
import { PaintbrushTools } from "@/toolboxes/paintbrush";
import { SplineTools } from "@/toolboxes/spline";
import { BoundingBoxTools } from "@/toolboxes/boundingBox";

import { imgSrc } from "@/imgSrc";

type ToolTips = { [name: string]: Tooltip };

const DefaultTools: ToolTips = {
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
  ...BackgroundTools,
  ...MinimapTools,
  ...PaintbrushTools,
  ...BoundingBoxTools,
  ...SplineTools,
};

export { Tools };
