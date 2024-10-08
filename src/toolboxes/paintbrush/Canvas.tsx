import { ReactNode, PureComponent, ReactElement, forwardRef } from "react";
import { theme } from "@gliff-ai/style";
import { Mode } from "@/ui";
import { Annotations } from "@/annotation";
import { XYPoint, PositionAndSize } from "@/annotation/interfaces";
import {
  BaseCanvas,
  CanvasProps,
  canvasToImage,
  imageToCanvas,
} from "@/components/baseCanvas";
import { palette, getRGBAString } from "@/components/palette";
import { Toolboxes, Toolbox } from "@/Toolboxes";
import { usePaintbrushStore } from "./Store";
import { Brush } from "./interfaces";
import { slic } from "./slic";
import { drawCapsule } from "@/download/DownloadAsTiff";
import {
  getNewImageSizeAndDisplacement,
  drawImageOnCanvas,
} from "@/toolboxes/helpers";

const mainColor = theme.palette.primary.main;

interface Props extends Omit<CanvasProps, "canvasPositionAndSize"> {
  isActive: boolean;
  is3D: boolean;
  isSuper: boolean;
  activeToolbox: Toolbox | string;
  mode: Mode;
  setMode: (mode: Mode) => void;
  annotationsObject: Annotations;
  brushRadius: number;
  annotationActiveAlpha: number;
  annotationAlpha: number;
  // eslint-disable-next-line react/no-unused-prop-types
  redraw: number;
  sliceIndex: number;
  setUIActiveAnnotationID: (id: number) => void;
  setActiveToolbox: (tool: Toolbox) => void;
  readonly: boolean;
}

interface State {
  pixelView: boolean;
  canvasPositionAndSize: PositionAndSize;
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
// We should maybe namespace them so we don't get conflicting methods across toolboxes.
export const events = ["saveLine", "fillBrush", "togglePixelView"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

type Cursor = "crosshair" | "pointer" | "none" | "not-allowed";

export class CanvasClass extends PureComponent<Props, State> {
  readonly name = Toolboxes.paintbrush;

  private interactionCanvas: BaseCanvas;

  private backgroundCanvas: BaseCanvas | null;

  public baseCanvas: BaseCanvas | null; // public because CanvasStack needs to access it to create the diff image in comparison mode

  private pixelCanvas: HTMLCanvasElement | null; // used for transfering pixelView Uint8Array data into the (background/interaction)Canvas

  private pixelCtx: CanvasRenderingContext2D | null;

  private tempCanvas: HTMLCanvasElement | null; // used for rendering brush annotations separately, to avoid eraser strokes interfering with other brush annotations

  private tempCtx: CanvasRenderingContext2D | null;

  private superpixels: Int32Array | null; // a map of the image labelled with superpixel indices

  private currentSuperPixelID: number | null; // the superpixel ID of the current pixel (if in that mode)

  private hasSuperPixelChanged: boolean; // to save rendering the same superpixel multiple times we keep track of whether it has changed

  private cursorCtx: CanvasRenderingContext2D | null;

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
    this.superpixels = null;
    this.currentSuperPixelID = null;
    this.hasSuperPixelChanged = false;

    this.state = {
      pixelView: false,
      canvasPositionAndSize: { top: 0, left: 0, width: 0, height: 0 },
    };
  }

  componentDidMount(): void {
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
  }

  componentDidUpdate(prevProps: Props): void {
    // can't just initialize this canvas in the constructor because backgroundCanvas doesn't get
    // the correct width/height until canvasPositionAndSize is set via callback from elsewhere
    if (!this.backgroundCanvas) return;

    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d");
    this.tempCanvas.width = this.backgroundCanvas.canvasContext.canvas.width;
    this.tempCanvas.height = this.backgroundCanvas.canvasContext.canvas.height;
    if (this.cursorCtx) {
      this.cursorCtx.canvas.width = this.state.canvasPositionAndSize.width;
      this.cursorCtx.canvas.height = this.state.canvasPositionAndSize.height;
    }

    // Redraw if we change pan or zoom
    try {
      this.drawAllStrokes(this.backgroundCanvas?.canvasContext);
    } catch (e) {
      console.error(`${(e as Error).message}`);
    }

    // check if we've turned the Super Marker on and initialise super pixels
    // or reinitialise if we change the brush size
    // the size of the super pixels is based on the brush size
    // TODO check if this gets reinitialised if we change image?
    if (
      this.props.isSuper &&
      (this.props.isSuper !== prevProps.isSuper ||
        this.props.brushRadius !== prevProps.brushRadius)
    ) {
      ({ superpixels: this.superpixels } = slic(
        this.props.displayedImage,
        2 * this.props.brushRadius
      ));
    }
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
      this.state.canvasPositionAndSize
    );

    // Add new point
    this.points.push({ x, y });

    // Create/update brush
    const brush = {
      color: mainColor,
      radius: this.props.brushRadius,
      type: this.props.activeToolbox === "Paintbrush" ? "paint" : "erase",
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
        this.state.canvasPositionAndSize
      );
      return { x, y };
    });

    // Common setup:
    context.lineJoin = "round";
    context.lineCap = "round";
    context.lineWidth = this.getCanvasBrushDiameter(brush.radius);
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
      this.clearCanvas(context);
    }

    // Draw stroke:
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i += 1) {
      // we just use linear connections for now
      const nextPoint = points[i];
      context.lineTo(nextPoint.x, nextPoint.y);
    }
    context.lineTo(points[points.length - 1].x, points[points.length - 1].y); // in case there's only one point in points

    context.stroke();
  };

  togglePixelView = (): void => {
    this.setState((oldstate) => ({ pixelView: !oldstate.pixelView }));
  };

  drawAllStrokes = (
    context: CanvasRenderingContext2D,
    drawWhich = "all"
  ): void => {
    // Draw strokes on active layer whiles showing existing paintbrush layers
    // drawWhich: "all" (default), "active", "inactive"

    if (!context) return;

    // Clear paintbrush canvas
    this.clearCanvas(context);

    if (this.state.pixelView) {
      // rasterize the brushstrokes and display as image rather than vector:

      let img = new Uint8Array(
        4 * this.props.displayedImage.width * this.props.displayedImage.height
      );
      this.props.annotationsObject
        .getAllAnnotations()
        .filter(({ toolbox }) => toolbox === Toolboxes.paintbrush)
        .forEach(({ brushStrokes }, annotationIndex) => {
          brushStrokes.forEach(({ coordinates, spaceTimeInfo, brush }) => {
            coordinates.forEach((point0, i) => {
              if (spaceTimeInfo.z === this.props.sliceIndex) {
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
              }
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
            !(i === activeAnnotationID && drawWhich === "inactive") &&
            !(i !== activeAnnotationID && drawWhich === "active")
          ) {
            this.clearCanvas(this.tempCtx);
            annotation.brushStrokes.forEach((brushStrokes) => {
              if (brushStrokes.brush.is3D) {
                // calculate squared radius in this slice using Pythagoras' theorem:
                const r2 =
                  brushStrokes.brush.radius ** 2 -
                  (this.props.sliceIndex - brushStrokes.spaceTimeInfo.z) ** 2;
                if (r2 < 1) return; // draw nothing and go to the next brushstroke if the computed radius is < 1 in this slice
                this.drawPoints(
                  brushStrokes.coordinates,
                  {
                    ...brushStrokes.brush,
                    radius: Math.sqrt(r2),
                  },
                  false,
                  this.tempCtx,
                  i === activeAnnotationID
                );
              } else if (
                this.props.sliceIndex === brushStrokes.spaceTimeInfo.z
              ) {
                // if the brush is 2D, we can just draw it on the current slice
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

  getCanvasBrushDiameter = (brushRadius: number): number => {
    // Get brush radius given image to canvas scaling factor
    // and image scaling (zoom level).
    const imageScalingFactor =
      Math.min(
        this.state.canvasPositionAndSize.height /
          this.props.displayedImage.height,
        this.state.canvasPositionAndSize.width / this.props.displayedImage.width
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
        type: this.props.activeToolbox === "Paintbrush" ? "paint" : "erase",
        is3D: this.props.is3D,
      },
    });

    // Reset points array
    this.points.length = 0;

    this.drawAllStrokes(this.backgroundCanvas?.canvasContext);
    const context = this.interactionCanvas.canvasContext;
    this.clearCanvas(context);
  };

  fillBrush = (): void => {
    this.props.annotationsObject.fillBrush(
      this.props.sliceIndex,
      this.props.is3D
    );
    this.drawAllStrokes(this.backgroundCanvas?.canvasContext);
  };

  /* *** Mouse/Touch events *** */
  onMouseDown = (canvasX: number, canvasY: number): void => {
    if (this.props.mode === Mode.draw && !this.props.readonly) {
      if (this.isDrawing === false) {
        // Start drawing
        this.isDrawing = true;

        if (this.props.activeToolbox === "Eraser") {
          // if using the eraser, we redraw all strokes except the active annotation,
          // then draw the active annotation on the interaction canvas and erase from
          // there as we add to this.points

          // Redraw everything except the active annotation:
          this.drawAllStrokes(this.backgroundCanvas?.canvasContext, "inactive");

          // Redraw the active annotation:
          this.drawAllStrokes(this.interactionCanvas.canvasContext, "active");
        }

        // Ensure the initial down position gets added to our line
        // unless a superpixel (as we don't support dragging those yet FIXME)
        if (!this.props.isSuper) {
          this.updateStroke(canvasX, canvasY);
        }

        // Redraw cursor (it will be brighter now because this.isDrawing === true):
        this.drawCursor(canvasX, canvasY);
      } else {
        // If onMouseDown happens when this.isDrawing === true, then we've had two onMouseDown events
        // with no onMouseUp in between them. That can only happen if we're on iPad and the user has placed
        // two fingers on the screen, indicating pinch-to-zoom. In this case we want to abort the brushstroke.
        this.isDrawing = false;
        this.points = [];
      }
    } else if (this.props.mode === Mode.select) {
      // In select mode a single click allows to select a different spline annotation
      const { x: imageX, y: imageY } = canvasToImage(
        canvasX,
        canvasY,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.state.canvasPositionAndSize
      );
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
      if (this.props.readonly)
        this.drawAllStrokes(this.backgroundCanvas?.canvasContext); // this is unnecessary when not in readonly because calling setMode will not be disabled and thus will pass a different value in for mode, causing rerender
    }
  };

  onMouseMove = (canvasX: number, canvasY: number): void => {
    if (this.props.isSuper) {
      // get image position
      let { x: imageX, y: imageY } = canvasToImage(
        canvasX,
        canvasY,
        this.props.displayedImage.width,
        this.props.displayedImage.height,
        this.props.scaleAndPan,
        this.state.canvasPositionAndSize
      );
      imageX = Math.round(imageX);
      imageY = Math.round(imageY);
      // get super pixel ID
      const newSuperPixelID =
        this.superpixels[
          this.sub2ind(imageX, imageY, this.props.displayedImage.width)
        ];

      // update the visualised superpixel
      if (newSuperPixelID !== this.currentSuperPixelID) {
        // and if we're dragging add the previous superpixel to the annotation
        // FIXME this is bloody slow so lets not bother with this yet
        // if (this.props.mode === Mode.draw && this.isDrawing) {
        //   // get all pixels for the last superpixel
        //   const pixels: XYPoint[] = [];
        //   for (let idx = 0; idx < this.superpixels.length; idx += 1) {
        //     if (this.superpixels[idx] === this.currentSuperPixelID) {
        //       const { x, y } = this.ind2sub(
        //         idx,
        //         this.props.displayedImage.width
        //       );
        //       pixels.push({ x, y });
        //     }
        //   }
        //   this.props.annotationsObject.addSuperPixel(
        //     this.props.sliceIndex,
        //     pixels
        //   );
        //   this.drawAllStrokes(this.backgroundCanvas?.canvasContext);
        // }
        this.currentSuperPixelID = newSuperPixelID;
        this.hasSuperPixelChanged = true;
      } else {
        this.hasSuperPixelChanged = false;
      }
    } else if (this.props.mode === Mode.draw && this.isDrawing) {
      // Draw to this end pos
      // unless a superpixel (as we don't support dragging those yet FIXME)
      this.updateStroke(canvasX, canvasY);
    }

    if (this.cursorCtx && this.props.mode === Mode.draw) {
      this.drawCursor(canvasX, canvasY);
    }
  };

  onMouseUp = (canvasX: number, canvasY: number): void => {
    if (this.props.mode === Mode.draw && this.isDrawing) {
      // End painting & save painting

      if (!this.props.isSuper) {
        // Draw to this end pos
        // unless a superpixel (as we don't support dragging those yet FIXME)
        this.updateStroke(canvasX, canvasY);
      }

      // Stop drawing & save the drawn line or superpixel
      this.isDrawing = false;

      if (!this.props.isSuper) {
        this.saveLine(this.props.brushRadius);
      } else {
        // get all pixels for this superpixel
        const pixels: XYPoint[] = [];
        for (let idx = 0; idx < this.superpixels.length; idx += 1) {
          if (this.superpixels[idx] === this.currentSuperPixelID) {
            const { x, y } = this.ind2sub(idx, this.props.displayedImage.width);
            pixels.push({ x, y });
          }
        }
        this.props.annotationsObject.addSuperPixel(
          this.props.sliceIndex,
          pixels
        );
      }
      this.drawAllStrokes(this.backgroundCanvas?.canvasContext);

      this.drawCursor(canvasX, canvasY);
    }
  };

  private sub2ind = (x: number, y: number, width: number): number => {
    // convert x and y coordinates into a row-wise index
    const index = y * width + x;
    return index;
  };

  private ind2sub = (index: number, width: number): XYPoint => {
    // convert a row-wise index into x and y coordinates
    const x = index % width;
    const y = Math.floor(index / width);
    return { x, y };
  };

  getCursor = (): Cursor => {
    if (["Paintbrush", "Eraser"].includes(this.props.activeToolbox)) {
      return this.props.mode === Mode.draw ? "none" : "pointer";
    }
    return "none";
  };

  drawCursor = (canvasX: number, canvasY: number): void => {
    if (this.props.readonly) return;

    if (!this.props.isSuper || this.hasSuperPixelChanged) {
      // don't clear the canvas in superpixel mode unless the pixel has changed
      // otherwise, always clear the canvas
      this.clearCanvas(this.cursorCtx);
    }

    this.cursorCtx.lineWidth = 2;
    this.cursorCtx.strokeStyle = "white";
    this.cursorCtx.globalAlpha = this.isDrawing ? 0.8 : 0.3;

    if (!this.props.isSuper) {
      // if not a superpixel, draw a circle
      this.cursorCtx.beginPath();
      this.cursorCtx.arc(
        canvasX,
        canvasY,
        this.getCanvasBrushDiameter(this.props.brushRadius) / 2,
        0,
        2 * Math.PI
      );
      this.cursorCtx.stroke();
    } else if (this.hasSuperPixelChanged) {
      // if a superpixel, draw the region
      const currentSuperPixelSegmentation = new Uint8ClampedArray(
        this.superpixels.length * 4
      );
      for (let idx = 0; idx < this.superpixels.length; idx += 1) {
        if (this.superpixels[idx] === this.currentSuperPixelID) {
          // set to the gliff.ai green with transparency set by the active annotation slider
          currentSuperPixelSegmentation[idx * 4] = 6;
          currentSuperPixelSegmentation[idx * 4 + 1] = 255;
          currentSuperPixelSegmentation[idx * 4 + 2] = 178;
          currentSuperPixelSegmentation[idx * 4 + 3] =
            255 * this.props.annotationActiveAlpha;
        }
      }
      const highlightedImageData = new ImageData(
        currentSuperPixelSegmentation,
        this.props.displayedImage.width,
        this.props.displayedImage.height
      );
      drawImageOnCanvas(
        this.cursorCtx,
        highlightedImageData,
        this.props.scaleAndPan
      );

      // reset the visualisation
      this.hasSuperPixelChanged = false;
    }
  };

  handleEvent = (event: Event): void => {
    if ((event.detail as string).includes(this.name)) {
      this[event.type]?.call(this);
    }
  };

  clearCanvas = (context: CanvasRenderingContext2D): void => {
    context.clearRect(
      0,
      0,
      this.state.canvasPositionAndSize.width,
      this.state.canvasPositionAndSize.height
    );
  };

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
    this.props.displayedImage ? (
      <>
        {/* We have two canvases in order to be able to erase stuff. */}
        <div
          style={{
            pointerEvents: this.props.isActive ? "auto" : "none",
          }}
        >
          <BaseCanvas
            cursor="none"
            ref={(backgroundCanvas) => {
              this.backgroundCanvas = backgroundCanvas;
              this.baseCanvas = this.backgroundCanvas;
            }}
            name={`${this.name}-background`}
            scaleAndPan={this.props.scaleAndPan}
            setScaleAndPan={this.props.setScaleAndPan}
            canvasPositionAndSize={this.state.canvasPositionAndSize}
            setCanvasPositionAndSize={this.setCanvasPositionAndSize}
          />

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
            setScaleAndPan={this.props.setScaleAndPan}
            displayedImage={this.props.displayedImage}
            canvasPositionAndSize={this.state.canvasPositionAndSize}
            setCanvasPositionAndSize={this.setCanvasPositionAndSize}
          />

          <canvas
            style={{
              position: "absolute",
              top: this.state.canvasPositionAndSize.top,
              left: this.state.canvasPositionAndSize.left,
              width: this.state.canvasPositionAndSize.width,
              height: this.state.canvasPositionAndSize.height,
              pointerEvents: "none",
              display: "block",
            }}
            ref={(canvas) => {
              if (canvas) {
                this.cursorCtx = canvas.getContext("2d");
              }
            }}
          />
        </div>
      </>
    ) : null;
}

const CanvasFunction = (
  props: Omit<
    Props,
    | "brushRadius"
    | "isActive"
    | "annotationAlpha"
    | "annotationActiveAlpha"
    | "is3D"
    | "isSuper"
  >,
  ref: React.ForwardedRef<CanvasClass>
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

  // we also use the brushRadius and is3D that's in the store
  return (
    <CanvasClass
      isActive={isActive}
      is3D={paintbrush.is3D}
      isSuper={paintbrush.isSuper}
      activeToolbox={activeToolbox}
      mode={props.mode}
      setMode={props.setMode}
      annotationsObject={props.annotationsObject}
      displayedImage={props.displayedImage}
      scaleAndPan={props.scaleAndPan}
      setScaleAndPan={props.setScaleAndPan}
      brushRadius={paintbrush.brushRadius}
      annotationActiveAlpha={paintbrush.annotationActiveAlpha / 100}
      annotationAlpha={paintbrush.annotationAlpha / 100}
      redraw={props.redraw}
      sliceIndex={props.sliceIndex}
      setUIActiveAnnotationID={props.setUIActiveAnnotationID}
      setActiveToolbox={props.setActiveToolbox}
      readonly={props.readonly}
      ref={ref}
    />
  );
};

export const Canvas = forwardRef(CanvasFunction);
