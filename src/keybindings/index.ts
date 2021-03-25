import { keybindings } from "./keybindings";

const keydownListener = (
  event: KeyboardEvent,
  keybindingsMap = keybindings
): void => {
  // Lookup event
  let code = event.code;

  if (event.shiftKey) code = `shift+${code}`;
  if (event.metaKey) code = `meta+${code}`;
  if (event.ctrlKey) code = `ctrl+${code}`;
  if (event.altKey) code = `alt+${code}`;

  if (keybindingsMap[code]) {
    const [namespace, method] = keybindingsMap[code].split(".");
    document.dispatchEvent(new CustomEvent(method, { detail: namespace }));
  }
};

export { keydownListener };
