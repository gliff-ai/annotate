const {
  wrapper,
  test,
  webdriver,
} = require("@gliff-ai/jest-browserstack-automate");

const { TARGET_URL = "http://localhost:3000/" } = process.env;

wrapper(() => {
  describe("Load page", () => {
    test("loads the page", async (driver) => {
      await driver.get(TARGET_URL);

      await driver.wait(webdriver.until.titleMatches(/Annotate/i), 5000);
      const title = await driver.getTitle();

      expect(title).toEqual("gliff.ai ANNOTATE");
    }, 6000000);
  });
});
