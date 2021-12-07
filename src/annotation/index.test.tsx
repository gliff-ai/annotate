import { Toolboxes } from "@/Toolboxes";
import { Annotations } from "./index";

let annotationsObject: Annotations;
let radius = 0.5;
let is3D = false;

describe("Convert Splines to Paintbrush", () => {
  beforeEach(() => {
    annotationsObject = new Annotations();
  });

  test("test add spline points", () => {
    annotationsObject.addAnnotation(Toolboxes.spline);
    annotationsObject.addSplinePoint({ x: 2, y: 5 }, false);
    const coordinates = annotationsObject.getSplineCoordinates();
    expect(coordinates).toEqual([{ x: 2, y: 5 }]);
  });

  test("test convert spline to paintbrush", () => {
    const coordinates = annotationsObject.getSplineCoordinates();
    const color = annotationsObject.getActiveAnnotationColor();
    const spaceTimeInfo = annotationsObject.getSplineSpaceTimeInfo();

    const brushStroke = {
      coordinates,
      spaceTimeInfo,
      brush: {
        radius,
        type: "paint",
        color,
        is3D,
      },
    };
    annotationsObject.addAnnotation(Toolboxes.paintbrush);
    annotationsObject.addSplinePoint({ x: 2, y: 5 }, false);
    annotationsObject.addBrushStroke(brushStroke, false);
  });
});
