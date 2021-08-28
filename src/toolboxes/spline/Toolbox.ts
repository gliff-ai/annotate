import { Toolbox, ToolTips } from "@/Toolboxes";

const ToolboxName: Toolbox = "spline";

const ToolboxTooltips: ToolTips = {
  spline: {
    name: "Spline",
    icon: require(`@/assets/spline-icon.svg`) as string,
    shortcut: "S",
  },
  lassospline: {
    name: "Lasso Spline",
    icon: require(`@/assets/lasso-spline-icon.svg`) as string,
    shortcut: "O",
  },
  magicspline: {
    name: "Magic Spline",
    icon: require(`@/assets/magic-spline-icon.svg`) as string,
    shortcut: "M",
  },
  closespline: {
    name: "Close Active Spline",
    icon: require(`@/assets/close-spline-icon.svg`) as string,
    shortcut: "L",
  },
  convertspline: {
    name: "Convert Spline to Paintbrush",
    icon: require(`@/assets/convert-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "Q",
  },
  fillspline: {
    name: "Convert Spline to Paintbrush and Fill",
    icon: require(`@/assets/fill-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "F",
  },
} as const;

export { ToolboxName, ToolboxTooltips };
