const { until } = require("selenium-webdriver");
const { By } = require("selenium-webdriver");

const { wrapper, test, webdriver } =
  require("@gliff-ai/jest-browserstack-automate")("Annotate");

function makeEventJS(eventType, clientX, clientY) {
  return `var el = document.getElementById("paintbrush-interaction-canvas");
         el.dispatchEvent(new MouseEvent("${eventType}", { clientX: ${clientX}, clientY: ${clientY}, bubbles: true }));`;
}

function drawStroke(driver, start, end) {
  driver.executeScript(makeEventJS("mousedown", start.x, start.y));
  driver.executeScript(makeEventJS("mousemove", end.x, end.y));
  driver.executeScript(makeEventJS("mouseup", end.x, end.y));
}

async function clickById(driver, id) {
  const el = await driver.findElement(By.id(id));
  await el.click();
}

wrapper(() => {
  describe("webdriver", () => {
    test("paintbrush-splodge", async (driver, percySnapshot) => {
      await driver.get("http://127.0.0.1:3000/");
      await driver.wait(until.titleIs('gliff.ai ANNOTATE'), 3000);

      // draw brushstrokes:
      drawStroke(driver, { x: 200, y: 200 }, { x: 200, y: 400 })
      await clickById(driver, "id-new-annotation");
      drawStroke(driver, { x: 250, y: 200 }, { x: 250, y: 400 })
      await clickById(driver, "id-new-annotation");
      drawStroke(driver, { x: 300, y: 200 }, { x: 300, y: 400 })
      await clickById(driver, "id-new-annotation");
      drawStroke(driver, { x: 150, y: 300 }, { x: 350, y: 300 })

      // draw splines:
      await clickById(driver, "id-new-annotation");
      await clickById(driver, "id-spline-toolbox");
      await driver.actions().move({ origin: await driver.findElement(By.id("paintbrush-interaction-canvas")), x: 500, y: 200 }).click();
      
      setTimeout(() => null, 1000)
      await percySnapshot(driver, "paintbrush-splodge");
    });
  })
});
