import { keybindings } from "./keybindings";

const keydownListener = (
  event: KeyboardEvent,
  keybindingsMap = keybindings
): void => {
  // Lookup event
  let { code } = event;

  if (event.shiftKey) code = `shift+${code}`;
  if (event.metaKey) code = `meta+${code}`;
  if (event.ctrlKey) code = `ctrl+${code}`;
  if (event.altKey) code = `alt+${code}`;

  if (keybindingsMap[code]) {
    const [namespace, method] = keybindingsMap[code].split(".");
    document.dispatchEvent(new CustomEvent(method, { detail: namespace }));
  }
};

// TODO: all of these!
const displayNames = {
  Backspace: "&#x232b;",
  ctrl: "CTRL",
  Slash: "/",
  Equal: "=",
  Minus: "-",
} as Readonly<{
  [key: string]: string;
}>;

export function getShortcut(
  value: string,
  bindings = keybindings
): { shortcutSymbol?: string; shortcut?: string } {
  const [shortcut] =
    Object.entries(bindings).find(([, v]) => v === value) || [];

  if (!shortcut) return {};

  const raw = shortcut.split("+");

  let rawKey;
  let rawModifier;

  if (raw[1]) {
    [rawModifier, rawKey] = raw;
  } else {
    [rawKey] = raw;
  }

  const shortcutSymbol = displayNames[rawModifier] || rawModifier || undefined;
  const key =
    displayNames[rawKey] ||
    rawKey.split("Key")[1] ||
    rawKey.split("Digit")[1] ||
    rawKey ||
    undefined;

  if (!shortcutSymbol) {
    return { shortcut: key };
  }

  return {
    shortcutSymbol,
    shortcut: key,
  };
}

export { keydownListener };
