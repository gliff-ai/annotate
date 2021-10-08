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

  private pixelCanvas: HTMLCanvasElement | null; // used for transfering pixelView Uint8Array data into the (background/interaction)Canvas

  private pixelCtx: CanvasRenderingContext2D | null;

  private tempCanvas: HTMLCanvasElement | null; // used for rendering brush annotations separately, to avoid eraser strokes interfering with other brush annotations

  private tempCtx: CanvasRenderingContext2D | null;

  private isDrawing: boolean;

  private points: XYPoint[]; // buffer of points being drawn by the current mouse stroke

  constructor(props: Props) {
    super(props);

    this.isDrawing = false;
    this.points = [];
    this.backgroundCanvas = null;
    this.pixelCanvas = null;
    this.pixelCtx = null;
    this.tempCanvas = null;
    this.tempCtx = null;

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
    // can't just initialize this canvas in the constructor because backgroundCanvas doesn't get
    // the correct width/height until canvasPositionAndSize is set via callback from elsewhere
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");
    this.tempCanvas.width = this.backgroundCanvas.canvasContext.canvas.width;
    this.tempCanvas.height = this.backgroundCanvas.canvasContext.canvas.height;

    // Redraw if we change pan or zoom
    this.drawAllStrokes();
  }

  componentWillUnmount(): void {
    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

  updateStroke = (canvasX: number, canvasY: number): void => {
    // adds the given point to this.points and re-draws the interaction canvas

    const { x, y } = canvasToImage(
      canvasX,
      canvasY,
      this.props.displayedImage.width,
      this.props.displayedImage.height,
      this.props.scaleAndPan,
      this.props.canvasPositionAndSize
    );

    // Add new point
    this.points.push({ x, y });

    // Create/update brush
    const brush = {
      color: mainColor,
      radius: this.props.brushRadius,
      type:
        this.props.activeToolbox === Tools.paintbrush.name ? "paint" : "erase",
    } as Brush;

    // Set interactionCanvas alpha (props.annotationActiveAlpha for paint, 1.0 for eraser):
    this.interactionCanvas.canvasContext.globalAlpha =
      brush.type === "paint" ? this.props.annotationActiveAlpha : 1.0;

    // Draw current points
    this.drawPoints(
      this.points,
      brush,
      brush.type === "paint",
      this.interactionCanvas.canvasContext
    );
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

    // Common setup:
    context.lineJoin = "round";
    context.lineCap = "round";
    context.lineWidth = this.getCanvasBrushRadius(brush.radius);
    context.globalAlpha = 1.0;
    // drawing strokes with alpha=1.0 ensures we don't see where separate strokes overlap
    // we _do_ see where strokes from separate annotations overlap, because annotations are drawn to the
    // background canvas with alpha=this.props.annotation(Active)Alpha in drawAllStrokes

    // Set annotation colour and transparency
    if (isActive) {
      context.strokeStyle = mainColor;
    } else {
      context.strokeStyle = brush.color;
    }

    if (brush.type === "erase") {
      context.globalCompositeOperation = "destination-out";
    } else {
      context.globalCompositeOperation = "source-over";
    }

    if (clearCanvas) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }

    // Draw stroke:
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

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

  drawAllStrokes = (skipActive = false): void => {
    // Draw strokes on active layer whiles showing existing paintbrush layers

    const context = this.backgroundCanvas?.canvasContext;
    if (!context) return;

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
      // Get active annotation ID
      const activeAnnotationID =
        this.props.annotationsObject.getActiveAnnotationID();

      // Draw all paintbrush annotations
      this.props.annotationsObject
        .getAllAnnotations()
        .forEach((annotation, i) => {
          if (
            annotation.toolbox === Toolboxes.paintbrush &&
            !(i === activeAnnotationID && skipActive)
          ) {
            this.tempCtx.clearRect(
              0,
              0,
              this.tempCanvas.width,
              this.tempCanvas.height
            );
            annotation.brushStrokes.forEach((brushStrokes, j) => {
              if (brushStrokes.spaceTimeInfo.z === this.props.sliceIndex) {
                this.drawPoints(
                  brushStrokes.coordinates,
                  brushStrokes.brush,
                  false,
                  this.tempCtx,
                  i === activeAnnotationID
                );
              }
            });
            context.globalCompositeOperation = "source-over";
            context.globalAlpha =
              i === activeAnnotationID
                ? this.props.annotationActiveAlpha
                : this.props.annotationAlpha;
            context.drawImage(this.tempCanvas, 0, 0);
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
      this.isDrawing = true;

      if (this.props.activeToolbox === Tools.eraser.name) {
        // if using the eraser, we redraw all strokes except the active annotation,
        // then draw the active annotation on the interaction canvas and erase from
        // there as we add to this.points

        // Redraw everything except the active annotation:
        this.drawAllStrokes(true);

        // Clear tempCanvas and draw the active annotation on it:
        this.tempCtx.clearRect(
          0,
          0,
          this.tempCanvas.width,
          this.tempCanvas.height
        );
        this.props.annotationsObject
          .getActiveAnnotation()
          .brushStrokes.forEach((brushstroke) => {
            this.drawPoints(
              brushstroke.coordinates,
              brushstroke.brush,
              false,
              this.tempCtx,
              true
            );
          });

        // Copy tempCanvas onto interactionCanvas:
        this.interactionCanvas.canvasContext.clearRect(
          0,
          0,
          this.interactionCanvas.canvasContext.canvas.width,
          this.interactionCanvas.canvasContext.canvas.height
        );
        this.interactionCanvas.canvasContext.globalAlpha =
          this.props.annotationActiveAlpha;
        this.interactionCanvas.canvasContext.globalCompositeOperation =
          "source-over";
        this.interactionCanvas.canvasContext.drawImage(this.tempCanvas, 0, 0);
      }

      // Ensure the initial down position gets added to our line
      this.updateStroke(canvasX, canvasY);
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
    if (this.props.mode === Mode.draw && this.isDrawing) {
      this.updateStroke(canvasX, canvasY);
    }
  };

  onMouseUp = (canvasX: number, canvasY: number): void => {
    if (this.props.mode === Mode.draw) {
      // End painting & save painting

      // Draw to this end pos
      this.updateStroke(canvasX, canvasY);

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
