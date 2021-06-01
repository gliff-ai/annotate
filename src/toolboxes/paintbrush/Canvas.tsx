import React, {
  ReactNode,
  Component,
  ReactElement,
  useState,
  useEffect,
} from "react";

import { BaseCanvas, CanvasProps } from "@/baseCanvas";
import { Annotations } from "@/annotation";
import { canvasToImage, imageToCanvas } from "@/transforms";
import { XYPoint } from "@/annotation/interfaces";
import { Tool, Tools } from "@/tools";

import {
  main as mainColor,
  secondary as secondaryColor,
  palette,
  getRGBAString,
} from "@/palette";

import { usePaintbrushStore } from "./Store";

interface Props extends CanvasProps {
  brushType: string;
  annotationsObject: Annotations;
  brushRadius: number;
  callRedraw: number;
  sliceIndex: number;
  setUIActiveAnnotationID: (id: number) => void;
  setActiveTool: (tool: Tool) => void;
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
  mode: Mode;
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
// We should maybe namespace them so we don't get conflicting methods across toolboxes.
export const events = ["saveLine", "toggleMode"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

type Cursor = "crosshair" | "pointer" | "none" | "not-allowed";

type CursorProps = {
  brushType: string;
  brushRadius: number;
  canvasTopAndLeft: { top: number; left: number };
};

const FauxCursor: React.FC<CursorProps> = ({
  brushType,
  brushRadius,
  canvasTopAndLeft,
}: CursorProps): ReactElement => {
  const [mousePosition, setMousePosition] = useState({ x: null, y: null });

  useEffect(() => {
    const mouseMoveHandler = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      setMousePosition({ x: clientX, y: clientY });
    };
    document.addEventListener("mousemove", mouseMoveHandler);

    return () => {
      document.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, []);

  return (
    <div
      id="cursor"
      style={{
        visibility:
          brushType === "paintbrush" || brushType === "eraser"
            ? "visible"
            : "hidden",
        width: brushRadius,
        height: brushRadius,
        border: "2px solid #666666",
        borderRadius: "50%",
        position: "absolute",
        top: mousePosition.y - brushRadius / 2 - canvasTopAndLeft.top,
        left: mousePosition.x - brushRadius / 2 - canvasTopAndLeft.left,
      }}
    />
  );
};

export class PaintbrushCanvasClass extends Component<Props, State> {
  readonly name = "paintbrush";

  private interactionCanvas: BaseCanvas;

  private backgroundCanvas: BaseCanvas;

  private isPressing: boolean;

  private isDrawing: boolean;

  private points: XYPoint[];

  private annotationOpacity: number;

  constructor(props: Props) {
    super(props);

    this.isPressing = false;
    this.isDrawing = false;
    this.points = [];
    this.annotationOpacity = 1;

    this.state = {
      hideBackCanvas: false,
      mode: Mode.draw,
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
      this.props.displayedImage.width,
      this.props.displayedImage.height,
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
        color: getRGBAString(mainColor),
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
    context: CanvasRenderingContext2D,
    isActive = true
  ): void => {
    const points = imagePoints.map((point): XYPoint => {
      const { x, y } = imageToCanvas(
        point.x,
        point.y,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.props.canvasPositionAndSize
      );
      return { x, y };
    });

    function midPointBetween(p1: XYPoint, p2: XYPoint) {
      return {
        x: p1.x + (p2.x - p1.x) / 2,
        y: p1.y + (p2.y - p1.y) / 2,
      };
    }

    context.lineJoin = "round";
    context.lineCap = "round";

    // Set annotation colour and transparency
    if (isActive) {
      context.strokeStyle = getRGBAString(mainColor);
      this.annotationOpacity = 1;
    } else {
      context.strokeStyle = brush.color;
      this.annotationOpacity = 0.5;
    }
    context.globalAlpha = this.annotationOpacity;

    if (brush.type === "erase") {
      // If we are live drawing, use a brush colour
      if (context.canvas.id === "interaction-canvas") {
        context.strokeStyle = getRGBAString(secondaryColor);
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

    context.lineWidth = this.getCanvasBrushRadius(brush.radius);

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
    // Draw strokes on active layer whiles showing existing paintbrush layers

    // Get active annotation ID
    const activeAnnotationID =
      this.props.annotationsObject.getActiveAnnotationID();

    // Clear paintbrush canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Draw all paintbrush annotations
    this.props.annotationsObject
      .getAllAnnotations()
      .forEach((annotationsObject, i) => {
        if (annotationsObject.toolbox === "paintbrush") {
          annotationsObject.brushStrokes.forEach((brushStrokes) => {
            if (brushStrokes.spaceTimeInfo.z === this.props.sliceIndex) {
              this.drawPoints(
                brushStrokes.coordinates,
                brushStrokes.brush,
                false,
                context,
                i === activeAnnotationID
              );
            }
          });
        }
      });
  };

  getCanvasBrushRadius = (brushRadius: number): number => {
    // Get brush radius given image to canvas scaling factor
    // and image scaling (zoom level).
    const imageScalingFactor =
      Math.min(
        this.props.canvasPositionAndSize.height /
          this.props.displayedImage.height,
        this.props.canvasPositionAndSize.width / this.props.displayedImage.width
      ) || 1;
    return brushRadius * imageScalingFactor * 2 * this.props.scaleAndPan.scale;
  };

  toggleMode = (): void => {
    if (!this.isActive()) return;
    if (this.state.mode === Mode.draw) {
      this.setState({ mode: Mode.select });
    } else {
      this.setState({ mode: Mode.draw });
    }
  };

  isActive = (): boolean =>
    this.props.brushType === "paintbrush" || this.props.brushType === "eraser";

  saveLine = (radius = 20): void => {
    if (this.points.length < 2) return;

    let color = this.props.annotationsObject.getActiveAnnotationColor();
    // Do we already have a colour for this layer?
    color =
      color ||
      getRGBAString(
        palette[
          this.props.annotationsObject.getActiveAnnotationID() % palette.length
        ]
      );

    this.props.annotationsObject.addBrushStroke({
      coordinates: [...this.points],
      spaceTimeInfo: { z: this.props.sliceIndex, t: 0 },
      brush: {
        color,
        radius,
        type: this.props.brushType === "paintbrush" ? "paint" : "erase",
      },
    });

    // Reset points array
    this.points.length = 0;

    this.drawAllStrokes();
    const context = this.interactionCanvas.canvasContext;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  };

  /* *** Mouse events *** */
  onMouseDown = (canvasX: number, canvasY: number): void => {
    if (this.state.mode === Mode.draw) {
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
    } else if (this.state.mode === Mode.select) {
      // In select mode a single click allows to select a different paintbrush or spline annotation
      const { x: imageX, y: imageY } = canvasToImage(
        canvasX,
        canvasY,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.props.canvasPositionAndSize
      );
      const selectedBrushStroke =
        this.props.annotationsObject.clickNearBrushStroke(
          imageX,
          imageY,
          this.props.sliceIndex
        );
      const selectedSpline = this.props.annotationsObject.clickNearSpline(
        imageX,
        imageY,
        this.props.sliceIndex
      );
      if (
        selectedBrushStroke !== null &&
        selectedBrushStroke !==
          this.props.annotationsObject.getActiveAnnotationID()
      ) {
        this.props.annotationsObject.setActiveAnnotationID(selectedBrushStroke);
        this.props.setUIActiveAnnotationID(selectedBrushStroke);
        this.props.setActiveTool(Tools.paintbrush);
        this.drawAllStrokes();
      } else if (selectedSpline !== null) {
        this.props.annotationsObject.setActiveAnnotationID(selectedSpline);
        this.props.setUIActiveAnnotationID(selectedSpline);
        this.props.setActiveTool(Tools.spline);
      }
    }
  };

  onMouseMove = (canvasX: number, canvasY: number): void => {
    if (this.state.mode === Mode.draw) {
      this.handlePointerMove(canvasX, canvasY);
    }
  };

  onMouseUp = (canvasX: number, canvasY: number): void => {
    if (this.state.mode === Mode.draw) {
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
    if (
      this.props.brushType === "paintbrush" ||
      this.props.brushType === "eraser"
    ) {
      return this.state.mode === Mode.draw ? "none" : "pointer";
    }
    return "none";
  };

  handleEvent = (event: Event): void => {
    if ((event.detail as string).includes(this.name)) {
      this[event.type]?.call(this);
    }
  };

  render = (): ReactNode => (
    <>
      {/* this div is basically a fake cursor */}
      <FauxCursor
        brushType={this.props.brushType}
        brushRadius={this.getCanvasBrushRadius(this.props.brushRadius)}
        canvasTopAndLeft={{
          top:
            this.backgroundCanvas?.canvasContext?.canvas?.getBoundingClientRect()
              .top || 0,
          left:
            this.backgroundCanvas?.canvasContext?.canvas?.getBoundingClientRect()
              .left || 0,
        }}
      />
      {/* We have two canvases in order to be able to erase stuff. */}
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
    </>
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
      displayedImage={props.displayedImage}
      scaleAndPan={props.scaleAndPan}
      canvasPositionAndSize={props.canvasPositionAndSize}
      brushRadius={paintbrush.brushRadius}
      callRedraw={props.callRedraw}
      sliceIndex={props.sliceIndex}
      setUIActiveAnnotationID={props.setUIActiveAnnotationID}
      setActiveTool={props.setActiveTool}
    />
  );
};
