import React, { ReactNode, Component, ReactElement } from "react";

import { BaseCanvas, CanvasProps } from "@/baseCanvas";
import { Annotations } from "@/annotation";
import { canvasToImage, imageToCanvas } from "@/transforms";
import { XYPoint } from "@/annotation/interfaces";
import { theme } from "@/theme";

import { usePaintbrushStore } from "./Store";

interface Props extends CanvasProps {
  brushType: string;
  annotationsObject: Annotations;
  brushRadius: number;
  callRedraw: number;
}

interface Brush {
  radius: number;
  type: "paint" | "erase";
  color: string; // rgb(a) string
}

enum Mode {
  draw,
  select,
}
interface State {
  hideBackCanvas: boolean;
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
// We should maybe namespace them so we don't get conflicting methods across toolboxes.
export const events = ["saveLine", "toggleMode"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

type Cursor = "crosshair" | "none" | "not-allowed";

export class PaintbrushCanvasClass extends Component<Props, State> {
  readonly name = "paintbrush";

  private interactionCanvas: BaseCanvas;

  private backgroundCanvas: BaseCanvas;

  private isPressing: boolean;

  private isDrawing: boolean;

  private points: XYPoint[];

  private mode: number;

  constructor(props: Props) {
    super(props);

    this.isPressing = false;
    this.isDrawing = false;
    this.points = [];
    this.mode = Mode.draw;

    this.state = {
      hideBackCanvas: false,
    };
  }

  componentDidMount(): void {
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
  }

  componentDidUpdate(): void {
    // Redraw if we change pan or zoom
    this.drawAllStrokes();
  }

  componentWillUnmount(): void {
    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

  handlePointerMove = (canvasX: number, canvasY: number): void => {
    const { x, y } = canvasToImage(
      canvasX,
      canvasY,
      this.props.imageData.width,
      this.props.imageData.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    if (this.isPressing && !this.isDrawing) {
      // Start drawing and add point
      this.isDrawing = true;
      this.points.push({ x, y });
    }

    if (this.isDrawing) {
      // Add new point
      this.points.push({ x, y });

      // Create/update brush
      const brush = {
        color: theme.palette.secondary.dark,
        radius: this.props.brushRadius,
        type: this.props.brushType === "paintbrush" ? "paint" : "erase",
      } as Brush;

      // Draw current points
      this.drawPoints(
        this.points,
        brush,
        true,
        this.interactionCanvas.canvasContext
      );
    }
  };

  drawPoints = (
    imagePoints: XYPoint[],
    brush: Brush,
    clearCanvas = true,
    context: CanvasRenderingContext2D
  ): void => {
    const points = imagePoints.map(
      (point): XYPoint => {
        const { x, y } = imageToCanvas(
          point.x,
          point.y,
          this.props.imageData.width,
          this.props.imageData.height,
          this.props.scaleAndPan,
          this.props.canvasPositionAndSize
        );
        return { x, y };
      }
    );

    function midPointBetween(p1: XYPoint, p2: XYPoint) {
      return {
        x: p1.x + (p2.x - p1.x) / 2,
        y: p1.y + (p2.y - p1.y) / 2,
      };
    }

    context.lineJoin = "round";
    context.lineCap = "round";
    context.strokeStyle = brush.color;

    if (brush.type === "erase") {
      // If we are live drawing, use a brush colour
      if (context.canvas.id === "interaction-canvas") {
        context.strokeStyle = theme.palette.secondary.dark;
      } else {
        // If we have saved this line, use a subtraction
        context.globalCompositeOperation = "destination-out";
      }
    } else {
      context.globalCompositeOperation = "source-over";
      if (clearCanvas) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      }
    }

    context.lineWidth = brush.radius * 2 * this.props.scaleAndPan.scale;

    let p1 = points[0];
    let p2 = points[1];

    context.moveTo(p2.x, p2.y);
    context.beginPath();

    for (let i = 1, len = points.length; i < len; i += 1) {
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

  drawAllStrokes = (context = this.backgroundCanvas.canvasContext): void => {
    // Draw strokes on active layer whiles showing exiting paintbrush layers
    this.props.annotationsObject
      .getAllAnnotations()
      .forEach((annotationsObject) => {
        if (annotationsObject.toolbox === "paintbrush") {
          annotationsObject.brushStrokes.forEach((brushStrokes) => {
            this.drawPoints(
              brushStrokes.coordinates,
              brushStrokes.brush,
              false,
              context
            );
          });
        }
      });
  };

  clickNearBrushStroke = (imageX: number, imageY: number): number => {
    // Check if point clicked is near an existing paintbrush annotation.
    // If true, return annotation index, otherwise return -1.
    // If more than one annotation at clicked point, select first drawn.
    const annotations = this.props.annotationsObject.getAllAnnotations();

    for (let i = 0; i < annotations.length; i += 1) {
      if (annotations[i].toolbox === "paintbrush") {
        let finalIndex = -1;
        for (let j = 0; j < annotations[i].brushStrokes.length; j += 1) {
          const { coordinates, brush } = annotations[i].brushStrokes[j];
          for (let k = 0; k < coordinates.length; k += 1) {
            if (
              this.isClickNearPoint(
                { x: imageX, y: imageY },
                coordinates[k],
                brush.radius
              )
            ) {
              // If the region near the clicked point has been erased,
              // finalIndex will be reset to - 1.
              finalIndex = brush.type === "paint" ? i : -1;
            }
          }
        }
        if (finalIndex !== -1) return i;
      }
    }
    return -1;
  };

  isClickNearPoint = (
    point: XYPoint,
    point1: XYPoint,
    radius: number
  ): boolean =>
    Math.abs(point.x - point1.x) < radius &&
    Math.abs(point.y - point1.y) < radius;

  toggleMode = (): void => {
    if (this.mode === Mode.draw) {
      this.mode = Mode.select;
    } else {
      this.mode = Mode.draw;
    }
  };

  saveLine = (
    brushRadius = 20,
    brushColor = theme.palette.primary.dark
  ): void => {
    if (this.points.length < 2) return;

    const { brushStrokes } = this.props.annotationsObject.getActiveAnnotation();

    brushStrokes.push({
      coordinates: [...this.points],
      brush: {
        color: brushColor,
        radius: brushRadius,
        type: this.props.brushType === "paintbrush" ? "paint" : "erase",
      },
    });

    // Reset points array
    this.points.length = 0;

    this.drawAllStrokes();
    const context = this.interactionCanvas.canvasContext;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  };

  /** * Mouse events *** */
  onMouseDown = (canvasX: number, canvasY: number): void => {
    if (this.mode === Mode.draw) {
      // Start drawing
      if (this.props.brushType === "eraser") {
        // Copy the current BACK strokes to the front canvas
        this.drawAllStrokes(this.interactionCanvas.canvasContext);
        this.setState({ hideBackCanvas: true }, () => {
          this.isPressing = true;
          this.handlePointerMove(canvasX, canvasY);
        });
      }

      this.isPressing = true;

      // Ensure the initial down position gets added to our line
      this.handlePointerMove(canvasX, canvasY);
    } else if (this.mode === Mode.select) {
      // In select mode a single click allows to select a different paintbrush annotation
      const { x: imageX, y: imageY } = canvasToImage(
        canvasX,
        canvasY,
        this.props.imageData.width,
        this.props.imageData.height,
        this.props.scaleAndPan,
        this.props.canvasPositionAndSize
      );
      const selectedBrushStroke = this.clickNearBrushStroke(imageX, imageY);
      if (selectedBrushStroke !== -1) {
        this.props.annotationsObject.setActiveAnnotationID(selectedBrushStroke);
        this.drawAllStrokes();
      }
    }
  };

  onMouseMove = (canvasX: number, canvasY: number): void => {
    if (this.mode === Mode.draw) {
      this.handlePointerMove(canvasX, canvasY);
    }
  };

  onMouseUp = (canvasX: number, canvasY: number): void => {
    if (this.mode === Mode.draw) {
      // End painting & save painting
      this.isPressing = false;

      // Draw to this end pos
      this.handlePointerMove(canvasX, canvasY);

      // Stop drawing & save the drawn line
      this.isDrawing = false;

      this.saveLine(this.props.brushRadius);
      this.drawAllStrokes();
    }
  };

  getCursor = (): Cursor => {
    if (this.props.brushType === "paintbrush") {
      return "crosshair";
    }
    if (this.props.brushType === "eraser") {
      return "not-allowed";
    }
    return "none";
  };

  handleEvent = (event: Event): void => {
    if (event.detail === this.name) {
      this[event.type]?.call(this);
    }
  };

  render = (): ReactNode => (
    // We have two canvases in order to be able to erase stuff.
    <div
      style={{
        pointerEvents:
          this.props.brushType === "paintbrush" ||
          this.props.brushType === "eraser"
            ? "auto"
            : "none",
      }}
    >
      <div style={{ opacity: this.state.hideBackCanvas ? "none" : "block" }}>
        <BaseCanvas
          cursor="none"
          ref={(backgroundCanvas) => {
            this.backgroundCanvas = backgroundCanvas;
          }}
          name="background"
          scaleAndPan={this.props.scaleAndPan}
          canvasPositionAndSize={this.props.canvasPositionAndSize}
          setCanvasPositionAndSize={this.props.setCanvasPositionAndSize}
        />
      </div>

      <BaseCanvas
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        cursor={this.getCursor()}
        ref={(interactionCanvas) => {
          this.interactionCanvas = interactionCanvas;
        }}
        name="interaction"
        scaleAndPan={this.props.scaleAndPan}
        canvasPositionAndSize={this.props.canvasPositionAndSize}
        setCanvasPositionAndSize={this.props.setCanvasPositionAndSize}
      />
    </div>
  );
}

export const PaintbrushCanvas = (
  props: Omit<Props, "brushRadius">
): ReactElement => {
  const [paintbrush] = usePaintbrushStore();

  return (
    <PaintbrushCanvasClass
      brushType={props.brushType}
      annotationsObject={props.annotationsObject}
      imageData={props.imageData}
      scaleAndPan={props.scaleAndPan}
      canvasPositionAndSize={props.canvasPositionAndSize}
      brushRadius={paintbrush.brushRadius}
      callRedraw={props.callRedraw}
    />
  );
};
