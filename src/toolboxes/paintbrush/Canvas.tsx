import {
  ReactNode,
  Component,
  ReactElement,
  useState,
  useEffect,
  FC,
} from "react";
import simplify from "simplify-js";
import { slpfLines } from "@gliff-ai/slpf";
import { theme } from "@gliff-ai/style";
import { Mode } from "@/ui";
import { Annotations } from "@/annotation";
import { XYPoint } from "@/annotation/interfaces";
import {
  BaseCanvas,
  CanvasProps,
  canvasToImage,
  imageToCanvas,
} from "@/components/baseCanvas";
import { palette, getRGBAString } from "@/components/palette";
import { Toolboxes, Toolbox } from "@/Toolboxes";
import { Tools } from "./Toolbox";
import { usePaintbrushStore } from "./Store";
import { BrushStroke } from "./interfaces";
import { drawCapsule } from "@/download/DownloadAsTiff";
import { getNewImageSizeAndDisplacement } from "@/toolboxes/background/drawImage";

const mainColor = theme.palette.primary.main;
const secondaryColor = theme.palette.secondary.main;

interface Props extends CanvasProps {
  isActive: boolean;
  activeToolbox: Toolbox | string;
  mode: Mode;
  annotationsObject: Annotations;
  brushRadius: number;
  annotationActiveAlpha: number;
  annotationAlpha: number;
  redraw: number;
  sliceIndex: number;
  setUIActiveAnnotationID: (id: number) => void;
  setActiveToolbox: (tool: Toolbox) => void;
}

interface Brush {
  radius: number;
  type: "paint" | "erase";
  color: string; // rgb(a) string
}

interface State {
  hideBackCanvas: boolean;
  pixelView: boolean;
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
// We should maybe namespace them so we don't get conflicting methods across toolboxes.
export const events = ["saveLine", "fillBrush", "togglePixelView"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

type Cursor = "crosshair" | "pointer" | "none" | "not-allowed";

type CursorProps = {
  brushRadius: number;
  canvasTopAndLeft: { top: number; left: number };
};

const FauxCursor: FC<CursorProps> = ({
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

export class CanvasClass extends Component<Props, State> {
  readonly name = Toolboxes.paintbrush;

  private interactionCanvas: BaseCanvas;

  private backgroundCanvas: BaseCanvas | null;

  private pixelCanvas: HTMLCanvasElement | null;

  private pixelCtx: CanvasRenderingContext2D | null;

  private isPressing: boolean;

  private isDrawing: boolean;

  private points: XYPoint[]; // buffer of points being drawn by the current mouse stroke

  private annotationOpacity: number;

  constructor(props: Props) {
    super(props);

    this.isPressing = false;
    this.isDrawing = false;
    this.points = [];
    this.annotationOpacity = this.props.annotationActiveAlpha;
    this.backgroundCanvas = null;
    this.pixelCanvas = null;
    this.pixelCtx = null;

    this.state = {
      hideBackCanvas: false,
      pixelView: false,
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
        color: mainColor,
        radius: this.props.brushRadius,
        type:
          this.props.activeToolbox === Tools.paintbrush.name
            ? "paint"
            : "erase",
      } as Brush;

      // Draw current points
      if (brush.type === "paint") {
        this.drawPoints(
          this.points,
          brush,
          true,
          this.interactionCanvas.canvasContext
        );
      } else {
        this.drawPoints(
          this.points,
          brush,
          false,
          this.backgroundCanvas.canvasContext
        );
      }
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

    context.lineJoin = "round";
    context.lineCap = "round";

    // Set annotation colour and transparency
    if (isActive) {
      context.strokeStyle = mainColor;
      this.annotationOpacity = this.props.annotationActiveAlpha;
    } else {
      context.strokeStyle = brush.color;
      this.annotationOpacity = this.props.annotationAlpha;
    }
    if (brush.type === "erase") {
      this.annotationOpacity = 1.0;
    }
    context.globalAlpha = this.annotationOpacity;

    if (brush.type === "erase") {
      // If we are live drawing, use a brush colour
      if (context.canvas.id === "interaction-canvas") {
        context.strokeStyle = secondaryColor;
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

    const firstPoint = points[0];

    context.beginPath();
    context.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < points.length; i += 1) {
      // we just use linear connections for now
      const nextPoint = points[i];
      context.lineTo(nextPoint.x, nextPoint.y);
    }

    context.stroke();
  };

  togglePixelView = (): void => {
    this.setState((oldstate) => ({ pixelView: !oldstate.pixelView }));
  };

  drawAllStrokes = (context = this.backgroundCanvas?.canvasContext): void => {
    // Draw strokes on active layer whiles showing existing paintbrush layers
    if (!context) return;

    // Get active annotation ID
    const activeAnnotationID =
      this.props.annotationsObject.getActiveAnnotationID();

    // Clear paintbrush canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    if (this.state.pixelView) {
      // rasterize the brushstrokes and display as image rather than vector:

      let img = new Uint8Array(
        4 * this.props.displayedImage.width * this.props.displayedImage.height
      );
      this.props.annotationsObject
        .getAllAnnotations()
        .filter(({ toolbox }) => toolbox === Toolboxes.paintbrush)
        .forEach(({ brushStrokes }, annotationIndex) => {
          brushStrokes.forEach(({ coordinates, brush }) => {
            coordinates.forEach((point0, i) => {
              img = drawCapsule(
                point0,
                i + 1 < coordinates.length ? coordinates[i + 1] : point0,
                brush.radius,
                img,
                this.props.displayedImage.width,
                annotationIndex,
                brush.type,
                4
              );
            });
          });
        });

      // to get the Uint8Array to render as an image, we need to convert it to ImageData,
      // then put that in a Canvas, then use drawImage to render that on the paintbrush canvas:

      const imgData = new ImageData(
        Uint8ClampedArray.from(img),
        this.props.displayedImage.width
      );

      if (this.pixelCanvas === null) {
        this.pixelCanvas = document.createElement("canvas");
        this.pixelCtx = this.pixelCanvas.getContext("2d");
        this.pixelCanvas.width = this.props.displayedImage.width;
        this.pixelCanvas.height = this.props.displayedImage.height;
      }

      this.pixelCtx.putImageData(imgData, 0, 0);

      const { offsetX, offsetY, newWidth, newHeight } =
        getNewImageSizeAndDisplacement(
          context,
          imgData,
          this.props.scaleAndPan
        );
      // background canvas globalCompositeOperation may still be "destination-out" if
      // the most recent brushstroke is an eraser, so make sure it's source-over here or else we won't see anything:
      context.globalCompositeOperation = "source-over";
      context.imageSmoothingEnabled = false;
      context.drawImage(
        this.pixelCanvas,
        offsetX,
        offsetY,
        newWidth,
        newHeight
      );
    } else {
      // Draw all paintbrush annotations
      this.props.annotationsObject
        .getAllAnnotations()
        .forEach((annotationsObject, i) => {
          if (annotationsObject.toolbox === Toolboxes.paintbrush) {
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
    }
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
        type:
          this.props.activeToolbox === Tools.paintbrush.name
            ? "paint"
            : "erase",
      },
    });

    // Reset points array
    this.points.length = 0;

    this.drawAllStrokes();
    const context = this.interactionCanvas.canvasContext;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  };

  fillBrush = (): void => {
    // Treat the current paintbrush item as a closed polygon and fill
    // Simplifying the line for computational efficiency
    const strokeCoordinates =
      this.props.annotationsObject.getBrushStrokeCoordinates();

    // simplify
    // TODO pick tolerance more cleverly
    const simplifiedCoordinates = simplify(strokeCoordinates, 10, true);

    const linesToFill: XYPoint[][] = slpfLines(simplifiedCoordinates);

    let color = this.props.annotationsObject.getActiveAnnotationColor();
    // Do we already have a colour for this layer?
    color =
      color ||
      getRGBAString(
        palette[
          this.props.annotationsObject.getActiveAnnotationID() % palette.length
        ]
      );

    for (let i = 0; i < linesToFill.length; i += 1) {
      const coordinates = linesToFill[i];
      const brushStroke: BrushStroke = {
        coordinates,
        spaceTimeInfo: { z: this.props.sliceIndex, t: 0 },
        brush: {
          color,
          radius: 1,
          type: "paint",
        },
      };

      this.props.annotationsObject.addBrushStroke(brushStroke);
    }

    this.drawAllStrokes();
  };

  /* *** Mouse events *** */
  onMouseDown = (canvasX: number, canvasY: number): void => {
    if (this.props.mode === Mode.draw) {
      // Start drawing
      if (this.props.activeToolbox === Tools.eraser.name) {
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
    } else if (this.props.mode === Mode.select) {
      // In select mode a single click allows to select a different spline annotation
      const { x: imageX, y: imageY } = canvasToImage(
        canvasX,
        canvasY,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.props.canvasPositionAndSize
      );
      this.props.annotationsObject.clickSelect(
        imageX,
        imageY,
        this.props.sliceIndex,
        this.props.setUIActiveAnnotationID,
        this.props.setActiveToolbox
      );
    }
  };

  onMouseMove = (canvasX: number, canvasY: number): void => {
    if (this.props.mode === Mode.draw) {
      this.handlePointerMove(canvasX, canvasY);
    }
  };

  onMouseUp = (canvasX: number, canvasY: number): void => {
    if (this.props.mode === Mode.draw) {
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
    if (this.props.activeToolbox === Toolboxes.paintbrush) {
      return this.props.mode === Mode.draw ? "none" : "pointer";
    }
    return "none";
  };

  handleEvent = (event: Event): void => {
    if ((event.detail as string).includes(this.name)) {
      this[event.type]?.call(this);
    }
  };

  render = (): ReactNode =>
    this.props.displayedImage ? (
      <>
        {/* this div is basically a fake cursor */}
        {this.props.isActive ? (
          <FauxCursor
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
        ) : null}
        {/* We have two canvases in order to be able to erase stuff. */}
        <div
          style={{
            pointerEvents: this.props.isActive ? "auto" : "none",
          }}
        >
          <div
            style={{ opacity: this.state.hideBackCanvas ? "none" : "block" }} // DEVNOTE: this line does nothing!
          >
            <BaseCanvas
              cursor="none"
              ref={(backgroundCanvas) => {
                this.backgroundCanvas = backgroundCanvas;
              }}
              name={`${this.name}-background`}
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
            name={`${this.name}-interaction`}
            scaleAndPan={this.props.scaleAndPan}
            canvasPositionAndSize={this.props.canvasPositionAndSize}
            setCanvasPositionAndSize={this.props.setCanvasPositionAndSize}
          />
        </div>
      </>
    ) : null;
}

export const Canvas = (
  props: Omit<
    Props,
    "brushRadius" | "isActive" | "annotationAlpha" | "annotationActiveAlpha"
  >
): ReactElement => {
  // we will overwrite props.activeToolbox, which will be paintbrush
  // with paintbrush.brushType, which will be paintbrush/eraser
  const [paintbrush] = usePaintbrushStore();
  let { activeToolbox } = props;
  let isActive = false;
  if (activeToolbox === Toolboxes.paintbrush) {
    activeToolbox = paintbrush.brushType;
    isActive = true;
  }
  // we will also use the brushRadius that's in the store

  return (
    <CanvasClass
      isActive={isActive}
      activeToolbox={activeToolbox}
      mode={props.mode}
      annotationsObject={props.annotationsObject}
      displayedImage={props.displayedImage}
      scaleAndPan={props.scaleAndPan}
      canvasPositionAndSize={props.canvasPositionAndSize}
      brushRadius={paintbrush.brushRadius}
      annotationActiveAlpha={paintbrush.annotationActiveAlpha / 100}
      annotationAlpha={paintbrush.annotationAlpha / 100}
      redraw={props.redraw}
      sliceIndex={props.sliceIndex}
      setUIActiveAnnotationID={props.setUIActiveAnnotationID}
      setActiveToolbox={props.setActiveToolbox}
    />
  );
};
