import { imgSrc } from "@/imgSrc";
import { ToolTips } from "@/Toolboxes";

const ToolboxName: Toolbox = "background";

const Tools: ToolTips = {
  contrast: {
    name: "Contrast",
    icon: imgSrc("contrast-icon"),
    shortcut: `\\`,
  },
  brightness: {
    name: "Brightness",
    icon: imgSrc("brightness-icon"),
    shortcut: "/",
  },
  channels: {
    name: "Channels",
    icon: imgSrc("channels-icon"),
    shortcut: "C",
  },
} as const;

export { ToolboxName, Tools };
