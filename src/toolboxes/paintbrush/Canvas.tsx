import React, { ReactNode } from "react";
import { Component } from "react";

import { BaseCanvas, CanvasProps } from "../../baseCanvas";
import {
  Annotations,
  canvasToImage,
  imageToOriginalCanvas,
} from "../../annotation";
import { XYPoint } from "../../annotation/interfaces";

interface Props extends CanvasProps {
  brushType: string;
  annotationsObject: Annotations;
  imageWidth: number;
  imageHeight: number;
  brushRadius: number;
}


export class PaintbrushCanvas extends Component<Props> {
  private baseCanvas: BaseCanvas;
  private drawingCanvas: BaseCanvas;
  private isPressing: boolean;
  private isDrawing: boolean;
  private points: XYPoint[];

  state: {
    cursor: "crosshair" | "none" | "not-allowed";
    hideBackCanvas: boolean;
  };

  constructor(props: Props) {
    super(props);

    this.isPressing = false;
    this.isDrawing = false;
    this.points = [];
    this.state = {cursor: "none", hideBackCanvas: false}
  }

  handlePointerMove = (canvasX: number, canvasY: number): void => {
    const { x, y } = canvasToImage(
      canvasX,
      canvasY,
      this.props.imageWidth,
      this.props.imageHeight,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    if (this.isPressing && !this.isDrawing) {
      // Start drawing and add point
      this.isDrawing = true;
      this.points.push({x, y});
    }

    if (this.isDrawing) {
      // Add new point
      this.points.push({x, y});

      // Draw current points
      this.drawPoints(
        this.points,
        "#0000FF",
        this.props.brushRadius,
        this.props.brushType,
        true,
        this.baseCanvas.canvasContext
      );
    }
  };

  drawPoints = (
    imagePoints: XYPoint[],
    brushColor: string,
    brushRadius: number,
    brushType: string,
    clearCanvas: boolean = true,
    context: CanvasRenderingContext2D
  ): void => {
    const points = imagePoints.map((point):XYPoint => {
      const { x, y } = imageToOriginalCanvas(
        point.x,
        point.y,
        this.props.imageWidth,
        this.props.imageHeight,
        this.props.canvasPositionAndSize
      );
      return {x: x, y: y};
    });

    function midPointBetween(p1: XYPoint, p2: XYPoint) {
      return {
        x: p1.x + (p2.x - p1.x) / 2,
        y: p1.y + (p2.y - p1.y) / 2,
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

    context.moveTo(p2.x, p2.y);
    context.beginPath();

    for (let i = 1, len = points.length; i < len; i++) {
      // we pick the point between pi+1 & pi+2 as the
      // end point and p1 as our control point
      const midPoint = midPointBetween(p1, p2);

      context.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      p1 = points[i];
      p2 = points[i + 1];
    }

    // Draw last line as a straight line while
    // we wait for the next point to be able to calculate
    // the bezier control point
    context.lineTo(p1.x, p1.y);
    context.stroke();
  };

  drawAllStrokes = (): void => {
    const { brushStrokes } = this.props.annotationsObject.getActiveAnnotation();

    console.log(this.drawingCanvas)

    for (let i = 0; i < brushStrokes.length; i++) {
      this.drawPoints(
        brushStrokes[i].coordinates,
        brushStrokes[i].brushColor,
        brushStrokes[i].brushRadius,
        brushStrokes[i].brushType,
        false,
        this.drawingCanvas.canvasContext
      );
    }
  };



  saveLine = (brushRadius = 20, brushColor = "#00ff00"): void => {
    if (this.points.length < 2) return;

    const { brushStrokes } = this.props.annotationsObject.getActiveAnnotation();

    brushStrokes.push({
      brushColor,
      brushRadius,
      coordinates: [...this.points],
      brushType: this.props.brushType
    });

    // Reset points array
    this.points.length = 0;

    this.drawAllStrokes();
    const context = this.baseCanvas.canvasContext;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  };

  /*** Mouse events ****/
  onMouseDown = (canvasX: number, canvasY: number): void => {
    // Start drawing
    // if(this.props.brushType === "eraser"){
    //   const sourceData = this.drawingCanvas.canvasContext.getImageData(0, 0, this.drawingCanvas.canvas.width, this.drawingCanvas.canvas.width)

    //   console.log(sourceData)

    //   const context = this.baseCanvas.canvasContext;

    //   context.putImageData(sourceData, 0, 0);


    //   this.setState({hideBackCanvas: true})
    // }

    this.isPressing = true;

    // Ensure the initial down position gets added to our line
    this.handlePointerMove(canvasX, canvasY);

  };

  onMouseMove = (canvasX: number, canvasY: number): void => {
    this.handlePointerMove(canvasX, canvasY);
  };

  onMouseUp = (canvasX: number, canvasY: number): void => {
    // End painting & save painting
    this.isPressing = false;

    // Draw to this end pos
    // this.handleDrawMove(canvasX, canvasY);

    // Stop drawing & save the drawn line
    this.isDrawing = false;

    this.saveLine(this.props.brushRadius);
    this.drawAllStrokes();
  };

  componentDidUpdate(): void {
    // Redraw if we change pan or zoom
    const activeAnnotation = this.props.annotationsObject.getActiveAnnotation();

    if (activeAnnotation?.brushStrokes.length > 0) {
      //this.drawSplineVector(activeAnnotation.coordinates);
      //repaint
      this.drawAllStrokes();
    }
  }

  getCursor = () =>{
    console.log(this.props.brushType)
    if(this.props.brushType == "paintbrush"){
      return "crosshair"
    }
    else if (this.props.brushType == "eraser"){
      return "not-allowed"
    }
    return "none"
  }
//
  render = (): ReactNode => {
    return (
      //We have two canvases in order to be able to erase stuff. 
      <div style={{ pointerEvents: this.props.brushType == "paintbrush" ? "auto" : "none" }}>       

            <BaseCanvas
          cursor={"none"}
          ref={(drawingCanvas) => (this.drawingCanvas = drawingCanvas)}
          name="drawingCanvas"
          scaleAndPan={this.props.scaleAndPan}
          canvasPositionAndSize={this.props.canvasPositionAndSize}
          setCanvasPositionAndSize={this.props.setCanvasPositionAndSize}

        />
        
      
        <BaseCanvas
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          cursor={this.getCursor()}
          ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
          name="paintbrush"
          scaleAndPan={this.props.scaleAndPan}
          canvasPositionAndSize={this.props.canvasPositionAndSize}
          setCanvasPositionAndSize={this.props.setCanvasPositionAndSize}

/>
      </div>
    );
  }
}
