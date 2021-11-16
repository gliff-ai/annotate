import { Toolboxes } from "@/Toolboxes";
import { Annotations } from "./index";

const prevLabel = "label2";
let annotationsObject: Annotations;

describe("labels assignment", () => {
  beforeEach(() => {
    annotationsObject = new Annotations();
  });

  test("test add spline points", () => {
    annotationsObject.addAnnotation(Toolboxes.spline);
    annotationsObject.addSplinePoint({ x: 2, y: 5 }, false);
    const coordinates = annotationsObject.getSplineCoordinates();
    expect(coordinates).toEqual([{ x: 2, y: 5 }]);
  });
});
