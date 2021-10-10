import { Toolbox, ToolTips } from "@/Toolboxes";
import { imgSrc } from "@/imgSrc";

const ToolboxName: Toolbox = "spline";

const Tools: ToolTips = {
  spline: {
    name: "Spline",
    icon: imgSrc("spline-icon"),
    shortcut: "S",
  },
  lassospline: {
    name: "Lasso Spline",
    icon: imgSrc("lasso-spline-icon"),
    shortcut: "O",
  },
  magicspline: {
    name: "Magic Spline",
    icon: imgSrc("magic-spline-icon"),
    shortcut: "M",
  },
  closespline: {
    name: "Close Active Spline",
    icon: imgSrc("close-spline-icon"),
    shortcut: "L",
  },
  convertspline: {
    name: "Convert Spline To Paintbrush",
    icon: imgSrc("convert-icon"),
    shortcut: "CTRL",
    shortcutSymbol: "Q",
  },
  fillspline: {
    name: "Convert Spline to Paintbrush and Fill",
    icon: imgSrc("fill-icon"),
    shortcut: "CTRL",
    shortcutSymbol: "F",
  },
} as const;

export { ToolboxName, Tools };
