import { icons } from "@gliff-ai/style";
import { Toolbox, ToolTips } from "@/Toolboxes";

const ToolboxName: Toolbox = "paintbrush";

const Tools: ToolTips = {
  paintbrush: {
    name: "Paintbrush",
    icon: icons.brush,
    shortcut: "B",
  },
  eraser: {
    name: "Eraser",
    icon: icons.eraser,
    shortcut: "E",
  },
  fillbrush: {
    name: "Fill Active Paintbrush",
    icon: icons.fill,
    shortcut: "F",
  },
  annotationAlpha: {
    name: "Annotation Transparency",
    icon: icons.brush, // TODO: replace
    shortcut: "T",
  },
  togglePixels: {
    name: "Show strokes as pixels",
    icon: icons.channels,
    shortcut: "P",
  },
} as const;

export { ToolboxName, Tools };
