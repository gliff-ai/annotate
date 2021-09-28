import { imgSrc } from "@/imgSrc";
import { Toolbox, ToolTips } from "@/Toolboxes";

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
  backgroundSettings: {
    name: "Background Settings",
    icon: imgSrc("background-settings-icon"),
    shortcut: "P",
  },
} as const;

export { ToolboxName, Tools };
