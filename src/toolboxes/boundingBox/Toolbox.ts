import { Toolbox, ToolTips } from "@/Toolboxes";

const ToolboxName: Toolbox = "boundingBox";

const Tools: ToolTips = {
  boundingBox: {
    name: "Rectangular Bounding Box",
    icon: require(`@/assets/bounding-box-icon.svg`) as string,
    shortcut: "R",
  },
} as const;

export { ToolboxName, Tools };
