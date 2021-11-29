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
            [468, 896],
            [428, 889],
            [389, 881],
            [349, 887],
            [308, 882],
            [269, 869],
            [234, 848],
            [205, 818],
            [190, 780],
            [203, 742],
            [240, 728],
            [279, 739],
            [314, 761],
            [345, 789],
            [371, 821],
            [400, 850],
            [436, 839],
            [470, 816],
            [502, 790],
            [529, 759],
            [536, 726],
            [499, 708],
            [458, 700],
            [417, 697],
            [377, 690],
            [337, 678],
            [298, 689],
            [257, 696],
            [216, 692],
            [187, 665],
            [181, 624],
            [193, 585],
            [220, 554],
            [248, 527],
            [267, 490],
            [297, 463],
            [337, 460],
            [350, 495],
            [319, 522],
            [282, 540],
            [266, 571],
            [282, 608],
            [311, 638],
            [347, 653],
            [386, 641],
            [426, 631],
            [467, 625],
            [508, 628],
            [544, 647],
            [568, 680],
            [570, 721],
            [585, 757],
            [589, 798],
            [575, 837],
            [548, 867],
            [512, 887],
            [472, 895],
            [464, 875],
            [504, 868],
            [540, 848],
            [564, 814],
            [568, 774],
            [552, 762],
            [526, 794],
            [496, 822],
            [462, 846],
            [236, 749],
            [210, 775],
            [226, 812],
            [257, 839],
            [294, 857],
            [334, 866],
            [375, 863],
            [358, 837],
            [332, 805],
            [302, 777],
            [267, 756],
            [442, 678],
            [483, 683],
            [523, 695],
            [551, 702],
            [534, 666],
            [498, 647],
            [457, 646],
            [416, 654],
            [377, 665],
            [406, 675],
            [232, 572],
            [207, 604],
            [203, 645],
            [228, 675],
            [269, 674],
            [309, 665],
            [283, 641],
            [258, 608],
            [245, 569],
            [292, 493],
            [275, 521],
            [312, 502],
            [321, 476],
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
