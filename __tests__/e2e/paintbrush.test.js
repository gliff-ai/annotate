const { until, By, Origin } = require("selenium-webdriver");
const {
  dragBetweenPoints,
  drawPentagon,
  clickMouseAtPoint,
  clickById,
} = require("./helpers");

const { wrapper, test, webdriver } =
  require("@gliff-ai/jest-browserstack-automate")("Annotate", [
    {
      browserName: "Chrome",
      browser_version: "latest",
      os: "OS X",
      os_version: "Big Sur",
    },
    {
      browserName: "Chrome",
      browser_version: "latest",
      os: "Windows",
      os_version: "10",
    },
    {
      browserName: "Safari",
      browser_version: "latest",
      os: "OS X",
      os_version: "Big Sur",
    },
    {
      browserName: "Edge",
      browser_version: "latest",
      os: "Windows",
      os_version: "10",
    },
  ]);

const { TARGET_URL = "http://localhost:3000" } = process.env;

wrapper(() => {
  describe("Desktop Percy complex screenshot", () => {
    test(
      "paintbrush-splodge",
      async (driver, percySnapshot) => {
        await driver.get(TARGET_URL);

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

        // regular splines:
        await clickById(driver, "id-add-new-annotation");
        await clickById(driver, "id-spline-toolbox");
        await drawPentagon(actions, [500, 200]); // open spline
        await clickById(driver, "id-add-new-annotation");
        await drawPentagon(actions, [500, 400]); // closed spline
        await clickById(driver, "id-close-active-spline");

        // test select tool:
        await clickById(driver, "id-select-annotation");
        await clickMouseAtPoint(actions, [250, 200]);

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
        await dragBetweenPoints(
          actions,
          [350, 500],
          [
            [350, 600],
            [450, 600],
            [450, 500],
          ]
        );
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

        // upload snapshot to Percy:
        await percySnapshot(driver, "paintbrush-splodge");
      },
      300000
    );
  });
});
