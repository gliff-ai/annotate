const { until, By } = require("selenium-webdriver");
const { sleep } = require("./helpers");

const { wrapper, test, webdriver } =
  require("@gliff-ai/jest-browserstack-automate")("Annotate");

const { TARGET_URL = "http://localhost:3000" } = process.env;

function makeEventJS(el, eventType, clientX, clientY) {
  return `var el = document.getElementById("${el}");
         el.dispatchEvent(new MouseEvent("${eventType}", { clientX: ${clientX}, clientY: ${clientY}, bubbles: true }));`;
}

async function drawStroke(driver, start, end) {
  driver.executeScript(
    makeEventJS("paintbrush-interaction-canvas", "mousedown", start.x, start.y)
  );

  await sleep();
  driver.executeScript(
    makeEventJS("paintbrush-interaction-canvas", "mousemove", end.x, end.y)
  );

  await sleep();
  driver.executeScript(
    makeEventJS("paintbrush-interaction-canvas", "mouseup", end.x, end.y)
  );

  await sleep();
}

async function drawPentagon(driver, cx, cy) {
  // draws five spline points in a pentagon centred on (cx, cy) (but doesn't close it)
  for (let i = 0; i < 5; i += 1) {
    const x = cx + 50 * Math.cos((i * 2 * Math.PI) / 5);
    const y = cy + 50 * Math.sin((i * 2 * Math.PI) / 5);
    driver.executeScript(makeEventJS("spline-canvas", "click", x, y));

    await sleep();
  }
}

async function clickById(driver, id) {
  const el = await driver.findElement(By.id(id));
  await el.click();

  await sleep();
}

wrapper(() => {
  describe("Percy complex screenshot", () => {
    test(
      "paintbrush-splodge",
      async (driver, percySnapshot) => {
        await driver.get(TARGET_URL);
        try {
          driver.manage().window().maximize();
        } catch (ignore) {}

        await driver.wait(until.titleIs("gliff.ai ANNOTATE"), 3000);

        // draw brushstrokes:
        await drawStroke(driver, { x: 200, y: 200 }, { x: 200, y: 400 });
        await clickById(driver, "id-add-new-annotation");
        await drawStroke(driver, { x: 250, y: 200 }, { x: 250, y: 400 });
        await clickById(driver, "id-add-new-annotation");
        await drawStroke(driver, { x: 300, y: 200 }, { x: 300, y: 400 });
        await clickById(driver, "id-add-new-annotation");
        await drawStroke(driver, { x: 150, y: 300 }, { x: 350, y: 300 });

        // draw splines:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-spline-toolbox");
        await drawPentagon(driver, 500, 200); // open spline
        await clickById(driver, "id-add-new-annotation");
        await drawPentagon(driver, 500, 400); // closed spline
        await clickById(driver, "id-close-active-spline");
        // lasso spline:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-lasso-spline");

        driver.executeScript(
          makeEventJS("spline-canvas", "mousedown", 650, 150)
        );
        await sleep();
        for (let i = 0; i < 40; i += 1) {
          driver.executeScript(
            makeEventJS("spline-canvas", "mousemove", 650, 150 + 7 * i)
          );

          await sleep(500);
        }
        driver.executeScript(makeEventJS("spline-canvas", "mouseup", 650, 400));
        await sleep();
        // IRL, a click event is generated after a mouseup event, and our code knows to ignore it because isDrawing/dragPoint will still be set
        // we have to simulate that click event here, so that onClick unsets them, otherwise the next click event will be ignored:
        driver.executeScript(makeEventJS("spline-canvas", "click", 650, 400));

        await sleep(100); // seems the next actions will execute before the above JS events have been processed if we don't wait a bit

        // select tool:
        await clickById(driver, "id-select-annotation");
        driver.executeScript(
          makeEventJS("boundingBox-canvas", "click", 250, 200)
        );

        await sleep();

        // eraser:
        await clickById(driver, "id-paintbrush-toolbox"); // open paintbrush toolbox submenu
        await clickById(driver, "id-eraser"); // select eraser

        // erase part of active annotation
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mousedown", 250, 200)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mouseup", 250, 200)
        );
        await sleep();
        // try to erase part of inactive annotation (should fail)
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mousedown", 300, 200)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mouseup", 300, 200)
        );
        await sleep();
        // erase part of active annotation that overlaps with an inactive annotation:
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mousedown", 250, 300)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mouseup", 250, 300)
        );

        // fill brush:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-paintbrush");
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mousedown", 350, 500)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mousemove", 350, 600)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mousemove", 450, 600)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mousemove", 450, 500)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mouseup", 450, 500)
        );
        await sleep();
        await clickById(driver, "id-fill-active-paintbrush");

        // spline to paintbrush:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-spline-toolbox");
        await clickById(driver, "id-spline"); // switch from lasso spline to regular spline
        await drawPentagon(driver, 550, 550);
        await clickById(driver, "id-close-active-spline");
        await clickById(driver, "id-convert-spline-to-paintbrush");

        // draw bounding box:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-bounding-box");
        driver.executeScript(
          makeEventJS("boundingBox-canvas", "click", 150, 450)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("boundingBox-canvas", "click", 300, 550)
        );
        await sleep();
        await percySnapshot(driver, "paintbrush-splodge");
      },
      120000
    );
  });
});
