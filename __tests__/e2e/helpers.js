const { Origin, By } = require("selenium-webdriver");

const sleep = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

// moves the mouse to origin and then drags to all of the points
// eg a square
// dragBetweenPoints(
//   actions,
//   [100, 100],
//   [ [50, 0], [0, 50], [-50, 0], [0, -50], ],
//   true
// );
const dragBetweenPoints = (actions, origin, points, relative = false) => {
  const [originX, originY] = origin;

  actions.move({ x: originX, y: originY, duration: 10 }).press();

  points.forEach(([x, y]) => {
    actions.move({ x, y, origin: relative ? Origin.POINTER : Origin.VIEWPORT});
  });

  actions.release().perform();
  actions.clear();
};

const clickMouseAtPoint = (actions, [x, y], relative = false, perform=true) => {
  actions
    .move({ x, y, origin: relative ? Origin.POINTER : Origin.VIEWPORT })
    .click();

  if (perform) {
    actions.perform();
    actions.clear();
  }
};

const drawPentagon = (actions, [cx, cy]) => {
  // draws five spline points in a pentagon centred on (cx, cy) (but doesn't close it)
  for (let i = 0; i < 5; i += 1) {
    const x = Math.floor(cx + 50 * Math.cos((i * 2 * Math.PI) / 5));
    const y = Math.floor(cy + 50 * Math.sin((i * 2 * Math.PI) / 5));
    clickMouseAtPoint(actions, [x, y], false, false);
  }
  actions.perform();
  actions.clear();
};

async function clickById(driver, id) {
  const el = await driver.findElement(By.id(id));
  await el.click();
}

export { sleep, clickMouseAtPoint, dragBetweenPoints, drawPentagon, clickById };
