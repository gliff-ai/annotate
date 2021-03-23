import { keydownListener } from "./index";

const bindings = {
  keyA: "foo",
  "ctrl+keyA": "bar",
};

test("Handles standard keys", (done: any) => {
  document.addEventListener("foo", () => done());

  const event = new KeyboardEvent("keypress", { code: "keyA" });
  keydownListener(event, bindings);
});
//
// test("Handles modifier keys", (done: any) => {
//   const dontCall = jest.fn();
//   document.addEventListener("foo", dontCall);
//   document.addEventListener("bar", () => {
//     // expect(dontCall).toNotBeCalled;
//     console.log(dontCall);
//     done();
//   });
//
//   const event = new KeyboardEvent("keypress", { code: "keyA", ctrlKey: true });
//   keydownListener(event, bindings);
// });
