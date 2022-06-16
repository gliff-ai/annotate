import { useEffect, useState, useRef } from "react";
import { BaseCanvas } from "./baseCanvas";
import { PositionAndSize } from "@/annotation/interfaces";
import { SplineCanvasClass } from "@/toolboxes/spline";

interface Props {
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  };
  setScaleAndPan: (scaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }) => void;
  canvasPositionAndSize: PositionAndSize;
  showAppBar: boolean;
  leftCanvasRefs: { [name: string]: SplineCanvasClass };
  rightCanvasRefs: { [name: string]: SplineCanvasClass };
}

export const DiffCanvas = (props: Props) => {
  const drawDiff = (diffCanvasRef: BaseCanvas) => {
    if (
      !props.leftCanvasRefs?.splineCanvasRef ||
      !props.rightCanvasRefs?.splineCanvasRef
    )
      return;

    const leftCanvas = props.leftCanvasRefs.splineCanvasRef.baseCanvas;
    const rightCanvas = props.rightCanvasRefs.splineCanvasRef.baseCanvas;
    const width = leftCanvas.canvasContext.canvas.width;
    const height = leftCanvas.canvasContext.canvas.height;
    const leftData = leftCanvas.canvasContext.getImageData(
      0,
      0,
      width,
      height
    ).data; // RGBA
    const rightData = rightCanvas.canvasContext.getImageData(
      0,
      0,
      width,
      height
    ).data; // RGBA

    const t0 = performance.now();
    const diffData = new Uint8ClampedArray(4 * width * height);
    for (let i = 0; i < diffData.length; i += 4) {
      // compare alpha values for this pixel to detect difference,
      // since we don't care about differences in colour, only differences in
      // whether there's something there or not
      if ((leftData[i + 3] !== 0) !== (rightData[i + 3] !== 0)) {
        diffData[i] = 255;
        diffData[i + 3] = 255;
      }
    }
    console.log(`Diff loop took ${performance.now() - t0}ms`);

    const diffImageData = new ImageData(diffData, width);
    diffCanvasRef.canvasContext.putImageData(diffImageData, 0, 0);
  };

  return (
    <div
      style={{
        position: "absolute",
        right: "0px",
        width: "50%",
        height: props.showAppBar ? "calc(100% - 85px)" : "100%",
        bottom: "0px",
      }}
    >
      <BaseCanvas
        name="diff"
        scaleAndPan={props.scaleAndPan}
        setScaleAndPan={props.setScaleAndPan}
        canvasPositionAndSize={props.canvasPositionAndSize}
        ref={(ref) => {
          if (ref) drawDiff(ref);
        }}
      />
    </div>
  );
};
