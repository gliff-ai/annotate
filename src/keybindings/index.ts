import { keybindings } from "./keybindings";

const keydownListener = (
  event: KeyboardEvent,
  keybindingsMap = keybindings
) => {
  console.log("keydown");
  console.log(event.code);
  console.log(keybindingsMap);
  console.log(keybindingsMap[event.code]);

  // Lookup event
  if (keybindingsMap[event.code]) {
    console.log("dispatching!");
    console.log(keybindingsMap[event.code]);
    document.dispatchEvent(new Event(keybindingsMap[event.code]));
  }
};

export { keydownListener };
