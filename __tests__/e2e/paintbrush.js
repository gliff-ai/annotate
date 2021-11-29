const { until } = require("selenium-webdriver");
const { By } = require("selenium-webdriver");

const { wrapper, test, webdriver } =
  require("@gliff-ai/jest-browserstack-automate")("Annotate");

const { TARGET_URL = "http://localhost:3000" } = process.env;

function sleep(ms = 600) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

// moves the mouse to points[0] and then drags to all of the points
const dragBetweenPoints = (actions, points) => {
  const mouse = actions.mouse();

  const [[originX, originY], ...remainingPoints] = points.map(([x, y]) => [
    Math.floor(x),
    Math.floor(y),
  ]);

  actions.pause(mouse).move({ x: originX, y: originY, duration: 10 });

  remainingPoints.forEach(([x, y]) => {
    actions.press().move({ x, y, duration: 100 }).release();
  });

  actions.perform();
};
wrapper(() => {
  describe("Percy complex screenshot", () => {
    test(
      "paintbrush-splodge",
      async (driver, percySnapshot) => {
        await driver.get(TARGET_URL);
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

  describe.only("Percy complex screenshot", () => {
    test(
      "complex paintbrush",
      async (driver, percySnapshot) => {
        try {
          await driver.get(TARGET_URL);

          driver.manage().window().maximize();

          await driver.wait(until.titleIs("gliff.ai ANNOTATE"), 3000);

          await clickById(driver, "id-add-new-annotation");

          const actions = driver.actions({ async: true });
          const kb = actions.keyboard();

          //
          // // a square
          // dragBetweenPoints(actions, [
          //   [100, 100],
          //   [150, 100],
          //   [150, 150],
          //   [100, 150],
          //   [100, 100],
          // ]);

          dragBetweenPoints(actions, [
            [535, 1024],
            [489, 1016],
            [445, 1007],
            [398, 1013],
            [352, 1008],
            [307, 993],
            [267, 969],
            [234, 935],
            [217, 892],
            [232, 848],
            [274, 832],
            [319, 845],
            [359, 870],
            [394, 902],
            [424, 938],
            [457, 972],
            [498, 959],
            [537, 933],
            [574, 903],
            [605, 867],
            [612, 830],
            [570, 810],
            [524, 800],
            [477, 796],
            [430, 788],
            [386, 774],
            [340, 787],
            [294, 796],
            [247, 791],
            [214, 760],
            [207, 713],
            [221, 669],
            [252, 634],
            [284, 602],
            [305, 560],
            [340, 529],
            [385, 526],
            [400, 566],
            [365, 596],
            [323, 617],
            [304, 652],
            [323, 695],
            [355, 729],
            [396, 747],
            [441, 733],
            [487, 721],
            [534, 714],
            [580, 718],
            [622, 740],
            [649, 778],
            [651, 824],
            [669, 866],
            [673, 912],
            [658, 956],
            [626, 991],
            [585, 1014],
            [539, 1023],
            [530, 1000],
            [577, 992],
            [617, 969],
            [644, 931],
            [650, 884],
            [630, 871],
            [601, 908],
            [566, 940],
            [528, 967],
            [270, 856],
            [240, 886],
            [258, 928],
            [294, 959],
            [336, 980],
            [382, 989],
            [429, 987],
            [409, 957],
            [380, 920],
            [345, 888],
            [305, 864],
            [506, 775],
            [553, 781],
            [598, 795],
            [630, 802],
            [610, 761],
            [569, 739],
            [522, 738],
            [476, 748],
            [431, 761],
            [465, 771],
            [265, 654],
            [236, 691],
            [232, 737],
            [260, 771],
            [307, 771],
            [353, 760],
            [323, 733],
            [295, 695],
            [280, 650],
            [334, 563],
            [315, 595],
            [357, 574],
            [367, 544],
          ]);

          await sleep(10000);
        } catch (e) {
          console.log("caught");
          console.log(e);
        }
      },
      120000
    );
  });
});
