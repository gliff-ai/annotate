import { keybindings, displayNames } from "./keybindings";
import type { NamespacedMethod } from "./keybindings";

const isMacLookup =
  navigator.platform.startsWith("mac") || navigator.platform.startsWith("Mac");

const keydownListener = (
  event: KeyboardEvent,
  keybindingsMap = keybindings, // So we can mock in test
  isMac = isMacLookup // So we can mock
): boolean => {
  // Lookup event
  let { code } = event;

  if (isMac) {
    if (event.shiftKey) code = `shift+${code}`;
    if (event.metaKey) code = `cmdCtrl+${code}`;
    if (event.altKey) code = `altOption+${code}`;
  } else {
    if (event.shiftKey) code = `shift+${code}`;
    if (event.ctrlKey) code = `cmdCtrl+${code}`;
    if (event.altKey) code = `altOption+${code}`;
  }

  if (keybindingsMap[code]) {
    const [namespace, method] = keybindingsMap[code][0].split(".");

    event.preventDefault();
    document.dispatchEvent(new CustomEvent(method, { detail: namespace }));

    return false;
  }

  return true;
};

export function getShortcut(
  value: NamespacedMethod,
  bindings = keybindings,
  isMac = isMacLookup
): { shortcutSymbol?: string; shortcut?: string } {
  const [shortcut] =
    Object.entries(bindings).find(([, v]) => v[0] === value) || [];

  if (!shortcut) return {};

  const raw = shortcut.split("—");

  let rawKey;
  let rawModifier;

  if (raw[1]) {
    [rawModifier, rawKey] = raw;
  } else {
    [rawKey] = raw;
  }

  const shortcutSymbol =
    displayNames(isMac)[rawModifier] || rawModifier || undefined;

  const key =
    displayNames(isMac)[rawKey] ||
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
