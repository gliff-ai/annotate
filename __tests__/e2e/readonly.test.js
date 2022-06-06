const { until, By, Origin } = require("selenium-webdriver");
const { skipPartiallyEmittedExpressions } = require("typescript");
const {
  dragBetweenPoints,
  drawPentagon,
  clickMouseAtPoint,
  clickById,
  sleep,
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

const { TARGET_URL = "http://localhost:3000/readonly" } = process.env;

wrapper(() => {
  describe("Desktop Percy complex screenshot", () => {
    test(
      "paintbrush-splodge",
      async (driver, percySnapshot) => {
        await driver.get(TARGET_URL);

        await driver.wait(until.titleIs("gliff.ai ANNOTATE"), 10000);

        await clickById(driver, "id-layers-button");

        // upload snapshot to Percy:
        await percySnapshot(driver, "paintbrush-splodge");

        await sleep();
      },
      3000000
    );
  });
});
