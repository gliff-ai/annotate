import { Annotations } from "@/annotation";
import { BrushStroke } from "@/toolboxes/paintbrush";
import { Annotation } from "..";
import { Toolbox, Toolboxes } from "@/Toolboxes";
import { Spline } from "@/toolboxes/spline";
import { XYPoint } from "./interfaces";

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
  });

  test("undo addSplinePoint and deleteSplinePoint", () => {
    // draw a spline:
    spline.coordinates.forEach((point: XYPoint) => {
      annotationsObject.addSplinePoint(point);
    });
    expect(annotationsObject.getActiveAnnotation().spline).toStrictEqual(
      spline
    );
    expect(annotationsObject.getSplineCoordinates()).toStrictEqual(
      spline.coordinates
    );

    // delete spline points:
    [2, 1, 0].forEach((i) => {
      annotationsObject.deleteSplinePoint(i);
    });
    expect(annotationsObject.getSplineCoordinates()).toStrictEqual([]);

    // undo deleteSplinePoint:
    for (let i = 0; i < 3; i += 1) {
      annotationsObject.undo();
    }
    expect(annotationsObject.getActiveAnnotation().spline).toStrictEqual(
      spline
    );
    expect(annotationsObject.getSplineCoordinates()).toStrictEqual(
      spline.coordinates
    );

    // undo addSplinePoint:
    for (let i = 0; i < 3; i += 1) {
      annotationsObject.undo();
    }
    expect(annotationsObject.getSplineCoordinates()).toStrictEqual([]);
  });

  test("undo updateSplinePoint", () => {
    // draw a spline:
    spline.coordinates.forEach((point: XYPoint) => {
      annotationsObject.addSplinePoint(point);
    });

    // move point 0:
    annotationsObject.updateSplinePoint(55, 255, 0);

    expect(annotationsObject.getSplineCoordinates()[0]).toStrictEqual({
      x: 55,
      y: 255,
    });

    // undo:
    annotationsObject.undo();

    expect(annotationsObject.getAllAnnotations()[0].spline).toStrictEqual(
      spline
    );
  });

  test("undo insertSplinePoint", () => {
    // draw a spline:
    spline.coordinates.forEach((point: XYPoint) => {
      annotationsObject.addSplinePoint(point);
    });

    // insert spline point:
    annotationsObject.insertSplinePoint(1, { x: 250, y: 250 });

    expect(annotationsObject.getSplineCoordinates()).toStrictEqual(
      [spline.coordinates[0]]
        .concat([{ x: 250, y: 250 }])
        .concat(spline.coordinates.slice(1, 3))
    );
      
      annotationsObject.undo()

      expect(annotationsObject.getAllAnnotations()[0].spline).toStrictEqual(spline)
  });
});
