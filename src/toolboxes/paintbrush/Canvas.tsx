import React from "react";
import { Component } from "react";

import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";
import {
  Annotations,
  canvasToImage,
  imageToCanvas,
  imageToOriginalCanvas,
} from "../../annotation";
import { XYPoint } from "../../annotation/interfaces";
import { ClientPoint } from "../../baseCanvas/CoordinateSystem";

interface Props extends BaseProps {
  isActive: boolean;
  annotationsObject: Annotations;
  imageWidth: number;
  imageHeight: number;
}

export class PaintbrushCanvas extends Component<Props> {
  private baseCanvas: any;
  private backCanvas: any;
  private isPressing: boolean;
  private isDrawing: boolean;
  private points: [number, number][];

  state: {
    cursor: "crosshair" | "none";
  };

  constructor(props: Props) {
    super(props);

    this.isPressing = false;
    this.isDrawing = false;
    this.points = [];
  }

  handlePointerMove = (x: number, y: number) => {
    if (this.isPressing && !this.isDrawing) {
      // Start drawing and add point
      this.isDrawing = true;
      this.points.push([x, y]);
    }

    if (this.isDrawing) {
      // Add new point
      this.points.push([x, y]);

      // Draw current points
      this.drawPoints(
        this.points,
        "#0000FF",
        20,
        true,
        this.baseCanvas.canvasContext
      );
    }

    // this.mouseHasMoved = true;
  };

  drawPoints = (
    points: [number, number][],
    brushColor: string,
    brushRadius: number,
    clearCanvas: boolean = true,
    context: any
  ) => {
    function midPointBetween(p1: [number, number], p2: [number, number]) {
      return {
        x: p1[0] + (p2[0] - p1[0]) / 2,
        y: p1[1] + (p2[1] - p1[1]) / 2,
      };
    }

    context.lineJoin = "round";
    context.lineCap = "round";
    context.strokeStyle = brushColor;

    if (clearCanvas) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
    context.lineWidth = brushRadius * 2;

    let p1 = points[0];
    let p2 = points[1];

    context.moveTo(p2[0], p2[1]);
    context.beginPath();

    for (let i = 1, len = points.length; i < len; i++) {
      // we pick the point between pi+1 & pi+2 as the
      // end point and p1 as our control point
      const midPoint = midPointBetween(p1, p2);

      context.quadraticCurveTo(p1[0], p1[1], midPoint.x, midPoint.y);
      p1 = points[i];
      p2 = points[i + 1];
    }

    // Draw last line as a straight line while
    // we wait for the next point to be able to calculate
    // the bezier control point
    context.lineTo(p1[0], p1[1]);
    context.stroke();
  };

  drawAllStrokes = () => {
    const { brushStrokes } = this.props.annotationsObject.getActiveAnnotation();

    for (let i = 0; i < brushStrokes.length; i++) {
      this.drawPoints(
        brushStrokes[i].coordinates,
        brushStrokes[i].brushColor,
        brushStrokes[i].brushRadius,
        false,
        this.backCanvas.canvasContext
      );
    }
  };

  saveLine = (brushColor = "#00ff00", brushRadius = 20) => {
    if (this.points.length < 2) return;

    const { brushStrokes } = this.props.annotationsObject.getActiveAnnotation();

    brushStrokes.push({
      brushColor,
      brushRadius,
      coordinates: [...this.points],
    });

    console.log(brushStrokes);

    // Reset points array
    this.points.length = 0;

    /*
    const width = this.canvas.temp.width;
    const height = this.canvas.temp.height;

    // Copy the line to the drawing canvas
    this.ctx.drawing.drawImage(this.canvas.temp, 0, 0, width, height);

    // Clear the temporary line-drawing canvas
    this.ctx.temp.clearRect(0, 0, width, height);

    this.triggerOnChange(); */
    this.drawAllStrokes();
  };

  /*** Mouse events ****/
  onClick = (canvasX: number, canvasY: number): void => {};

  onMouseDown = (canvasX: number, canvasY: number): void => {
    // Start painting
    console.log("PB mouse down!");

    // Start drawing
    this.isPressing = true;

    // Ensure the initial down position gets added to our line
    this.handlePointerMove(canvasX, canvasY);
  };

  onMouseMove = (canvasX: number, canvasY: number): void => {
    this.handlePointerMove(canvasX, canvasY);
  };

  onMouseUp = (canvasX: number, canvasY: number): void => {
    // End painting & save painting
    console.log("PB mouse up");
    this.isPressing = false;

    console.log(this.points);
    // Draw to this end pos
    // this.handleDrawMove(canvasX, canvasY);

    // Stop drawing & save the drawn line
    this.isDrawing = false;

    this.saveLine();
  };

  componentDidUpdate(): void {
    // Redraw if we change pan or zoom
    const activeAnnotation = this.props.annotationsObject.getActiveAnnotation();

    if (activeAnnotation?.coordinates) {
      //this.drawSplineVector(activeAnnotation.coordinates);
      //repaint
    }
  }

  render() {
    return (
      <div>
        <BaseCanvas
          cursor={"none"}
          ref={(backCanvas) => (this.backCanvas = backCanvas)}
          name="backCanvas"
          scaleAndPan={this.props.scaleAndPan}
        />
        <BaseCanvas
          onClick={this.onClick}
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          cursor={this.props.isActive ? "crosshair" : "none"}
          ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
          name="paintbrush"
          scaleAndPan={this.props.scaleAndPan}
        />
      </div>
    );
  }
}
