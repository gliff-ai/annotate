import { Toolboxes } from "@/Toolboxes";
import { BrushStroke } from "@/toolboxes/paintbrush";
import { Annotations } from "./index";

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
];

describe("Fill Active Paintbrush", () => {
  beforeEach(() => {
    annotationsObject = new Annotations();
    annotationsObject.addAnnotation(Toolboxes.paintbrush);
  });

  test("test draw brushstrokes", () => {
    annotationsObject.addBrushStroke(brushStrokes[0]);
    annotationsObject.fillBrush(0, false);
    const strokes = annotationsObject.getBrushStrokeCoordinates();
    expect(strokes).toEqual([
      { x: 100, y: 100 },
      { x: 200, y: 200 },
      { x: 200, y: 100 },
    ]);
  });
});
