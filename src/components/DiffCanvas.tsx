import { useEffect, useState } from "react";
import { BaseCanvas } from "./baseCanvas";
import { PositionAndSize } from "@/annotation/interfaces";
import { SplineCanvasClass } from "@/toolboxes/spline";

let diffCanvasRef: BaseCanvas;

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
  useEffect(() => {
    if (!props.leftCanvasRefs || !props.rightCanvasRefs || !diffCanvasRef)
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
    const diffImageData = new ImageData(width, height);
    for (let i = 0; i < diffImageData.data.length; i += 4) {
      // compare alpha values for this pixel to detect difference,
      // since we don't care about differences in colour, only differences in
      // whether there's something there or not
      if (leftData[i + 3] !== rightData[i + 3]) {
        diffImageData.data[i] = 255;
        diffImageData.data[i + 3] = 255;
      }
    }
    console.log(`Diff loop took ${performance.now() - t0}ms`);

    diffCanvasRef.canvasContext.putImageData(diffImageData, 0, 0);
  }, [
    props.leftCanvasRefs.splineCanvasRef?.baseCanvas.canvasContext.canvas.width,
    props.rightCanvasRefs.splineCanvasRef?.baseCanvas.canvasContext.canvas
      .width,
  ]);

  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        top: props.showAppBar ? "85px" : "0px",
        height: props.showAppBar ? "calc(100% - 85px)" : "100%",
      }}
    >
      <BaseCanvas
        scaleAndPan={props.scaleAndPan}
        setScaleAndPan={props.setScaleAndPan}
        canvasPositionAndSize={props.canvasPositionAndSize}
        ref={(ref) => {
          diffCanvasRef = ref;
        }}
      />
    </div>
  );
};
