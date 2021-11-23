const { until } = require("selenium-webdriver");
const { By } = require("selenium-webdriver");

const { wrapper, test, webdriver } =
  require("@gliff-ai/jest-browserstack-automate")("Annotate");

function makeEventJS(el, eventType, clientX, clientY) {
  return `var el = document.getElementById("${el}");
         el.dispatchEvent(new MouseEvent("${eventType}", { clientX: ${clientX}, clientY: ${clientY}, bubbles: true }));`;
}

function drawStroke(driver, start, end) {
  driver.executeScript(makeEventJS("paintbrush-interaction-canvas", "mousedown", start.x, start.y));
  driver.executeScript(makeEventJS("paintbrush-interaction-canvas", "mousemove", end.x, end.y));
  driver.executeScript(makeEventJS("paintbrush-interaction-canvas", "mouseup", end.x, end.y));
}

function drawPentagon(driver, cx, cy) {
  // draws five spline points in a pentagon centred on (cx, cy) (but doesn't close it)
  for (let i = 0; i < 5; i += 1) {
    const x = cx + 50 * Math.cos(i * 2 * Math.PI / 5);
    const y = cy + 50 * Math.sin(i * 2 * Math.PI / 5);
    driver.executeScript(makeEventJS("spline-canvas", "click", x, y))
  }
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
      await clickById(driver, "id-add-new-annotation");
      drawStroke(driver, { x: 250, y: 200 }, { x: 250, y: 400 })
      await clickById(driver, "id-add-new-annotation");
      drawStroke(driver, { x: 300, y: 200 }, { x: 300, y: 400 })
      await clickById(driver, "id-add-new-annotation");
      drawStroke(driver, { x: 150, y: 300 }, { x: 350, y: 300 })

      // draw splines:
      await clickById(driver, "id-add-new-annotation");
      await clickById(driver, "id-spline-toolbox");
      drawPentagon(driver, 500, 200); // open spline
      await clickById(driver, "id-add-new-annotation");
      drawPentagon(driver, 500, 400); // closed spline
      await clickById(driver, "id-close-active-spline");
      // lasso spline:
      await clickById(driver, "id-add-new-annotation");
      await clickById(driver, "id-lasso-spline");
      driver.executeScript(makeEventJS("spline-canvas", "mousedown", 650, 150));
      for (let i = 0; i < 40; i += 1) {
        driver.executeScript(makeEventJS("spline-canvas", "mousemove", 650, 150 + 7*i))
      }
      driver.executeScript(makeEventJS("spline-canvas", "mouseup", 650, 350));

      // draw bounding box:
      await clickById(driver, "id-add-new-annotation");
      await clickById(driver, "id-bounding-box");
      driver.executeScript(makeEventJS("boundingBox-canvas", "click", 150, 450));
      driver.executeScript(makeEventJS("boundingBox-canvas", "click", 300, 550));

      // select tool:
      await clickById(driver, "id-select-annotation");
      driver.executeScript(makeEventJS("boundingBox-canvas", "click", 250, 200));

      // eraser:
      await clickById(driver, "id-paintbrush-toolbox"); // open paintbrush toolbox submenu
      await clickById(driver, "id-eraser"); // select eraser

      // erase part of active annotation
      driver.executeScript(makeEventJS("paintbrush-interaction-canvas", "mousedown", 250, 200));
      driver.executeScript(makeEventJS("paintbrush-interaction-canvas", "mouseup", 250, 200));

      // try to erase part of inactive annotation (should fail)
      driver.executeScript(makeEventJS("paintbrush-interaction-canvas", "mousedown", 300, 200));
      driver.executeScript(makeEventJS("paintbrush-interaction-canvas", "mouseup", 300, 200));

      // erase part of active annotation that overlaps with an inactive annotation:
      driver.executeScript(makeEventJS("paintbrush-interaction-canvas", "mousedown", 250, 300));
      driver.executeScript(makeEventJS("paintbrush-interaction-canvas", "mouseup", 250, 300));



      
      await percySnapshot(driver, "paintbrush-splodge");
    });
  })
});
