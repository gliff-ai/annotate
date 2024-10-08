import { ReactNode, PureComponent, ReactElement, forwardRef } from "react";
import { theme } from "@gliff-ai/style";
import { Mode } from "@/ui";
import { Toolboxes, Toolbox } from "@/Toolboxes";
import { Annotations } from "@/annotation";
import { XYPoint, PositionAndSize } from "@/annotation/interfaces";
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

interface Props extends Omit<CanvasProps, "canvasPositionAndSize"> {
  activeToolbox: Toolbox;
  mode: Mode;
  setMode: (mode: Mode) => void;
  annotationsObject: Annotations;
  // eslint-disable-next-line react/no-unused-prop-types
  redraw: number;
  sliceIndex: number;
  setUIActiveAnnotationID: (id: number) => void;
  setActiveToolbox: (tool: Toolbox) => void;
  readonly: boolean;
}

interface State {
  canvasPositionAndSize: PositionAndSize;
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

export class CanvasClass extends PureComponent<Props, State> {
  readonly name = Toolboxes.boundingBox;

  public baseCanvas: BaseCanvas; // public because CanvasStack needs to access it to create the diff image in comparison mode

  private selectedCorner: SelectedCorners;

  private isMouseDown: boolean;

  private dragCoords: BoundingBoxCoordinates; // holds the box's transient state as we drag a corner, since it's not committed to annotationsObject until we release

  constructor(props: Props) {
    super(props);
    this.selectedCorner = "none";
    this.isMouseDown = false;
    this.state = {
      canvasPositionAndSize: { top: 0, left: 0, width: 0, height: 0 },
    };
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

    // set the line colour
    // based on active colour or the annotation object's set colour
    context.strokeStyle = isActive ? mainColor : color;

    // squares should be 6 pixels wide and the gliff.ai secondary colour (purple)
    context.fillStyle = secondaryColor;
    const pointSize = 6;

    if (!this.isComplete(boundingBoxCoordinates)) {
      // for unfinished boxes just draw a TL _or_ BR corner

      // get coordinates
      const { topLeft, bottomRight } = boundingBoxCoordinates;
      let x: number;
      let y: number;
      if (topLeft?.x !== null && topLeft?.y !== null) {
        // we have just one point in the top left so draw it
        ({ x, y } = topLeft);
      } else if (bottomRight?.x !== null && bottomRight?.y !== null) {
        // we have just one point in the bottom right so draw it
        ({ x, y } = bottomRight);
      }

      // convert image coordinates to canvas coordinates
      ({ x, y } = imageToCanvas(
        x,
        y,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.state.canvasPositionAndSize
      ));

      // draw just a filled square to mark the corner point as selected
      context.beginPath();
      context.fillRect(
        x - pointSize / 2,
        y - pointSize / 2,
        pointSize,
        pointSize
      );
    } else {
      // the bounding box is complete so get all four corners and draw it
      let topLeft;
      let bottomRight;
      if (this.isMouseDown && this.selectedCorner !== "none" && isActive) {
        // if we're mid drag and drop then use the unsaved dragCoords
        ({ topLeft, bottomRight } = this.dragCoords);
      } else {
        // else if we've finished dragging use the saved annotation cords
        ({ topLeft, bottomRight } = boundingBoxCoordinates);
      }
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
          this.state.canvasPositionAndSize
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
    }
  };

  drawAllBoundingBoxes = (): void => {
    // draw all the bounding boxes

    // if we have no canvas, we can't draw
    if (!this.baseCanvas) return;

    // clear all the bounding boxes currently drawn
    const { canvasContext: context } = this.baseCanvas;
    const activeAnnotationID =
      this.props.annotationsObject.getActiveAnnotationID();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // draw all the bounding boxes afresh
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
      this.state.canvasPositionAndSize
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
        this.state.canvasPositionAndSize
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

  addPoint = (imageX: number, imageY: number): void => {
    if (this.sliceIndexMatch()) {
      // if our current spline annotation object is for the visible slice
      // get the current spline coordinates
      let boundingBoxCoordinates =
        this.props.annotationsObject.getBoundingBoxCoordinates();

      // check if the current bounding box is a complete one
      const isComplete = this.isComplete(boundingBoxCoordinates);

      if (this.props.mode === Mode.draw && !isComplete) {
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
        } else {
          // Not really sure why but I can't add to this rectangle.
        }
      }
    }
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
      this.state.canvasPositionAndSize
    );

    if (this.props.mode === Mode.select) {
      // In select mode a single click allows to select a different annotation
      const selectedAnnotationID = this.props.annotationsObject.clickSelect(
        imageX,
        imageY,
        this.props.sliceIndex,
        this.props.setUIActiveAnnotationID,
        this.props.setActiveToolbox
      );

      if (selectedAnnotationID !== null) {
        this.props.setMode(Mode.draw);
      }
    }

    if (this.props.readonly) {
      this.drawAllBoundingBoxes();
      return;
    }

    // if no bounding box tool is turned on then do nothing
    if (!this.isActive()) return;

    // if bounding box tool is turned on then add a point to the bounding box
    this.addPoint(imageX, imageY);

    // redraw the canvas
    this.drawAllBoundingBoxes();
  };

  onMouseDownOrTouchStart = (x: number, y: number): void => {
    // if no bounding box tool is turned on then do nothing
    if (!this.isActive() || this.props.readonly) return;

    // if existing annotation is on a different slice, do nothing
    if (!this.sliceIndexMatch()) return;

    const clickPoint = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.state.canvasPositionAndSize
    );
    const { x: imageX, y: imageY } = clickPoint;

    // get any existing corners and check whether we are near them
    const boundingBoxCoordinates =
      this.props.annotationsObject.getBoundingBoxCoordinates();
    const nearPoint = this.clickNearCorner(clickPoint, boundingBoxCoordinates);

    if (nearPoint !== "none") {
      // if the mouse click was near an existing point, drag that point
      this.selectedCorner = nearPoint;
      this.dragCoords = boundingBoxCoordinates;
    } else if (
      boundingBoxCoordinates.topLeft?.x === null &&
      boundingBoxCoordinates.topLeft?.y === null
    ) {
      // if there is no topLeft point then create one
      // and go into drag and drop mode for creating the whole box
      this.addPoint(imageX, imageY);
      this.selectedCorner = "bottomRight";
      this.dragCoords = boundingBoxCoordinates;
    } else if (
      boundingBoxCoordinates.bottomRight?.x === null &&
      boundingBoxCoordinates.bottomRight?.y === null
    ) {
      // if there is a topLeft point but no bottom right
      // then go into drag and drop mode for creating the whole box
      this.selectedCorner = "bottomRight";
      this.dragCoords = boundingBoxCoordinates;
    } else {
      // should never get here
      return;
    }

    // always set the mouse as down, this is undone by mouse up
    this.isMouseDown = true;

    // draw bounding boxes to visually update selected corner
    this.drawAllBoundingBoxes();
  };

  onMouseMoveOrTouchMove = (x: number, y: number): void => {
    // if no bounding box tool is turned on then do nothing
    if (!this.isActive() || this.props.readonly) return;

    // if no mouse is down then do nothing
    if (!this.isMouseDown) return;

    // Update the coordinates for the new point we've dragged too
    const { x: imageX, y: imageY } = canvasToImage(
      x,
      y,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.state.canvasPositionAndSize
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
            { x: imageX, y: imageY } // prevents us overwriting the original click point
          );
          break;
        case "topRight":
          boundingBoxCoordinates = this.orderCoordinates(
            {
              x: boundingBoxCoordinates.bottomRight.x,
              y: boundingBoxCoordinates.topLeft.y,
            },
            { x: imageX, y: imageY } // prevents us overwriting the original click point
          );
          break;
        case "bottomRight":
          boundingBoxCoordinates = this.orderCoordinates(
            {
              x: boundingBoxCoordinates.topLeft.x,
              y: boundingBoxCoordinates.topLeft.y,
            },
            { x: imageX, y: imageY } // prevents us overwriting the original click point
          );
          break;
        case "bottomLeft":
          boundingBoxCoordinates = this.orderCoordinates(
            {
              x: boundingBoxCoordinates.topLeft.x,
              y: boundingBoxCoordinates.bottomRight.y,
            },
            { x: imageX, y: imageY } // prevents us overwriting the original click point
          );
          break;
        default:
          break;
      }
      this.dragCoords = boundingBoxCoordinates;
    } else {
      // if the mouse drag was not near an existing point
      // add a second point to "drag" a box creation
      this.addPoint(imageX, imageY);
    }

    // redraw all the splines
    this.drawAllBoundingBoxes();
  };

  onMouseUpOrTouchEnd = (): void => {
    if (this.props.readonly) return;

    // the following two bits of logic are needed for drag and drop

    // if updating an existing corner, update the annotation
    if (this.isMouseDown && this.dragCoords !== null) {
      this.props.annotationsObject.updateBoundingBoxCoordinates(
        this.dragCoords
      );
    }

    // always reset isMouseDown
    // otherwise we can accidentally get infinite drag and drop
    this.isMouseDown = false;

    // redraw all the splines
    this.drawAllBoundingBoxes();
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

  setCanvasPositionAndSize = (
    newCanvasPositionAndSize: PositionAndSize
  ): void => {
    this.setState((prevState: State) => {
      const { canvasPositionAndSize } = prevState;
      return {
        canvasPositionAndSize: {
          top: newCanvasPositionAndSize.top || canvasPositionAndSize.top,
          left: newCanvasPositionAndSize.left || canvasPositionAndSize.left,
          width: newCanvasPositionAndSize.width || canvasPositionAndSize.width,
          height:
            newCanvasPositionAndSize.height || canvasPositionAndSize.height,
        },
      };
    });
  };

  render = (): ReactNode =>
    this.props?.displayedImage ? (
      <div style={{ pointerEvents: this.isActive() ? "auto" : "none" }}>
        <BaseCanvas
          onClick={this.onClick}
          onMouseDown={this.onMouseDownOrTouchStart}
          onTouchStart={this.onMouseDownOrTouchStart}
          onMouseMove={this.onMouseMoveOrTouchMove}
          onTouchMove={this.onMouseMoveOrTouchMove}
          onMouseUp={this.onMouseUpOrTouchEnd}
          onTouchEnd={this.onMouseUpOrTouchEnd}
          cursor={this.getCursor()}
          ref={(baseCanvas) => {
            this.baseCanvas = baseCanvas;
          }}
          name={this.name}
          scaleAndPan={this.props.scaleAndPan}
          setScaleAndPan={this.props.setScaleAndPan}
          displayedImage={this.props.displayedImage}
          canvasPositionAndSize={this.state.canvasPositionAndSize}
          setCanvasPositionAndSize={this.setCanvasPositionAndSize}
        />
      </div>
    ) : null;
}

const CanvasFunction = (
  props: Props,
  ref: React.ForwardedRef<CanvasClass>
): ReactElement => (
  <CanvasClass
    activeToolbox={props.activeToolbox}
    mode={props.mode}
    setMode={props.setMode}
    annotationsObject={props.annotationsObject}
    displayedImage={props.displayedImage}
    scaleAndPan={props.scaleAndPan}
    setScaleAndPan={props.setScaleAndPan}
    redraw={props.redraw}
    sliceIndex={props.sliceIndex}
    setUIActiveAnnotationID={props.setUIActiveAnnotationID}
    setActiveToolbox={props.setActiveToolbox}
    readonly={props.readonly}
    ref={ref}
  />
);

export const Canvas = forwardRef(CanvasFunction);
