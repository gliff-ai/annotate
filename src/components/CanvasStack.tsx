import { BackgroundCanvas } from "@/toolboxes/background";
import { SplineCanvas, SplineCanvasClass } from "@/toolboxes/spline";
import { BoundingBoxCanvas } from "@/toolboxes/boundingBox";
import { PaintbrushCanvas } from "@/toolboxes/paintbrush";
import { PositionAndSize } from "@/annotation/interfaces";
import { Mode } from "@/ui";
import { Toolbox } from "@/Toolboxes";
import { Annotations } from "@/annotation";

interface Props {
  displayedImage: ImageBitmap;
  annotationsObject: Annotations;
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  };
  sliceIndex: number;
  viewportPositionAndSize: PositionAndSize;
  activeToolbox: Toolbox;
  mode: Mode;
  showAppBar: boolean;
  redraw: number;
  readonly: boolean;
  canvasRefs?: { [name: string]: SplineCanvasClass };
  setViewportPositionAndSize?: (canvasPositionAndSize: PositionAndSize) => void;
  setCanvasContainerColour?: (colour: number[]) => void;
  setScaleAndPan: (scaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }) => void;
  setMode: (mode: Mode) => void;
  setUIActiveAnnotationID: (id: number) => void;
  setActiveToolbox: (tool: Toolbox) => void;
}

let paintbrushCanvasRef,
  splineCanvasRef: SplineCanvasClass,
  boundingboxCanvasRef;

export const CanvasStack = (props: Props) => {
  // console.log(splineCanvasRef?.baseCanvas.canvasContext);

  return (
    <div
      style={{
        display: "block",
        // position: "fixed",
        bottom: 0,
        width: "100%",
        // the height of the canvas container is 100% of the parent minus the height of the app bar
        // when the app bar is displayed and 100% otherwise.
        height: props.showAppBar ? "calc(100% - 85px)" : "100%",
      }}
    >
      <BackgroundCanvas
        scaleAndPan={props.scaleAndPan}
        displayedImage={props.displayedImage}
        canvasPositionAndSize={props.viewportPositionAndSize}
        setCanvasPositionAndSize={props.setViewportPositionAndSize}
        setCanvasContainerColourCallback={props.setCanvasContainerColour}
        setScaleAndPan={props.setScaleAndPan}
      />
      <SplineCanvas
        scaleAndPan={props.scaleAndPan}
        activeToolbox={props.activeToolbox}
        mode={props.mode}
        setMode={props.setMode}
        annotationsObject={props.annotationsObject}
        displayedImage={props.displayedImage}
        redraw={props.redraw}
        sliceIndex={props.sliceIndex}
        setUIActiveAnnotationID={props.setUIActiveAnnotationID}
        setActiveToolbox={props.setActiveToolbox}
        setScaleAndPan={props.setScaleAndPan}
        readonly={props.readonly}
        ref={(ref) => {
          if (ref) {
            props.canvasRefs.splineCanvasRef = ref;
          }
        }}
      />
      <BoundingBoxCanvas
        scaleAndPan={props.scaleAndPan}
        activeToolbox={props.activeToolbox}
        mode={props.mode}
        setMode={props.setMode}
        annotationsObject={props.annotationsObject}
        displayedImage={props.displayedImage}
        redraw={props.redraw}
        sliceIndex={props.sliceIndex}
        setUIActiveAnnotationID={props.setUIActiveAnnotationID}
        setActiveToolbox={props.setActiveToolbox}
        setScaleAndPan={props.setScaleAndPan}
        readonly={props.readonly}
      />
      <PaintbrushCanvas
        scaleAndPan={props.scaleAndPan}
        activeToolbox={props.activeToolbox}
        mode={props.mode}
        setMode={props.setMode}
        annotationsObject={props.annotationsObject}
        displayedImage={props.displayedImage}
        redraw={props.redraw}
        sliceIndex={props.sliceIndex}
        setUIActiveAnnotationID={props.setUIActiveAnnotationID}
        setActiveToolbox={props.setActiveToolbox}
        setScaleAndPan={props.setScaleAndPan}
        readonly={props.readonly}
      />
    </div>
  );
};