const { until, By } = require("selenium-webdriver");
const { sleep } = require("./helpers");

const { wrapper, test, webdriver } =
  require("@gliff-ai/jest-browserstack-automate")("Annotate", [
    {
      device: "iPad 8th",
      real_mobile: "true",
      browserName: "Safari",
    },
  ]);

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
  describe("iOS Percy complex screenshot", () => {
    test(
      "paintbrush-splodge",
      async (driver, percySnapshot) => {
        await driver.get(TARGET_URL);

        // Breaks Ipad Safari?
        // if ((await driver.getCapabilities()).browser !== "ipad")
        //   driver.manage().window().maximize();

        await driver.wait(until.titleIs("gliff.ai ANNOTATE"), 10000);

        // draw brushstrokes:
        await drawStroke(driver, { x: 200, y: 600 }, { x: 200, y: 800 });
        await clickById(driver, "id-add-new-annotation");
        await drawStroke(driver, { x: 250, y: 600 }, { x: 250, y: 800 });
        await clickById(driver, "id-add-new-annotation");
        await drawStroke(driver, { x: 300, y: 600 }, { x: 300, y: 800 });
        await clickById(driver, "id-add-new-annotation");
        await drawStroke(driver, { x: 150, y: 700 }, { x: 350, y: 700 });

        // draw splines:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-spline-toolbox");
        await drawPentagon(driver, 500, 200); // open spline
        await clickById(driver, "id-add-new-annotation");
        await drawPentagon(driver, 500, 400); // closed spline
        await clickById(driver, "id-close-active-spline");

        await sleep(100); // seems the next actions will execute before the above JS events have been processed if we don't wait a bit

        // select tool:
        await clickById(driver, "id-select-annotation");
        driver.executeScript(
          makeEventJS("boundingBox-canvas", "click", 250, 600)
        );

        await sleep();

        // eraser:
        await clickById(driver, "id-paintbrush-toolbox"); // open paintbrush toolbox submenu
        await clickById(driver, "id-eraser"); // select eraser

        // click background to close eraser submenu so it doesn't obscure the brushstrokes:
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mousedown", 50, 500)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mouseup", 50, 500)
        );

        // erase part of active annotation
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mousedown", 250, 600)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mouseup", 250, 600)
        );
        await sleep();
        // try to erase part of inactive annotation (should fail)
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mousedown", 300, 600)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mouseup", 300, 600)
        );
        await sleep();
        // erase part of active annotation that overlaps with an inactive annotation:
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mousedown", 250, 700)
        );
        await sleep();
        driver.executeScript(
          makeEventJS("paintbrush-interaction-canvas", "mouseup", 250, 700)
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

        // enter label text:
        await clickById(driver, "id-annotation-label");
        (await driver.findElement(By.id("id-labels-input"))).sendKeys("abc");
        await sleep();
      },
      120000
    );
  });
});
