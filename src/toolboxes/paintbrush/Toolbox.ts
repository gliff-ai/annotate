import { Toolbox, ToolTips } from "@/Toolboxes";

const ToolboxName: Toolbox = "paintbrush";

const Tools: ToolTips = {
  paintbrush: {
    name: "Paintbrush",
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
} as const;

export { ToolboxName, Tools };
