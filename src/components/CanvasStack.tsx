import { ReactElement } from "react";
import { BackgroundCanvas } from "@/toolboxes/background";
import { SplineCanvas, SplineCanvasClass } from "@/toolboxes/spline";
import {
  BoundingBoxCanvas,
  BoundingBoxCanvasClass,
} from "@/toolboxes/boundingBox";
import {
  PaintbrushCanvas,
  PaintbrushCanvasClass,
} from "@/toolboxes/paintbrush";
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
  canvasRefs?: {
    [name: string]:
      | SplineCanvasClass
      | PaintbrushCanvasClass
      | BoundingBoxCanvasClass;
  };
  sidebyside: boolean;
  left?: boolean;
  username?: string;
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

export const CanvasStack = (props: Props): ReactElement => {
  const visible = props.left || props.sidebyside;

  return (
    <div
      style={{
        position: visible ? "relative" : "absolute",
        zIndex: visible ? 0 : -1,
        top: props.showAppBar ? "85px" : "0px", // this becomes unnecessary if we set position: static on the appbar
        width: "100%",
        // the height of the canvas container is 100% of the parent minus the height of the app bar
        // when the app bar is displayed and 100% otherwise.
        height: props.showAppBar ? "calc(100% - 85px)" : "100%",
        borderRight: props.left && props.sidebyside ? "2px solid white" : "0px",
        borderLeft: !props.left && props.sidebyside ? "2px solid white" : "0px",
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
        ref={(ref) => {
          if (ref) {
            props.canvasRefs.boundingBoxCanvasRef = ref;
          }
        }}
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
        ref={(ref) => {
          if (ref) {
            props.canvasRefs.paintbrushCanvasRef = ref;
          }
        }}
      />
      {props.username && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            border: "1px solid",
            borderRadius: "8px",
            borderColor: "#F2F2F2",
            backgroundColor: "white",
            padding: "6px 10px 6px 10px",
            fontWeight: "regular",
          }}
        >
          {props.username}
        </div>
      )}
    </div>
  );
};

CanvasStack.defaultProps = {
  canvasRefs: {},
  setViewportPositionAndSize: null,
  setCanvasContainerColour: null,
  left: false,
  username: null,
};
