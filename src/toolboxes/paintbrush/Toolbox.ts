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
} as const;

export { ToolboxName, Tools };
