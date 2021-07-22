import { ReactNode, Component, ReactElement } from "react";

import { BaseCanvas, CanvasProps as BaseProps } from "@/baseCanvas";
import { theme } from "@/components/theme";
import { Annotations } from "@/annotation";
import { canvasToImage, imageToCanvas } from "@/components/transforms";
import { XYPoint } from "@/annotation/interfaces";
import { Tool, Tools } from "@/components/tools";
import { tooltips } from "@/components/tooltips";
import { Mode } from "@/ui";

import { getRGBAString, palette } from "@/components/palette";
import { BoundingBoxCoordinates } from "./interfaces";

interface Props extends BaseProps {
  activeTool: string;
  mode: Mode;
  annotationsObject: Annotations;
  redraw: number;
  sliceIndex: number;
  setUIActiveAnnotationID: (id: number) => void;
  setActiveTool: (tool: Tool) => void;
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
// We should maybe namespace them so we don't get conflicting methods across toolboxes.
export const events = ["deleteSelectedPoint", "deselectPoint"] as const;

const mainColor = theme.palette.primary.main;
const secondaryColor = theme.palette.secondary.main;

interface Event extends CustomEvent {
  type: typeof events[number];
}

type Cursor = "crosshair" | "pointer" | "none" | "not-allowed";

export class CanvasClass extends Component<Props> {
  readonly name = tooltips.boundingBox.name;

  private baseCanvas: BaseCanvas;

  private selectedCorner: "none" | "topLeft" | "bottomRight";

  private isMouseDown: boolean;

  constructor(props: Props) {
    super(props);
    this.selectedCorner = "none";
    this.isMouseDown = false;
  }

  componentDidMount(): void {
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
  }

  componentDidUpdate(): void {
    // Redraw if we change pan or zoom
    const boundingBox =
      this.props.annotationsObject.getBoundingBoxForActiveAnnotation();

    if (boundingBox?.coordinates) {
      this.drawAllBoundingBoxes();
    }
  }

  componentWillUnmount(): void {
    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

  handleEvent = (event: Event): void => {
    if ((event.detail as string).includes(this.name)) {
      this[event.type]?.call(this);
    }
  };

  drawBoundingBox = (
    boundingBoxCoordinates: BoundingBoxCoordinates,
    isActive = false,
    color: string
  ): void => {
    // ignore unfinished boxes
    if (!this.isComplete(boundingBoxCoordinates)) return;

    // get canvas context for drawing
    const { canvasContext: context } = this.baseCanvas;

    // if active use a thicker line
    const lineWidth = isActive ? 2 : 1;
    if (isActive) {
      // if active highlight with mainColor
      context.strokeStyle = mainColor;
    } else {
      context.strokeStyle = color;
    }

    let { topLeft, bottomRight } = boundingBoxCoordinates;

    // convert tp canvas coordinate space
    topLeft = imageToCanvas(
      topLeft.x,
      topLeft.y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );
    bottomRight = imageToCanvas(
      bottomRight.x,
      bottomRight.y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    // draw rect and stroke
    context.lineWidth = lineWidth;
    context.beginPath();
    //   context.moveTo(topLeft.x, topLeft.y);
    context.rect(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y
    ); // draw rectangle
    context.stroke();
  };

  drawAllBoundingBoxes = (): void => {
    // Draw all the bounding boxes
    if (!this.baseCanvas) return;

    // Clear all the bounding boxes:
    const { canvasContext: context } = this.baseCanvas;
    const activeAnnotationID =
      this.props.annotationsObject.getActiveAnnotationID();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Draw all the bounding boxes:
    this.props.annotationsObject
      .getAllBoundingBoxes(this.props.sliceIndex)
      .forEach(([boundingBox, i]) => {
        this.drawBoundingBox(
          boundingBox.coordinates,
          i === activeAnnotationID,
          getRGBAString(palette[i % palette.length])
        );
      });
  };

  private deselectPoint = () => {
    this.selectedCorner = "none";
    this.drawAllBoundingBoxes();
  };

  deleteSelectedPoint = (): void => {
    if (this.selectedCorner === "none" || !this.sliceIndexMatch()) return;

    const boundingBoxCoordinates =
      this.props.annotationsObject.getBoundingBoxCoordinates();

    boundingBoxCoordinates[this.selectedCorner] = { x: null, y: null };

    this.props.annotationsObject.updateBoundingBoxCoordinates(
      boundingBoxCoordinates
    );

    this.selectedCorner = "none";
    this.drawAllBoundingBoxes();
  };

  clickNearCorner = (
    clickPoint: XYPoint,
    boundingBoxCoordinates: BoundingBoxCoordinates
  ): number => {
    // iterates through the corners of boundingBox, returns the index of the first point within distance 25 of clickPoint
    // clickPoint and boundingBoxCoordinates are both expected to be in image space
    // returns -1 if no point was within distance 25

    // get the four corners (plus an extra corner to close the loop)
    const { topLeft, bottomRight } = boundingBoxCoordinates;
    const topRight: XYPoint = { x: topLeft?.x, y: bottomRight?.y };
    const bottomLeft: XYPoint = { x: bottomRight?.x, y: topLeft?.y };
    const corners: XYPoint[] = [
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
      topLeft,
    ];

    return this.clickNearPoint(clickPoint, corners);
  };

  clickNearPoint = (clickPoint: XYPoint, cornersVector: XYPoint[]): number => {
    // iterates through the points of cornersVector, returns the index of the first point within distance 25 of clickPoint
    // clickPoint and cornersVector are both expected to be in image space
    // returns -1 if no point was within distance 25

    const { x: clickPointX, y: clickPointY } = imageToCanvas(
      clickPoint.x,
      clickPoint.y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    for (let i = 0; i < cornersVector.length; i += 1) {
      // transform points into canvas space so the nudge radius won't depend on zoom level:
      let point = cornersVector[i];
      point = imageToCanvas(
        point?.x,
        point?.y,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.props.canvasPositionAndSize
      );

      const distanceToPoint = Math.sqrt(
        (point?.x - clickPointX) ** 2 + (point?.y - clickPointY) ** 2
      );

      if (distanceToPoint < 25) return i;
    }

    return -1;
  };

  orderCoordinates = (
    point1: XYPoint,
    point2: XYPoint
  ): BoundingBoxCoordinates => {
    // assume first point is TL and second is BR then swap if needed
    const topLeft: XYPoint = point1;
    const bottomRight: XYPoint = point2;
    if (bottomRight.x < topLeft.x) {
      // bottomRight is more left than topLeft!
      const temp = topLeft.x;
      topLeft.x = bottomRight.x;
      bottomRight.x = temp;
      //   assert(topLeft.x < bottomRight.x)
    }
    if (bottomRight.y < topLeft.y) {
      // bottomRight is more top than topLeft!
      const temp = topLeft.y;
      topLeft.y = bottomRight.y;
      bottomRight.y = temp;
      //   assert(topLeft.y < bottomRight.y)
    }
    return { topLeft, bottomRight };
  };

  onClick = (x: number, y: number): void => {
    // handle click to select an annotation (Mode.select)
    // or add new point to a normal spline (Mode.draw and this.props.activeTool === tooltips.boundingBox.name)
    // or add TL or BR point to a rectangle spline (Mode.draw and this.props.activeTool === tooltips.rectspline.name)

    // X and Y are in CanvasSpace, convert to ImageSpace
    const { x: imageX, y: imageY } = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    if (this.props.mode === Mode.select) {
      console.log("select mode");
      // In select mode a single click allows to select a different spline annotation
      const selectedSpline = this.props.annotationsObject.clickNearSpline(
        imageX,
        imageY,
        this.props.sliceIndex
      );
      const selectedBrushStroke =
        this.props.annotationsObject.clickNearBrushStroke(
          imageX,
          imageY,
          this.props.sliceIndex
        );

      if (
        selectedSpline !== null &&
        selectedSpline !== this.props.annotationsObject.getActiveAnnotationID()
      ) {
        this.props.annotationsObject.setActiveAnnotationID(selectedSpline);
        this.props.setUIActiveAnnotationID(selectedSpline);
        this.props.setActiveTool(Tools.spline);
      } else if (selectedBrushStroke !== null) {
        this.props.annotationsObject.setActiveAnnotationID(selectedBrushStroke);
        this.props.setUIActiveAnnotationID(selectedBrushStroke);
        this.props.setActiveTool(Tools.paintbrush);
      }
    }

    // if no bounding box tool is turned on then do nothing
    console.log(this.isActive());
    if (!this.isActive()) return;
    console.log(this.isActive());

    if (this.sliceIndexMatch()) {
      // if our current spline annotation object is for the visible slice
      // get the current spline coordinates
      let boundingBoxCoordinates =
        this.props.annotationsObject.getBoundingBoxCoordinates();

      // check if the current bounding box is a complete one
      const isComplete = this.isComplete(boundingBoxCoordinates);

      // check if we clicked within the nudge radius of an existing point
      const nudgePointIdx = this.clickNearCorner(
        { x: imageX, y: imageY },
        boundingBoxCoordinates
      );

      if (nudgePointIdx !== -1) {
        // If the mouse click was near an existing point, nudge that point
        // TODO we want to deal with this so we can nudge the 'bottom left corner'
        // which actually doesnt exist but is a powerful feature to add
        console.log("nudging bounding boxes is not yet implemented");
      } else if (this.props.mode === Mode.draw && !isComplete) {
        // else, i.e. not near an existing point
        // if the rectangle is not complete and we are in Mode.draw then
        // add a corner to the current bounding box
        // if a rectangular spline, we only want to add a TL and BR point
        console.log("no corners");
        const { topLeft, bottomRight } = boundingBoxCoordinates;
        if (
          (topLeft?.x === null || topLeft?.y === null) &&
          (bottomRight?.x === null || bottomRight?.y === null)
        ) {
          // no corners defined to assume this is the topLeft
          boundingBoxCoordinates.topLeft = { x: imageX, y: imageY };
          this.props.annotationsObject.updateBoundingBoxCoordinates({
            topLeft: { x: imageX, y: imageY },
            bottomRight: { x: null, y: null },
          });
          boundingBoxCoordinates =
            this.props.annotationsObject.getBoundingBoxCoordinates();
          this.selectedCorner = "topLeft";
        } else if (
          (topLeft?.x !== null || topLeft?.y !== null) &&
          (bottomRight?.x === null || bottomRight?.y === null)
        ) {
          // one point defined as topLeft
          // but check which should actually be TL and which should be BR
          console.log("tl corner exists");
          boundingBoxCoordinates = this.orderCoordinates(
            boundingBoxCoordinates.topLeft,
            {
              x: imageX,
              y: imageY,
            }
          );
          this.props.annotationsObject.updateBoundingBoxCoordinates(
            boundingBoxCoordinates
          );
          this.selectedCorner = "bottomRight";
        } else if (
          (topLeft?.x === null || topLeft?.y === null) &&
          (bottomRight?.x !== null || bottomRight?.y !== null)
        ) {
          // unusually we have one point defined as bottomRight
          // but check which should actually be TL and which should be BR
          console.log("br corner exists");
          boundingBoxCoordinates = this.orderCoordinates(
            boundingBoxCoordinates.bottomRight,
            {
              x: imageX,
              y: imageY,
            }
          );
          this.props.annotationsObject.updateBoundingBoxCoordinates(
            boundingBoxCoordinates
          );
          this.selectedCorner = "topLeft";
        } else if (isComplete) {
          console.log(
            "Not adding your point because this rectangle is complete."
          );
        } else {
          // otherwise spit an error
          console.log("Not really sure why but I can't add to this rectangle.");
        }
      }
    }

    this.drawAllBoundingBoxes();
  };

  onMouseDown = (x: number, y: number): void => {
    if (!this.sliceIndexMatch()) return;

    const boundingBoxCoordinates =
      this.props.annotationsObject.getBoundingBoxCoordinates();

    const clickPoint = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    const nearPoint = this.clickNearCorner(clickPoint, boundingBoxCoordinates);
    if (nearPoint !== -1) {
      // If the mouse click was near an existing point, drag that point
      // TODO we want to deal with this so we can drag the 'bottom left corner'
      // which actually doesnt exist but is a powerful feature to add
      console.log("dragging bounding boxes is not yet implemented");
      // question: how to deal with highlighting the 'virtual corners'
      // e.g. this.selectedCorner = "bottomLeft"
      this.isMouseDown = true;
    }

    this.drawAllBoundingBoxes();
  };

  onMouseMove = (x: number, y: number): void => {
    if (!this.isMouseDown) return;

    // Replace update the coordinates for the point dragged
    const clickPoint = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    const boundingBoxCoordinates =
      this.props.annotationsObject.getBoundingBoxCoordinates();

    if (
      this.selectedCorner !== "none" &&
      this.isComplete(boundingBoxCoordinates)
    ) {
      // If the mouse drag was near an existing point, drag that point
      // TODO we want to deal with this so we can drag the 'bottom left corner'
      // which actually doesnt exist but is a powerful feature to add
      console.log("dragging bounding boxes is not yet implemented");
      // question: how to deal with highlighting the 'virtual corners'
      // e.g. this.selectedCorner = "bottomLeft"
    }

    // Redraw all the splines
    this.drawAllBoundingBoxes();
  };

  onMouseUp = (): void => {
    // Works as part of drag and drop for points.
    this.isMouseDown = false;
  };

  isComplete = (boundingBoxCoordinates: BoundingBoxCoordinates): boolean =>
    // Check whether the bounding box has both corners
    boundingBoxCoordinates.topLeft !== null &&
    boundingBoxCoordinates.topLeft?.x !== null &&
    boundingBoxCoordinates.topLeft?.y !== null &&
    boundingBoxCoordinates.bottomRight !== null &&
    boundingBoxCoordinates.bottomRight?.x !== null &&
    boundingBoxCoordinates.bottomRight?.y !== null;

  getCursor = (): Cursor => {
    if (!this.isActive()) return "none";
    return this.props.mode === Mode.draw ? "crosshair" : "pointer";
  };

  // TODO make this fit with tooltips so we don't have tools and tooltips and strings all over the place
  isActive = (): boolean => this.props.activeTool === "boundingBox";

  sliceIndexMatch = (): boolean =>
    this.props.annotationsObject.getSplineForActiveAnnotation().spaceTimeInfo
      .z === this.props.sliceIndex;

  render = (): ReactNode =>
    this.props?.displayedImage ? (
      <div style={{ pointerEvents: this.isActive() ? "auto" : "none" }}>
        <BaseCanvas
          onClick={this.onClick}
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          cursor={this.getCursor()}
          ref={(baseCanvas) => {
            this.baseCanvas = baseCanvas;
          }}
          name={tooltips.boundingBox.name}
          scaleAndPan={this.props.scaleAndPan}
          canvasPositionAndSize={this.props.canvasPositionAndSize}
          setCanvasPositionAndSize={this.props.setCanvasPositionAndSize}
        />
      </div>
    ) : null;
}

export const Canvas = (props: Props): ReactElement => (
  <CanvasClass
    activeTool={props.activeTool}
    mode={props.mode}
    annotationsObject={props.annotationsObject}
    displayedImage={props.displayedImage}
    scaleAndPan={props.scaleAndPan}
    canvasPositionAndSize={props.canvasPositionAndSize}
    redraw={props.redraw}
    sliceIndex={props.sliceIndex}
    setUIActiveAnnotationID={props.setUIActiveAnnotationID}
    setActiveTool={props.setActiveTool}
  />
);
