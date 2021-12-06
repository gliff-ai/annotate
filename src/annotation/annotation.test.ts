import { Annotations } from "@/annotation";
import { BrushStroke } from "@/toolboxes/paintbrush";

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
}];

describe("Undo/Redo tests", () => {
    beforeEach(() => {
        annotationsObject = new Annotations();
        annotationsObject.addAnnotation("paintbrush");
    })

    test("undo paintbrush and eraser", () => {
        let color = annotationsObject.getActiveAnnotationColor();
        annotationsObject.addBrushStroke(brushStrokes[0]);
        annotationsObject.addBrushStroke(brushStrokes[1]);
        annotationsObject.undo();
        const canUndoRedo = annotationsObject.undo();
        expect(canUndoRedo).toStrictEqual({ undo: false, redo: true });
        const annotations = annotationsObject.getAllAnnotations();
        expect(annotations === []);
    });

    test("undo addBrushStrokeMulti", () => {
        let color = annotationsObject.getActiveAnnotationColor();
        annotationsObject.addBrushStrokeMulti(brushStrokes);
        const canUndoRedo = annotationsObject.undo();
        expect(canUndoRedo).toStrictEqual({ undo: false, redo: true });
        const annotations = annotationsObject.getAllAnnotations();
        expect(annotations === []);
    });
    
    test("undo clearBrushStrokes", () => {
        let color = annotationsObject.getActiveAnnotationColor();
        annotationsObject.addBrushStrokeMulti(brushStrokes);
        annotationsObject.clearBrushStrokes();
        const canUndoRedo = annotationsObject.undo();
        expect(canUndoRedo).toStrictEqual({ undo: true, redo: true });
        const annotations = annotationsObject.getAllAnnotations();
        expect(annotations === []);
    });
})
