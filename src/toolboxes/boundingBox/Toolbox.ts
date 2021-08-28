import { Toolbox, ToolTips } from "@/Toolboxes";

const ToolboxName: Toolbox = "boundingBox";

const ToolboxTooltips: ToolTips = {
  boundingBox: {
    name: "Rectangular Bounding Box",
    icon: require(`@/assets/bounding-box-icon.svg`) as string,
    shortcut: "R",
  },
} as const;

export { ToolboxName, ToolboxTooltips };
