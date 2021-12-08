import { Toolboxes } from "@/Toolboxes";
import { Annotations } from "./index";

let annotationsObject: Annotations;

describe("Convert Splines to Paintbrush", () => {
  beforeEach(() => {
    annotationsObject = new Annotations();
    annotationsObject.addAnnotation(Toolboxes.spline);
  });

  test("test add spline points", () => {
    annotationsObject.addSplinePoint({ x: 2, y: 5 }, false);
    const coordinates = annotationsObject.getSplineCoordinates();
    expect(coordinates).toEqual([{ x: 2, y: 5 }]);
  });

  test("test convert spline to paintbrush", () => {
    annotationsObject.addSplinePoint({ x: 2, y: 5 }, false);
    annotationsObject.convertSplineToPaintbrush(0.5);
    const brustrokesCord = annotationsObject.getBrushStrokeCoordinates();
    expect(brustrokesCord).toEqual([{ x: 2, y: 5 }]);
  });

  //Should we be testing 3D?
  //We only set radius to 0.5, should this be the default number?

  test("test closespline", () => {
    annotationsObject.addSplinePoint({ x: 1, y: 1 }, false);
    annotationsObject.addSplinePoint({ x: 10, y: 1 }, false);
    annotationsObject.addSplinePoint({ x: 10, y: 10 }, false);
    annotationsObject.setSplineClosed(true);
    annotationsObject.convertSplineToPaintbrush(0.5);
    const brustrokesCord = annotationsObject.getBrushStrokeCoordinates();
    expect(brustrokesCord).toEqual([
      { x: 1, y: 1 },
      { x: 10, y: 1 },
      { x: 10, y: 10 },
      { x: 1, y: 1 },
    ]);
  });

  test("test openSpline", () => {
    annotationsObject.addSplinePoint({ x: 1, y: 1 }, false);
    annotationsObject.addSplinePoint({ x: 10, y: 1 }, false);
    annotationsObject.addSplinePoint({ x: 10, y: 10 }, false);
    annotationsObject.convertSplineToPaintbrush(0.5);
    const brustrokesCord = annotationsObject.getBrushStrokeCoordinates();
    expect(brustrokesCord).toEqual([
      { x: 1, y: 1 },
      { x: 10, y: 1 },
      { x: 10, y: 10 },
    ]);
  });
});
