import { Annotations } from "@/annotation";
import { BrushStroke } from "@/toolboxes/paintbrush";
import { Annotation } from "..";
import { Toolbox, Toolboxes } from "@/Toolboxes";
import { Spline } from "@/toolboxes/spline";
import { XYPoint } from "./interfaces";
import { BoundingBoxCoordinates } from "@/toolboxes/boundingBox";

let annotationsObject: Annotations;

const brushStrokes: BrushStroke[] = [
  {
    coordinates: [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
      { x: 200, y: 100 },
    ],
    spaceTimeInfo: { z: 0, t: 0 },
    brush: {
      color: undefined,
      radius: 20,
      type: "paint",
      is3D: false,
    },
  },
  {
    coordinates: [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
      { x: 200, y: 100 },
    ],
    spaceTimeInfo: { z: 0, t: 0 },
    brush: {
      color: undefined,
      radius: 20,
      type: "erase",
      is3D: false,
    },
  },
];

const spline: Spline = {
  coordinates: [
    { x: 100, y: 300 },
    { x: 200, y: 300 },
    { x: 100, y: 400 },
  ],
  spaceTimeInfo: { z: 0, t: 0 },
  isClosed: false,
};

let blankAnnotation: Annotation;

describe("Undo/Redo paintbrush tests", () => {
  beforeEach(() => {
    annotationsObject = new Annotations();
    annotationsObject.addAnnotation("paintbrush");
    blankAnnotation = annotationsObject.getAllAnnotations()[0];
  });

  test("undo paintbrush and eraser", () => {
    annotationsObject.addBrushStroke(brushStrokes[0]);
    annotationsObject.addBrushStroke(brushStrokes[1]);
    annotationsObject.undo();
    const canUndoRedo = annotationsObject.undo();
    expect(canUndoRedo).toStrictEqual({ undo: false, redo: true });
    const annotations = annotationsObject.getAllAnnotations();
    expect(annotations).toStrictEqual([blankAnnotation]);
  });

  test("undo addBrushStrokeMulti", () => {
    annotationsObject.addBrushStrokeMulti(brushStrokes);
    const canUndoRedo = annotationsObject.undo();
    expect(canUndoRedo).toStrictEqual({ undo: false, redo: true });
    const annotations = annotationsObject.getAllAnnotations();
    expect(annotations).toStrictEqual([blankAnnotation]);
  });

  test("undo clearBrushStrokes", () => {
    annotationsObject.addBrushStrokeMulti(brushStrokes);
    annotationsObject.clearBrushStrokes();
    const canUndoRedo = annotationsObject.undo();
    expect(canUndoRedo).toStrictEqual({ undo: true, redo: true });
    const annotations = annotationsObject.getAllAnnotations();
    expect(annotations.length).toBe(1);
    expect(annotations[0].brushStrokes.length).toBe(2);
  });

  test("undo click-select", () => {
    // make first brushstroke:
    annotationsObject.addBrushStroke(brushStrokes[0]);
    // make new annotation with brushstroke in different position:
    annotationsObject.addAnnotation(
      "paintbrush",
      undefined,
      undefined,
      undefined,
      [
        {
          coordinates: [
            { x: 300, y: 100 },
            { x: 500, y: 200 },
            { x: 500, y: 100 },
          ],
          spaceTimeInfo: { z: 0, t: 0 },
          brush: {
            color: undefined,
            radius: 20,
            type: "paint",
            is3D: false,
          },
        },
      ]
    );
    // click-select first annotation:
    let id = annotationsObject.clickSelect(
      110,
      110,
      0,
      (id: number) => {},
      (toolbox: Toolbox) => {}
    );
    expect(id).toBe(0);
    // click-select second annotation:
    id = annotationsObject.clickSelect(
      310,
      110,
      0,
      (id: number) => {},
      (toolbox: Toolbox) => {}
    );
    expect(id).toBe(1);

    // undo both selections:
    annotationsObject.undo();
    expect(annotationsObject.getActiveAnnotationID()).toBe(0);
    annotationsObject.undo();
    expect(annotationsObject.getActiveAnnotationID()).toBe(1);
  });
});

describe("Undo/Redo spline tests", () => {
  beforeEach(() => {
    annotationsObject = new Annotations();
    annotationsObject.addAnnotation("spline");
    blankAnnotation = annotationsObject.getAllAnnotations()[0];

    // draw a spline:
    spline.coordinates.forEach((point: XYPoint) => {
      annotationsObject.addSplinePoint(point);
    });
  });

  test("addSplinePoint / undo / redo", () => {
    // addSplinePoint is called in beforeEach, we test that it worked here:
    expect(annotationsObject.getActiveAnnotation().spline).toStrictEqual(
      spline
    );
    expect(annotationsObject.getSplineCoordinates()).toStrictEqual(
      spline.coordinates
    );

    // hit undo three times, should undo the addSplinePoint calls from beforeEach:
    for (let i = 0; i < 3; i += 1) {
      annotationsObject.undo();
    }
    expect(annotationsObject.getSplineCoordinates()).toStrictEqual([]);

    // test redo:
    for (let i = 0; i < 3; i += 1) {
      annotationsObject.redo();
    }
    expect(annotationsObject.getSplineCoordinates()).toStrictEqual(
      spline.coordinates
    );
  });

  test("deleteSplinePoint / undo / redo", () => {
    // delete spline points:
    [2, 1, 0].forEach((i) => {
      annotationsObject.deleteSplinePoint(i);
    });
    expect(annotationsObject.getSplineCoordinates()).toStrictEqual([]);

    // hit undo three times, should undo the deletions:
    for (let i = 0; i < 3; i += 1) {
      annotationsObject.undo();
    }
    expect(annotationsObject.getActiveAnnotation().spline).toStrictEqual(
      spline
    );

    // test redo:
    for (let i = 0; i < 3; i += 1) {
      annotationsObject.redo();
    }
    expect(annotationsObject.getSplineCoordinates()).toStrictEqual([]);
  });

  test("updateSplinePoint / undo / redo", () => {
    // move point 0:
    annotationsObject.updateSplinePoint(55, 255, 0);

    expect(annotationsObject.getSplineCoordinates()[0]).toStrictEqual({
      x: 55,
      y: 255,
    });

    annotationsObject.undo();

    expect(annotationsObject.getAllAnnotations()[0].spline).toStrictEqual(
      spline
    );

    annotationsObject.redo();
    expect(annotationsObject.getSplineCoordinates()[0]).toStrictEqual({
      x: 55,
      y: 255,
    });
  });

  test("insertSplinePoint / undo / redo", () => {
    // insert spline point:
    annotationsObject.insertSplinePoint(1, { x: 250, y: 250 });

    const newCoords = [spline.coordinates[0]]
      .concat([{ x: 250, y: 250 }])
      .concat(spline.coordinates.slice(1, 3));

    expect(annotationsObject.getSplineCoordinates()).toStrictEqual(newCoords);

    annotationsObject.undo();

    expect(annotationsObject.getAllAnnotations()[0].spline).toStrictEqual(
      spline
    );

    annotationsObject.redo();
    expect(annotationsObject.getSplineCoordinates()).toStrictEqual(newCoords);
  });

  test("setSplineSpaceTimeInfo", () => {
    annotationsObject.setSplineSpaceTimeInfo(2, 3);

    expect(annotationsObject.getSplineSpaceTimeInfo()).toStrictEqual({
      z: 2,
      t: 3,
    });
  });

  test("setSplineClosed / undo / redo", () => {
    annotationsObject.setSplineClosed(true);
    expect(annotationsObject.splineIsClosed()).toBe(true);

    annotationsObject.undo();
    expect(annotationsObject.splineIsClosed()).toBe(false);

    annotationsObject.redo();
    expect(annotationsObject.splineIsClosed()).toBe(true);
  });

  test("click select spline / undo / redo", () => {
    // add a brushstroke annotation:
    annotationsObject.addAnnotation("paintbrush");
    annotationsObject.addBrushStroke(brushStrokes[0]);

    // "click-select" the spline at the midpoint of its first edge:
    annotationsObject.clickSelect(
      (spline.coordinates[0].x + spline.coordinates[0].x) / 2,
      (spline.coordinates[1].y + spline.coordinates[1].y) / 2,
      0,
      (id: number) => {},
      (toolbox: string) => {}
    );
    expect(annotationsObject.getActiveAnnotationID()).toBe(0);

    // test undo/redo:
    annotationsObject.undo();
    expect(annotationsObject.getActiveAnnotationID()).toBe(1);
    annotationsObject.redo();
    expect(annotationsObject.getActiveAnnotationID()).toBe(0);
  });
});

describe("Undo/Redo bounding box tests", () => {
  beforeEach(() => {
    annotationsObject = new Annotations();
    annotationsObject.addAnnotation("boundingBox", undefined, undefined, {
      coordinates: {
        topLeft: { x: 100, y: 100 },
        bottomRight: { x: 200, y: 200 },
      },
      spaceTimeInfo: { z: 0, t: 0 },
    });
  });

  test("updateBoundingBoxCoordinates / undo / redo", () => {
    const newCoords = {
      topLeft: { x: 100, y: 100 },
      bottomRight: { x: 150, y: 150 },
    };
    annotationsObject.updateBoundingBoxCoordinates(newCoords);
    expect(annotationsObject.getBoundingBoxCoordinates()).toStrictEqual(
      newCoords
    );
    annotationsObject.undo();
    expect(annotationsObject.getBoundingBoxCoordinates()).toStrictEqual({
      topLeft: { x: 100, y: 100 },
      bottomRight: { x: 200, y: 200 },
    });
    annotationsObject.redo();
    expect(annotationsObject.getBoundingBoxCoordinates()).toStrictEqual(
      newCoords
    );
  });

  test("clearBoundingBoxCoordinates / undo / redo", () => {
    const oldBB = annotationsObject.getAllBoundingBoxes(0);
    const blankCoords: BoundingBoxCoordinates = {
      topLeft: null,
      bottomRight: null,
    };
    annotationsObject.clearBoundingBoxCoordinates();
    expect(annotationsObject.getBoundingBoxCoordinates()).toStrictEqual(
      blankCoords
    );
    annotationsObject.undo();
    expect(annotationsObject.getAllBoundingBoxes(0)).toStrictEqual(oldBB);
    annotationsObject.redo();
    expect(annotationsObject.getBoundingBoxCoordinates()).toStrictEqual(
      blankCoords
    );
  });

  test("setBoundingBoxTimeInfo / undo / redo", () => {
    annotationsObject.setBoundingBoxTimeInfo(2, 3);
    expect(
      annotationsObject.getBoundingBoxForActiveAnnotation().spaceTimeInfo
    ).toStrictEqual({ z: 2, t: 3 });
    annotationsObject.undo();
    expect(
      annotationsObject.getBoundingBoxForActiveAnnotation().spaceTimeInfo
    ).toStrictEqual({ z: 0, t: 0 });
    annotationsObject.redo();
    expect(
      annotationsObject.getBoundingBoxForActiveAnnotation().spaceTimeInfo
    ).toStrictEqual({ z: 2, t: 3 });
  });

  test("clickSelect boundingBox / undo / redo", () => {
    // add a brushstroke annotation:
    annotationsObject.addAnnotation(
      "paintbrush",
      undefined,
      undefined,
      undefined,
      [brushStrokes[0]]
    );
    expect(annotationsObject.getActiveAnnotationID()).toBe(1);

    // click-select the boundingBox (bottom-left corner, which shouldn't overlap with the brushstroke):
    annotationsObject.clickSelect(
      100,
      200,
      0,
      (id: number) => {},
      (toolbox: Toolbox) => {}
    );
    expect(annotationsObject.getActiveAnnotationID()).toBe(0);

    // test undo / redo:
    annotationsObject.undo();
    expect(annotationsObject.getActiveAnnotationID()).toBe(1);
    annotationsObject.redo();
    expect(annotationsObject.getActiveAnnotationID()).toBe(0);
  });
});
