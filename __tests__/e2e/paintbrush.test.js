const { until, By, Origin } = require("selenium-webdriver");
const { sleep, dragBetweenPoints, drawPentagon, clickMouseAtPoint } = require("./helpers");

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

// async function drawPentagon(driver, cx, cy) {
//   // draws five spline points in a pentagon centred on (cx, cy) (but doesn't close it)
//   for (let i = 0; i < 5; i += 1) {
//     const x = cx + 50 * Math.cos((i * 2 * Math.PI) / 5);
//     const y = cy + 50 * Math.sin((i * 2 * Math.PI) / 5);
//     driver.executeScript(makeEventJS("spline-canvas", "click", x, y));

//     await sleep();
//   }
// }

async function clickById(driver, id) {
  const el = await driver.findElement(By.id(id));
  await el.click();

  // await sleep();
}

wrapper(() => {
  describe("Percy complex screenshot", () => {
    test(
      "paintbrush-splodge",
      async (driver, percySnapshot) => {
        await driver.get(TARGET_URL);

        // Breaks Ipad Safari?
        // if ((await driver.getCapabilities()).browser !== "ipad")
        //   driver.manage().window().maximize();

        await driver.wait(until.titleIs("gliff.ai ANNOTATE"), 10000);

        // draw brushstrokes:
        let actions = driver.actions();
        dragBetweenPoints(actions, [200, 200], [[200, 400]]);
        await clickById(driver, "id-add-new-annotation");
        dragBetweenPoints(actions, [250, 200], [[250, 400]]);
        await clickById(driver, "id-add-new-annotation");
        dragBetweenPoints(actions, [300, 200], [[300, 400]]);
        await clickById(driver, "id-add-new-annotation");
        dragBetweenPoints(actions, [150, 300], [[350, 300]]);

        // draw splines:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-spline-toolbox");
        await drawPentagon(actions, [500, 200]); // open spline
        await clickById(driver, "id-add-new-annotation");
        await drawPentagon(actions, [500, 400]); // closed spline
        await clickById(driver, "id-close-active-spline");
        // lasso spline:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-lasso-spline");

        // driver.executeScript(
        //   makeEventJS("spline-canvas", "mousedown", 650, 150)
        // );
        // await sleep();
        // for (let i = 0; i < 20; i += 1) {
        //   driver.executeScript(
        //     makeEventJS("spline-canvas", "mousemove", 650, 150 + 14 * i)
        //   );

        //   await sleep(1000);
        // }
        // driver.executeScript(makeEventJS("spline-canvas", "mouseup", 650, 400));
        // await sleep();
        // // IRL, a click event is generated after a mouseup event, and our code knows to ignore it because isDrawing/dragPoint will still be set
        // // we have to simulate that click event here, so that onClick unsets them, otherwise the next click event will be ignored:
        // driver.executeScript(makeEventJS("spline-canvas", "click", 650, 400));

        actions.move({ x: 650, y: 150, duration: 10 }).press();
        const points = [...Array(40)].map((_, i) => ([650, Math.floor(150 + 250 * i / 40)]));
        points.forEach(([x, y]) => { actions.move({ x, y }) });
        await actions.release().perform();
        actions.clear();

        await sleep(100); // seems the next actions will execute before the above JS events have been processed if we don't wait a bit

        // test select tool:
        await clickById(driver, "id-select-annotation");
        await clickMouseAtPoint(actions, [250, 200]);

        await sleep();

        // eraser:
        await clickById(driver, "id-paintbrush-toolbox"); // open paintbrush toolbox submenu
        await clickById(driver, "id-eraser"); // select eraser

        // erase part of active annotation
        await clickMouseAtPoint(actions, [250, 200]);
        
        // try to erase part of inactive annotation (should fail)
        await clickMouseAtPoint(actions, [300, 200]);

        // erase part of active annotation that overlaps with an inactive annotation:
        await clickMouseAtPoint(actions, [250, 300]);

        // fill brush:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-paintbrush");
        await dragBetweenPoints(actions, [350, 500], [[350, 600], [450, 600], [450, 500]]);
        await clickById(driver, "id-fill-active-paintbrush");

        // spline to paintbrush:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-spline-toolbox");
        await clickById(driver, "id-spline"); // switch from lasso spline to regular spline
        await drawPentagon(actions, [550, 550]);
        await clickById(driver, "id-close-active-spline");
        await clickById(driver, "id-convert-spline-to-paintbrush");

        // draw bounding box:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-bounding-box");
        await clickMouseAtPoint(actions, [150, 450]);
        await clickMouseAtPoint(actions, [300, 550]);
        await percySnapshot(driver, "paintbrush-splodge");
      },
      120000
    );
  });
});
