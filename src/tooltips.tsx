interface ToolTips {
  name: string;
  icon: string;
  shortcut: string;
  tool?: string;
}

const toolTips: ToolTips[] = [
  {
    name: "Select",
    icon: require(`./assets/select-icon.svg`) as string,
    shortcut: "A",
  },
  {
    name: "Brush",
    icon: require(`./assets/brush-icon.svg`) as string,
    shortcut: "B",
    tool: "paintbrush",
  },
  {
    name: "Eraser",
    icon: require(`./assets/eraser-icon.svg`) as string,
    shortcut: "E",
    tool: "eraser",
  },
  {
    name: "Spline",
    icon: require(`./assets/splines-icon.svg`) as string,
    shortcut: "S",
    tool: "spline",
  },
  {
    name: "Magic Spline",
    icon: require(`./assets/magic-spline-icon.svg`) as string,
    shortcut: "M",
    tool: "magicspline",
  },

  {
    name: "Contrast",
    icon: require(`./assets/contrast-icon.svg`) as string,
    shortcut: `\\`,
  },
  {
    name: "Brightness",
    icon: require(`./assets/brightness-icon.svg`) as string,
    shortcut: `/`,
  },
  {
    name: "Channel",
    icon: require(`./assets/channels-icon.svg`) as string,
    shortcut: `C`,
  },

  {
    name: "Annonation Label",
    icon: require(`./assets/annotation-label-icon.svg`) as string,
    shortcut: "L",
  },
];

const minimapToolTips = [
  {
    name: "Minimise Map",
    icon: require(`./assets/minimise-icon.svg`) as string,
    shortcut: "ALT",
    shortcutSymbol: "-",
    styling: { marginRight: "120px", marginLeft: "15px" },
  },

  {
    name: "Zoom In",
    icon: require(`./assets/zoom-in-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "+",
    styling: { marginRight: "10px" },
  },
  {
    name: "Zoom Out",
    icon: require(`./assets/zoom-out-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "-",
    styling: { marginRight: "10px" },
  },
  {
    name: "Fit to Page",
    icon: require(`./assets/reset-zoom-and-pan-icon.svg`) as string,
    shortcut: "CTRL",
    shortcutSymbol: "]",
  },
];

const annotationToolTips = [
  {
    name: "Add New Annotation",
    icon: require(`./assets/new-annotation-icon.svg`) as string,
    shortcutSymbol: "+",
  },
  {
    name: "Clear Annotation",
    icon: require(`./assets/delete-annotation-icon.svg`) as string,
    shortcutSymbol: "-",
  },
];

export { toolTips, minimapToolTips, annotationToolTips };
