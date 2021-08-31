import { Toolbox, ToolTips } from "@/Toolboxes";
import { imgSrc } from "@/imgSrc";

const ToolboxName: Toolbox = "boundingBox";

const Tools: ToolTips = {
  boundingBox: {
    name: "Rectangular Bounding Box",
    icon: imgSrc("bounding-box-icon"),
    shortcut: "R",
  },
} as const;

export { ToolboxName, Tools };
