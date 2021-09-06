import { imgSrc } from "@/imgSrc";
import { ToolTips } from "@/Toolboxes";

const Tools: ToolTips = {
  minimiseMap: {
    name: "Minimise Map",
    icon: imgSrc("minimise-icon"),
    shortcut: "ALT",
    shortcutSymbol: "-",
  },
  maximiseMap: {
    name: "Maximise Map",
    icon: imgSrc("maximise-icon"),
    shortcut: "ALT",
    shortcutSymbol: "=",
  },
  zoomIn: {
    name: "Zoom In",
    icon: imgSrc("zoom-in-icon"),
    shortcut: "ALT",
    shortcutSymbol: "1",
  },
  zoomOut: {
    name: "Zoom Out",
    icon: imgSrc("zoom-out-icon"),
    shortcut: "ALT",
    shortcutSymbol: "2",
  },
  fitToPage: {
    name: "Fit to Page",
    icon: imgSrc("reset-zoom-and-pan-icon"),
    shortcut: "ALT",
    shortcutSymbol: "3",
  },
} as const;

export { Tools as MinimapTools };
