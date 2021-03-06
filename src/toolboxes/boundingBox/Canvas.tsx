import { ReactNode, Component, ReactElement } from "react";
import { theme } from "@gliff-ai/style";
import { Mode } from "@/ui";
import { Toolboxes, Toolbox } from "@/Toolboxes";
import { Annotations } from "@/annotation";
import { XYPoint } from "@/annotation/interfaces";
import {
  BaseCanvas,
  CanvasProps,
  canvasToImage,
  imageToCanvas,
} from "@/components/baseCanvas";
import { getRGBAString, palette } from "@/components/palette";
import { BoundingBoxCoordinates } from "./interfaces";

enum Corners {
  "topLeft",
  "topRight",
  "bottomRight",
  "bottomLeft",
}

type SelectedCorners =
  | "none"
  | "topLeft"
  | "topRight"
  | "bottomRight"
  | "bottomLeft";

interface Props extends CanvasProps {
  activeToolbox: Toolbox;
  mode: Mode;
  annotationsObject: Annotations;
  redraw: number;
  sliceIndex: number;
  setUIActiveAnnotationID: (id: number) => void;
  setActiveToolbox: (tool: Toolbox) => void;
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
// We should maybe namespace them so we don't get conflicting methods across toolboxes.
export const events = ["deleteSelectedCorner", "deselectCorner"] as const;

const mainColor = theme.palette.primary.main;
const secondaryColor = theme.palette.secondary.main;

interface Event extends CustomEvent {
  type: typeof events[number];
}

type Cursor = "crosshair" | "pointer" | "none" | "not-allowed";

export class CanvasClass extends Component<Props> {
  readonly name = Toolboxes.boundingBox;

  private baseCanvas: BaseCanvas;

  private selectedCorner: SelectedCorners;

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
    // get canvas context for drawing
    const { canvasContext: context } = this.baseCanvas;

    // if active use a thicker line
    const lineWidth = isActive ? 2 : 1;
    context.lineWidth = lineWidth;
    if (isActive) {
      // if active highlight with mainColor
      context.strokeStyle = mainColor;
    } else {
      context.strokeStyle = color;
    }
    context.fillStyle = secondaryColor;
    const pointSize = 6;

    if (!this.isComplete(boundingBoxCoordinates)) {
      const { topLeft, bottomRight } = boundingBoxCoordinates;
      let x: number;
      let y: number;
      // for unfinished boxes just draw a TL or BR corner
      if (topLeft?.x !== null && topLeft?.y !== null) {
        // we have just one point in the top left so draw it
        ({ x, y } = topLeft);
      } else if (bottomRight?.x !== null && bottomRight?.y !== null) {
        // we have just one point in the bottom right so draw it
        ({ x, y } = bottomRight);
      }
      ({ x, y } = imageToCanvas(
        x,
        y,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.props.canvasPositionAndSize
      ));
      context.beginPath();
      context.fillRect(
        x - pointSize / 2,
        y - pointSize / 2,
        pointSize,
        pointSize
      ); // draw a filled square to mark the point as selected
      return;
    }

    // get the four corners
    const { topLeft, bottomRight } = boundingBoxCoordinates;
    const topRight: XYPoint = { x: topLeft?.x, y: bottomRight?.y };
    const bottomLeft: XYPoint = { x: bottomRight?.x, y: topLeft?.y };
    const corners: XYPoint[] = [topLeft, topRight, bottomRight, bottomLeft];

    // convert to canvas coordinate space
    for (let i = 0; i < 4; i += 1) {
      corners[i] = imageToCanvas(
        corners[i].x,
        corners[i].y,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.props.canvasPositionAndSize
      );
    }

    // draw bounding box
    context.beginPath();
    context.rect(
      corners[0].x,
      corners[0].y,
      corners[2].x - corners[0].x,
      corners[2].y - corners[0].y
    );
    context.stroke();

    // draw the corners
    context.beginPath();
    for (let i = 0; i < 4; i += 1) {
      if (this.selectedCorner === Corners[i] && isActive) {
        context.fillRect(
          corners[i].x - pointSize / 2,
          corners[i].y - pointSize / 2,
          pointSize,
          pointSize
        ); // draw a filled square to mark the point as selected
      } else {
        context.rect(
          corners[i].x - pointSize / 2,
          corners[i].y - pointSize / 2,
          pointSize,
          pointSize
        ); // draw a square to mark the point
        context.stroke();
      }
    }
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

  private deselectCorner = () => {
    this.selectedCorner = "none";
    this.drawAllBoundingBoxes();
  };

  deleteSelectedCorner = (): void => {
    if (this.selectedCorner === "none" || !this.sliceIndexMatch()) return;

    const boundingBoxCoordinates =
      this.props.annotationsObject.getBoundingBoxCoordinates();

    switch (this.selectedCorner) {
      case "topLeft":
        boundingBoxCoordinates.topLeft = { x: null, y: null };
        break;
      case "bottomRight":
        boundingBoxCoordinates.bottomRight = { x: null, y: null };
        break;
      default:
        break;
    }

    this.props.annotationsObject.updateBoundingBoxCoordinates(
      boundingBoxCoordinates
    );

    this.selectedCorner = "none";
    this.drawAllBoundingBoxes();
  };

  clickNearCorner = (
    clickPoint: XYPoint,
    boundingBoxCoordinates: BoundingBoxCoordinates
  ): SelectedCorners => {
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

    switch (this.clickNearPoint(clickPoint, corners)) {
      case 0:
        return "topLeft";
      case 1:
        return "topRight";
      case 2:
        return "bottomRight";
      case 3:
        return "bottomLeft";
      case 4:
        return "topLeft";
      default:
        return "none";
    }
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
    // or add new point to a normal spline (Mode.draw and this.props.activeToolbox === Tools.boundingBox.name)
    // or add TL or BR point to a rectangle spline (Mode.draw and this.props.activeToolbox === Tools.rectspline.name)

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
      // In select mode a single click allows to select a different spline annotation
      // DEVNOTE this is currently duplicated in each toolbox!
      const selectedBoundingBox =
        this.props.annotationsObject.clickNearBoundingBox(
          imageX,
          imageY,
          this.props.sliceIndex
        );
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
        selectedBoundingBox !== null &&
        selectedBoundingBox !==
          this.props.annotationsObject.getActiveAnnotationID()
      ) {
        this.props.annotationsObject.setActiveAnnotationID(selectedBoundingBox);
        this.props.setUIActiveAnnotationID(selectedBoundingBox);
        this.props.setActiveToolbox(Toolboxes.boundingBox);
      } else if (selectedSpline !== null) {
        this.props.annotationsObject.setActiveAnnotationID(selectedSpline);
        this.props.setUIActiveAnnotationID(selectedSpline);
        this.props.setActiveToolbox(Toolboxes.spline);
      } else if (selectedBrushStroke !== null) {
        this.props.annotationsObject.setActiveAnnotationID(selectedBrushStroke);
        this.props.setUIActiveAnnotationID(selectedBrushStroke);
        this.props.setActiveToolbox(Toolboxes.paintbrush);
      }
    }

    // if no bounding box tool is turned on then do nothing
    if (!this.isActive()) return;

    if (this.sliceIndexMatch()) {
      // if our current spline annotation object is for the visible slice
      // get the current spline coordinates
      let boundingBoxCoordinates =
        this.props.annotationsObject.getBoundingBoxCoordinates();

      // check if the current bounding box is a complete one
      const isComplete = this.isComplete(boundingBoxCoordinates);

      if (this.props.mode === Mode.draw && !isComplete) {
        // else, i.e. not near an existing point
        // if the rectangle is not complete and we are in Mode.draw then
        // add a corner to the current bounding box
        // if a rectangular spline, we only want to add a TL and BR point
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
          this.selectedCorner = "topLeft";
        } else if (
          (topLeft?.x !== null || topLeft?.y !== null) &&
          (bottomRight?.x === null || bottomRight?.y === null)
        ) {
          // one point defined as topLeft
          // but check which should actually be TL and which should be BR
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
          // Not adding your point because this rectangle is complete.
          return;
        } else {
          // Not really sure why but I can't add to this rectangle.
          return;
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

    if (nearPoint !== "none") {
      // If the mouse click was near an existing point, drag that point
      // TODO we want to deal with this so we can drag the 'bottom left corner'
      // which actually doesnt exist but is a powerful feature to add
      this.selectedCorner = nearPoint;
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

    let boundingBoxCoordinates =
      this.props.annotationsObject.getBoundingBoxCoordinates();

    if (
      this.selectedCorner !== "none" &&
      this.isComplete(boundingBoxCoordinates)
    ) {
      // If the mouse drag was near an existing point, drag that point
      switch (this.selectedCorner) {
        case "topLeft":
          boundingBoxCoordinates = this.orderCoordinates(
            {
              x: boundingBoxCoordinates.bottomRight.x,
              y: boundingBoxCoordinates.bottomRight.y,
            },
            { x: clickPoint.x, y: clickPoint.y } // prevents us overwriting the original click point
          );
          this.props.annotationsObject.updateBoundingBoxCoordinates(
            boundingBoxCoordinates
          );
          break;
        case "topRight":
          boundingBoxCoordinates = this.orderCoordinates(
            {
              x: boundingBoxCoordinates.bottomRight.x,
              y: boundingBoxCoordinates.topLeft.y,
            },
            { x: clickPoint.x, y: clickPoint.y } // prevents us overwriting the original click point
          );
          this.props.annotationsObject.updateBoundingBoxCoordinates(
            boundingBoxCoordinates
          );
          break;
        case "bottomRight":
          boundingBoxCoordinates = this.orderCoordinates(
            {
              x: boundingBoxCoordinates.topLeft.x,
              y: boundingBoxCoordinates.topLeft.y,
            },
            { x: clickPoint.x, y: clickPoint.y } // prevents us overwriting the original click point
          );
          this.props.annotationsObject.updateBoundingBoxCoordinates(
            boundingBoxCoordinates
          );
          break;
        case "bottomLeft":
          boundingBoxCoordinates = this.orderCoordinates(
            {
              x: boundingBoxCoordinates.topLeft.x,
              y: boundingBoxCoordinates.bottomRight.y,
            },
            { x: clickPoint.x, y: clickPoint.y } // prevents us overwriting the original click point
          );
          this.props.annotationsObject.updateBoundingBoxCoordinates(
            boundingBoxCoordinates
          );
          break;
        default:
          break;
      }
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

  isActive = (): boolean => this.props.activeToolbox === Toolboxes.boundingBox;

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
          name={this.name}
          scaleAndPan={this.props.scaleAndPan}
          canvasPositionAndSize={this.props.canvasPositionAndSize}
          setCanvasPositionAndSize={this.props.setCanvasPositionAndSize}
        />
      </div>
    ) : null;
}

export const Canvas = (props: Props): ReactElement => (
  <CanvasClass
    activeToolbox={props.activeToolbox}
    mode={props.mode}
    annotationsObject={props.annotationsObject}
    displayedImage={props.displayedImage}
    scaleAndPan={props.scaleAndPan}
    canvasPositionAndSize={props.canvasPositionAndSize}
    redraw={props.redraw}
    sliceIndex={props.sliceIndex}
    setUIActiveAnnotationID={props.setUIActiveAnnotationID}
    setActiveToolbox={props.setActiveToolbox}
  />
);
