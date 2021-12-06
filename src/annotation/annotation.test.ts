import { Annotations } from "@/annotation";
import { BrushStroke } from "@/toolboxes/paintbrush";
import { Annotation } from "..";

let annotationsObject: Annotations;

const brushStrokes: BrushStroke[] = [{
    coordinates: [{ x: 100, y: 100 }, { x: 200, y: 200 }, { x: 200, y: 100 }],
    spaceTimeInfo: { z: 0, t: 0 },
    brush: {
        color: undefined,
        radius: 20,
        type: "paint",
        is3D: false,
    },
},
{
    coordinates: [{ x: 100, y: 100 }, { x: 200, y: 200 }, { x: 200, y: 100 }],
    spaceTimeInfo: { z: 0, t: 0 },
    brush: {
        color: undefined,
        radius: 20,
        type: "erase",
        is3D: false,
    },
    }
];

let blankAnnotation: Annotation;

describe("Undo/Redo tests", () => {
    beforeEach(() => {
        annotationsObject = new Annotations();
        annotationsObject.addAnnotation("paintbrush");
        blankAnnotation = annotationsObject.getAllAnnotations()[0];
    })

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
})
