import { keydownListener } from "./index";

const bindings = {
  keyA: "test.Only A",
  "ctrl+keyA": "test.Ctrl + A",
  "ctrl+shift+keyA": "test.Ctrl + Shift + A",
};

test("Handles standard keys", (done: any) => {
  document.addEventListener("Only A", () => done());

  const event = new KeyboardEvent("keypress", { code: "keyA" });
  keydownListener(event, bindings);
});

test("Handles Namespacing", (done: any) => {
  document.addEventListener("Only A", (e: CustomEvent) => {
    expect(e.detail).toEqual("test");
    done();
  });

  const event = new KeyboardEvent("keypress", { code: "keyA" });
  keydownListener(event, bindings);
});

test("Handles modifier keys", (done: any) => {
  document.addEventListener("Only A", () => done("badCall"));
  document.addEventListener("Ctrl + A", () => done());

  const event = new KeyboardEvent("keypress", { code: "keyA", ctrlKey: true });
  keydownListener(event, bindings);
});

test("Handles multiple modifier keys", (done: any) => {
  document.addEventListener("Only A", () => done("badCall"));
  document.addEventListener("Ctrl + A", () => done("badCall"));
  document.addEventListener("Ctrl + Shift + A", () => done());

  const event = new KeyboardEvent("keypress", {
    code: "keyA",
    shiftKey: true,
    ctrlKey: true,
  });
  keydownListener(event, bindings);
});
