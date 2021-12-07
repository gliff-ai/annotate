import { Annotations } from "@/annotation";
import { BrushStroke } from "@/toolboxes/paintbrush";
import { Annotation } from "..";
import { Toolbox, Toolboxes } from "@/Toolboxes";

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

    test("undo click-select", () => {
        // make first brushstroke:
        annotationsObject.addBrushStroke(brushStrokes[0]);
        // make new annotation with brushstroke in different position:
        annotationsObject.addAnnotation("paintbrush", undefined, undefined, undefined, [{
            coordinates: [{ x: 300, y: 100 }, { x: 500, y: 200 }, { x: 500, y: 100 }],
            spaceTimeInfo: { z: 0, t: 0 },
            brush: {
                color: undefined,
                radius: 20,
                type: "paint",
                is3D: false,
            },
        }]);
        // click-select first annotation:
        let id = annotationsObject.clickSelect(110, 110, 0, (id: number) => { }, (toolbox: Toolbox) => { });
        expect(id).toBe(0);
        // click-select second annotation:
        id = annotationsObject.clickSelect(310, 110, 0, (id: number) => { }, (toolbox: Toolbox) => { });
        expect(id).toBe(1);

        // undo both selections:
        annotationsObject.undo();
        expect(annotationsObject.getActiveAnnotationID()).toBe(0);
        annotationsObject.undo();
        expect(annotationsObject.getActiveAnnotationID()).toBe(1);
    })
})
