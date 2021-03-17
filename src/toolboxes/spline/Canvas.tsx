import React from "react";
import { Component } from "react";

// import { SplineVector } from "./interfaces";
import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";
import { Annotations } from "../../annotation";
import { canvasToImage, imageToCanvas, imageToOriginalCanvas } from "../../baseCanvas";
import { Annotation, XYPoint } from "../../annotation/interfaces";

interface Props extends BaseProps {
  isActive: boolean;
  annotationsObject: Annotations;
  imageWidth: number;
  imageHeight: number;
}

export class SplineCanvas extends Component<Props> {
  private baseCanvas: any;
  private selectedPointIndex: number; 
  state: {
    cursor: "crosshair" | "none";
  };

  constructor(props: Props) {
    super(props);
    this.selectedPointIndex = -1;
  }

  drawSplineVector = (splineVector: XYPoint[], isActive=false) => {
    if (splineVector.length < 2) return;

    const { canvasContext: context, canvas } = this.baseCanvas;
    const lineWidth = isActive ? 2: 1;

    // Clear the canvas
    context.lineWidth = lineWidth;
    context.strokeStyle = "#ff0000";

    context.beginPath();

    // Go to the first point
    let firstPoint: XYPoint = splineVector[0];
    firstPoint = imageToOriginalCanvas(firstPoint.x, firstPoint.y, this.props.imageWidth, this.props.imageHeight, this.props.scaleAndPan);

    context.moveTo(firstPoint.x, firstPoint.y);

    // Draw each point by taking our raw coordinates and applying the transform so they fit on our canvas
    let nextPoint;
    for (const { x, y } of splineVector) {
      nextPoint = imageToOriginalCanvas(x, y, this.props.imageWidth, this.props.imageHeight, this.props.scaleAndPan);
      context.lineTo(nextPoint.x, nextPoint.y);
    }

    // Draw all points
    for (const { x, y } of splineVector) {
      nextPoint = imageToOriginalCanvas(x, y, this.props.imageWidth, this.props.imageHeight, this.props.scaleAndPan);
      context.rect(nextPoint.x - 2.5, nextPoint.y - 2.5, 5, 5); // draw a square to mark the point
    }

    context.stroke();
  };

  drawAllSplines = (): void => {
    // Draw all the splines 

    // Clear all the splines:
    const { canvasContext: context, canvas } = this.baseCanvas;
    const activeAnnotationID = this.props.annotationsObject.getActiveAnnotationID();
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all the splines:
    this.props.annotationsObject.getData().forEach((annotation: Annotation, i: number) => {
      if (annotation.toolbox === "spline") {
        this.drawSplineVector(annotation.coordinates, i === activeAnnotationID);
      }
    });
  }

  clickNearPoint = (clickPoint: XYPoint, splineVector: XYPoint[]): number => {
    // iterates through the points of splineVector, returns the index of the first point within distance 25 of clickPoint
    // clickPoint and splineVector are both expected to be in image space
    // returns -1 if no point was within distance 25

    let {x:clickPointX, y:clickPointY} = imageToCanvas(clickPoint.x, clickPoint.y, this.props.imageWidth, this.props.imageHeight, this.props.scaleAndPan);

    for (let i=0; i < splineVector.length; i++) {
      // transform points into canvas space so the nudge radius won't depend on zoom level:
      let point = splineVector[i];
      point = imageToCanvas(point.x, point.y, this.props.imageWidth, this.props.imageHeight, this.props.scaleAndPan);
      
      let distanceToPoint = Math.sqrt((point.x - clickPointX)**2 + (point.y - clickPointY)**2);

      if (distanceToPoint < 25) return i;
    };

    return -1;
  }

  // X and Y are in CanvasSpace
  onClick = (x: number, y: number): void => {
    const {
      coordinates: currentSplineVector,
    } = this.props.annotationsObject.getActiveAnnotation();

    let {x:imageX, y:imageY} = canvasToImage(x, y, this.props.imageWidth, this.props.imageHeight, this.props.scaleAndPan);


    // check if we clicked within the nudge radius of an existing point:
    let nudgePointIdx = this.clickNearPoint({x:imageX, y:imageY}, currentSplineVector);
    const isClosed = this.isClosed(currentSplineVector);
    
    if (nudgePointIdx !== -1) {
      let nudgePoint = currentSplineVector[nudgePointIdx];

      this.updateXYPoint((nudgePoint.x + imageX) / 2, (nudgePoint.y + imageY) / 2, nudgePointIdx);

      if (nudgePointIdx === 0 && isClosed) {
        // need to update the final point as well if we're nudging the first point of a closed spline,
        // or else the loop gets broken
        this.updateXYPoint((nudgePoint.x + imageX) / 2, (nudgePoint.y + imageY) / 2, currentSplineVector.length - 1);
      }
      
      // If the spline is not closed, append a new point
    } else if (!isClosed) {

      // Add coordinates to the current spline
      console.log("Adding point", { x: imageX, y: imageY });
      currentSplineVector.push({ x: imageX, y: imageY });
    }
    
    this.drawAllSplines();
  };
  
  updateXYPoint = (newX: number, newY: number, index: number) => {
    const coordinates = this.props.annotationsObject.getActiveAnnotation().coordinates;
    coordinates[index] = {x: newX, y: newY};
  }

  onDoubleClick = (x: number, y: number): void => {
    // Append the first spline point to the end, making a closed polygon

    const currentSplineVector = this.props.annotationsObject.getActiveAnnotation().coordinates;

    if (currentSplineVector.length < 3) {
      return; // need at least three points to make a closed polygon
    }

    if (this.isClosed(currentSplineVector)) {
      return; // don't duplicate the first point again if the loop is already closed
    }

    console.log("Adding point dbclick", currentSplineVector[0]);
    currentSplineVector.push(currentSplineVector[0]);
   

    this.drawAllSplines();
  }

  onMouseDown = (x: number, y: number): void => {
    let clickPoint = canvasToImage(x, y, this.props.imageWidth, this.props.imageHeight, this.props.scaleAndPan);
    let annotationData = this.props.annotationsObject.getActiveAnnotation();
    
    let nearPoint = this.clickNearPoint(clickPoint, annotationData.coordinates);
    if (nearPoint !== -1) {
      this.selectedPointIndex = nearPoint;
    }
  }

  onMouseMove = (x: number, y: number): void => {
    if (this.selectedPointIndex === -1) return;

    // Replace update the coordinates for the point dragged
    let clickPoint = canvasToImage(x, y, this.props.imageWidth, this.props.imageHeight, this.props.scaleAndPan);
    
    // If dragging first point, update also last
    let activeSpline = this.props.annotationsObject.getActiveAnnotation().coordinates;
    console.log(this.selectedPointIndex, this.isClosed(activeSpline))
    if (this.selectedPointIndex === 0 && this.isClosed(activeSpline)) {
      this.updateXYPoint(clickPoint.x, clickPoint.y, activeSpline.length - 1);
    }

    this.updateXYPoint(clickPoint.x, clickPoint.y, this.selectedPointIndex);
    
    // Redraw all the splines
    this.drawAllSplines();
  }

  onMouseUp = (): void => {
    // Works as part of drag and drop for points.
    this.selectedPointIndex = -1;
  }
  
  isClosed = (splineVector: XYPoint[]): boolean => {
    // Check whether the spline is a closed loop.
    return ((splineVector.length > 1 ) && 
    (splineVector[0].x === splineVector[splineVector.length-1].x) && 
    (splineVector[0].y === splineVector[splineVector.length-1].y ) );
  }

  componentDidUpdate(): void {
    // Redraw if we change pan or zoom
    const activeAnnotation = this.props.annotationsObject.getActiveAnnotation();
    if (activeAnnotation?.coordinates) {
      this.drawAllSplines();
    }
  }

  render() {
    return (
      <BaseCanvas
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        cursor={this.props.isActive ? "crosshair" : "none"}
        ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
        name="spline"
        scaleAndPan={this.props.scaleAndPan}
      />
    );
  }
}
