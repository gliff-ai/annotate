import { useEffect, useState, useRef } from "react";
import { BaseCanvas } from "./baseCanvas";
import { PositionAndSize } from "@/annotation/interfaces";
import { PaintbrushCanvasClass } from "@/toolboxes/paintbrush";
import { SplineCanvasClass } from "@/toolboxes/spline";
import { BoundingBoxCanvasClass } from "@/toolboxes/boundingBox";

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
  leftCanvasRefs: {
    [name: string]:
      | PaintbrushCanvasClass
      | SplineCanvasClass
      | BoundingBoxCanvasClass;
  };
  rightCanvasRefs: {
    [name: string]:
      | PaintbrushCanvasClass
      | SplineCanvasClass
      | BoundingBoxCanvasClass;
  };
}

let diffCanvasRef: BaseCanvas;

export const DiffCanvas = (props: Props) => {
  const diffCanvasRef = useRef<BaseCanvas>();

  useEffect(() => {
    drawDiff(diffCanvasRef.current);
  }, []);

  const drawDiff = (diffCanvasRef: BaseCanvas) => {
    if (
      !props.leftCanvasRefs?.splineCanvasRef ||
      !props.rightCanvasRefs?.splineCanvasRef ||
      !props.leftCanvasRefs?.paintbrushCanvasRef ||
      !props.rightCanvasRefs?.paintbrushCanvasRef ||
      !props.leftCanvasRefs?.boundingBoxCanvasRef ||
      !props.rightCanvasRefs?.boundingBoxCanvasRef
    )
      return;

    let diffData, width, height;

    const t0 = performance.now();

    for (const refname of [
      "splineCanvasRef",
      "paintbrushCanvasRef",
      "boundingBoxCanvasRef",
    ]) {
      const leftCanvas = props.leftCanvasRefs[refname].baseCanvas;
      const rightCanvas = props.rightCanvasRefs[refname].baseCanvas;
      width = leftCanvas.canvasContext.canvas.width;
      height = leftCanvas.canvasContext.canvas.height;
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

      if (!diffData) diffData = new Uint8ClampedArray(4 * width * height);

      for (let i = 0; i < diffData.length; i += 4) {
        // compare alpha values for this pixel to detect difference,
        // since we don't care about differences in colour, only differences in
        // whether there's something there or not
        if ((leftData[i + 3] !== 0) !== (rightData[i + 3] !== 0)) {
          diffData[i] = 255;
          diffData[i + 3] = 255;
        }
      }
    }

    console.log(`Diff loop took ${performance.now() - t0}ms`);

    const diffImageData = new ImageData(diffData, width);
    diffCanvasRef.canvasContext.putImageData(diffImageData, 0, 0);
  };

  drawDiff(diffCanvasRef.current);

  return (
    <div
      style={{
        position: "absolute",
        right: "0px",
        width: "50%",
        height: props.showAppBar ? "calc(100% - 85px)" : "100%",
        bottom: "0px",
        pointerEvents: "none",
      }}
    >
      <BaseCanvas
        name="diff"
        scaleAndPan={props.scaleAndPan}
        setScaleAndPan={props.setScaleAndPan}
        canvasPositionAndSize={props.canvasPositionAndSize}
        ref={(ref) => {
          if (ref) {
            drawDiff(ref);
            diffCanvasRef.current = ref;
          }
        }}
      />
    </div>
  );
};
