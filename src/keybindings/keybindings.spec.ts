import { keydownListener } from "./index";

const bindings = {
  keyA: "test.Only A",
  "ctrl+keyA": "test.Ctrl + A",
  "ctrl+shift+keyA": "test.Ctrl + Shift + A",
};

test("Handles standard keys", (done: any): void => {
  document.addEventListener("Only A", (): void => done());

  const event = new KeyboardEvent("keypress", { code: "keyA" });
  keydownListener(event, bindings);
});

test("Handles Namespacing", (done: any): void => {
  document.addEventListener("Only A", (e: CustomEvent): void => {
    expect(e.detail).toEqual("test");
    done();
  });

  const event = new KeyboardEvent("keypress", { code: "keyA" });
  keydownListener(event, bindings);
});

test("Handles modifier keys", (done: any): void => {
  document.addEventListener("Only A", (): void => done("badCall"));
  document.addEventListener("Ctrl + A", (): void => done());

  const event = new KeyboardEvent("keypress", { code: "keyA", ctrlKey: true });
  keydownListener(event, bindings);
});

test("Handles multiple modifier keys", (done: any): void => {
  document.addEventListener("Only A", (): void => done("badCall"));
  document.addEventListener("Ctrl + A", (): void => done("badCall"));
  document.addEventListener("Ctrl + Shift + A", (): void => done());

  const event = new KeyboardEvent("keypress", {
    code: "keyA",
    shiftKey: true,
    ctrlKey: true,
  });
  keydownListener(event, bindings);
});
