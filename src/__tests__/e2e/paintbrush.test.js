const { until } = require("selenium-webdriver");
const { wrapper, test, webdriver } =
  require("@gliff-ai/jest-browserstack-automate")("Annotate");

wrapper(() => {
  describe("webdriver", () => {
    test("paintbrush-splodge", async (driver, percySnapshot) => {
      await driver.get("http://127.0.0.1:3000/");
      await driver.wait(until.titleIs('gliff.ai ANNOTATE'), 3000);
      await driver.executeScript(
        `var el = document.getElementById("paintbrush-interaction-canvas");
         el.dispatchEvent(new MouseEvent("mousedown", { clientX: 500, clientY: 500, bubbles: true }));`
      );
      setTimeout(() => null, 1000)
      await percySnapshot(driver, "paintbrush-splodge");
    });
  })
});
