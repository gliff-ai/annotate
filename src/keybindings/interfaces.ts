type ModifierKey = "none" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey";

type SingleKeyBind = {
  [key: string]: string;
};

export type Keybindings = {
  // [K in ModifierKey]?: SingleKeyBind | Keybindings;
  [key: string]: string;
};
