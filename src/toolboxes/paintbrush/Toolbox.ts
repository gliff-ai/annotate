import { Toolbox, ToolTips } from "@/Toolboxes";
import { imgSrc } from "@/imgSrc";

const ToolboxName: Toolbox = "paintbrush";

const Tools: ToolTips = {
  paintbrush: {
    name: "Paintbrush",
    icon: imgSrc("brush-icon"),
    shortcut: "B",
  },
  eraser: {
    name: "Eraser",
    icon: imgSrc("eraser-icon"),
    shortcut: "E",
  },
  fillbrush: {
    name: "Fill Active Paintbrush",
    icon: imgSrc("fill-icon"),
    shortcut: "F",
  },
  annotationAlpha: {
    name: "Annotation Transparency",
    icon: imgSrc("annotation-transparency"),
    shortcut: "T",
  },
  togglePixels: {
    name: "Show Strokes As Pixels",
    icon: imgSrc("channels-icon"),
    shortcut: "P",
  },
} as const;

export { ToolboxName, Tools };
