const { keydownListener, getShortcut } = require("./index");

global.navigator = { ...global.navigator, platform: "MacOS" };
const bindings = {
  KeyA: ["test.Only A", ""],
  "cmdCtrl+KeyA": ["test.Ctrl + A", ""],
  "cmdCtrl+shift+KeyA": ["test.Ctrl + Shift + A", ""],
  Backspace: ["test.backspace", ""],
};

test("Handles standard keys", (done: any): void => {
  document.addEventListener("Only A", (): void => done());

  const event = new KeyboardEvent("keypress", { code: "KeyA" });
  keydownListener(event, bindings);
});

test("Handles Namespacing", (done: any): void => {
  document.addEventListener("Only A", (e: CustomEvent): void => {
    expect(e.detail).toEqual("test");
    done();
  });

  const event = new KeyboardEvent("keypress", { code: "KeyA" });
  keydownListener(event, bindings);
});

test("Handles modifier keys", (done: any): void => {
  document.addEventListener("Only A", (): void => done("badCall"));
  document.addEventListener("Ctrl + A", (): void => done());

  const event = new KeyboardEvent("keypress", { code: "KeyA", ctrlKey: true });
  keydownListener(event, bindings);
});

test("Handles multiple modifier keys", (done: any): void => {
  document.addEventListener("Only A", (): void => done("badCall"));
  document.addEventListener("Ctrl + A", (): void => done("badCall"));
  document.addEventListener("Ctrl + Shift + A", (): void => done());

  const event = new KeyboardEvent("keypress", {
    code: "KeyA",
    shiftKey: true,
    ctrlKey: true,
  });
  keydownListener(event, bindings);
});

test("Correctly gets shortcut keys", (): void => {
  expect(getShortcut("test.Only A", bindings)).toEqual({ shortcut: "A" });
  expect(getShortcut("test.Ctrl + A", bindings)).toEqual({
    shortcutSymbol: "CTRL",
    shortcut: "A",
  });
  expect(getShortcut("test.backspace", bindings)).toEqual({
    shortcut: "&#x232b;",
  });
});

test("Correctly gets Mac shortcut keys", (): void => {
  expect(getShortcut("test.Only A", bindings, true)).toEqual({ shortcut: "A" });
  expect(getShortcut("test.Ctrl + A", bindings, true)).toEqual({
    shortcutSymbol: "CMD",
    shortcut: "A",
  });
  expect(getShortcut("test.backspace", bindings, true)).toEqual({
    shortcut: "&#x232b;",
  });
});
