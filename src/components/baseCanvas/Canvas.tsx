import { Component, ReactNode, MouseEvent } from "react";

import { XYPoint, PositionAndSize } from "@/annotation/interfaces";
import { isMacLookup } from "@/keybindings";

import { canvasToImage, touchPointsToScaleAndPan } from "./transforms";

export interface Props {
  name?: string;
  // not used in this class but used by all the other Canvas classes that extend this Props type
  /* eslint-disable react/no-unused-prop-types */
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  };
  setScaleAndPan: (scaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }) => void;
  cursor?: "crosshair" | "move" | "pointer" | "none" | "not-allowed";
  onClick?: (x: number, y: number, isCTRL?: boolean) => void;
  onMouseDown?: (x: number, y: number) => void;
  onTouchStart?: (x: number, y: number) => void;
  onTouchMove?: (x: number, y: number) => void;
  onTouchEnd?: (x: number, y: number) => void;
  onMouseMove?: (x: number, y: number) => void;
  onMouseUp?: (x: number, y: number) => void;
  onContextMenu?: (x: number, y: number) => void;
  canvasPositionAndSize: PositionAndSize;
  setCanvasPositionAndSize?: (canvasPositionAndSize: PositionAndSize) => void;
  displayedImage?: ImageBitmap;
}

export class BaseCanvas extends Component<Props> {
  public static defaultProps: Omit<
    Props,
    "scaleAndPan" | "canvasPositionAndSize" | "setScaleAndPan"
  > = {
    name: "BaseCanvas",
    cursor: "none",
    onClick: null,
    onMouseDown: null,
    onTouchStart: null,
    onTouchMove: null,
    onTouchEnd: null,
    onMouseMove: null,
    onMouseUp: null,
    onContextMenu: null,
    setCanvasPositionAndSize: null,
    displayedImage: null,
  };

  private canvas: HTMLCanvasElement;

  private canvasContainer: HTMLDivElement;

  public canvasContext: CanvasRenderingContext2D;

  private canvasObserver: ResizeObserver;

  private pinchZoomImagePoints: { image1: XYPoint; image2: XYPoint }; // image coordinates of initial touch points during pinch-to-zoom

  public clearWindow = (): void => {
    this.canvasContext.save();

    try {
      this.canvasContext.clearRect(
        0,
        0,
        this.canvasContext.canvas.width,
        this.canvasContext.canvas.height
      );
    } finally {
      this.canvasContext.restore();
    }
  };

  componentDidUpdate = (): void => {
    this.applyView();
  };

  private applyView = (): void => {
    this.clearWindow();
  };

  private handleCanvasResize = (entries: ResizeObserverEntry[]): void => {
    entries.forEach(({ contentRect: { width, height } }) => {
      this.setCanvasSize(width, height);
    });
  };

  private setCanvasSize = (width: number, height: number): void => {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.props?.setCanvasPositionAndSize?.({ width, height });
  };

  componentDidMount = (): void => {
    this.canvasObserver = new ResizeObserver((entries: ResizeObserverEntry[]) =>
      this.handleCanvasResize(entries)
    );

    this.canvasObserver.observe(this.canvasContainer);
  };

  componentWillUnmount = (): void => {
    this.canvasObserver.unobserve(this.canvasContainer);
  };

  windowToCanvas = (e: Partial<MouseEvent>): XYPoint => {
    // returns the mouse coordinates from e, transformed from window to canvas space
    const x = e.clientX - this.canvas.getBoundingClientRect().left;
    const y = e.clientY - this.canvas.getBoundingClientRect().top;

    return { x, y };
  };

  onClickHandler = (e: MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);
    const isCTRL = isMacLookup ? e.metaKey : e.ctrlKey;

    if (this.props.onClick) {
      this.props.onClick(x, y, isCTRL);
    }
  };

  onMouseDownHandler = (e: MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

    if (this.props.onMouseDown) {
      this.props.onMouseDown(x, y);
    }
  };

  onTouchStartHandler = (e: React.TouchEvent<HTMLCanvasElement>): void => {
    if (e.touches.length === 1) {
      const { x, y } = this.windowToCanvas({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      });

      if (this.props.onMouseDown) {
        this.props.onMouseDown(x, y);
      }
    } else if (e.touches.length === 2) {
      const canvas1 = this.windowToCanvas({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      });
      const canvas2 = this.windowToCanvas({
        clientX: e.touches[1].clientX,
        clientY: e.touches[1].clientY,
      });
      this.pinchZoomImagePoints = {
        image1: canvasToImage(
          canvas1.x,
          canvas1.y,
          this.props.displayedImage.width,
          this.props.displayedImage.height,
          this.props.scaleAndPan,
          this.props.canvasPositionAndSize
        ),
        image2: canvasToImage(
          canvas2.x,
          canvas2.y,
          this.props.displayedImage.width,
          this.props.displayedImage.height,
          this.props.scaleAndPan,
          this.props.canvasPositionAndSize
        ),
      };
      if (
        this.props.onMouseDown &&
        e.touches.length !== e.changedTouches.length // true if the fingers DON'T go down at the same time
      ) {
        // this will cause PaintbrushCanvas to abort the current brushstroke (the actual coordinates don't matter):
        this.props.onMouseDown(canvas2.x, canvas2.y);
      }
    }
  };

  onMouseMoveHandler = (e: MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

    if (this.props.onMouseMove) {
      this.props.onMouseMove(x, y);
    }
  };

  onTouchMovehandler = (e: React.TouchEvent<HTMLCanvasElement>): void => {
    if (e.touches.length === 1) {
      const { x, y } = this.windowToCanvas({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      });
      if (this.props.onMouseMove) {
        this.props.onMouseMove(x, y);
      }
    } else if (e.touches.length === 2) {
      const canvas1 = this.windowToCanvas({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      });
      const canvas2 = this.windowToCanvas({
        clientX: e.touches[1].clientX,
        clientY: e.touches[1].clientY,
      });
      this.props.setScaleAndPan(
        touchPointsToScaleAndPan(
          canvas1,
          canvas2,
          this.pinchZoomImagePoints.image1,
          this.pinchZoomImagePoints.image2,
          this.props.displayedImage.width,
          this.props.displayedImage.height,
          this.props.canvasPositionAndSize
        )
      );
    }
  };

  onMouseUpHandler = (e: MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

    if (this.props.onMouseUp) {
      this.props.onMouseUp(x, y);
    }
  };

  onTouchEndHandler = (e: React.TouchEvent<HTMLCanvasElement>): void => {
    const { x, y } = this.windowToCanvas({
      clientX: e.changedTouches[0].clientX,
      clientY: e.changedTouches[0].clientY,
    });
    if (this.props.onMouseUp) {
      this.props.onMouseUp(x, y);
    }
  };

  onContextMenuHandler = (e: MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

    // x and y are now in canvas space
    if (this.props.onContextMenu) {
      this.props.onContextMenu(x, y);
    }
  };

  render = (): ReactNode => (
    <div
      ref={(canvasContainer) => {
        this.canvasContainer = canvasContainer;
      }}
      style={{
        pointerEvents: "inherit",
        display: "block",
        touchAction: "none",
        width: "100%",
        height: "100%",
        cursor: this.props.cursor || "pointer",
        left: this.props.canvasPositionAndSize.left,
        bottom: "0px",
        position: "absolute",
      }}
    >
      <canvas
        style={{ pointerEvents: "inherit" }}
        onClick={this.onClickHandler}
        onMouseDown={this.onMouseDownHandler}
        onTouchStart={this.onTouchStartHandler}
        onMouseMove={this.onMouseMoveHandler}
        onTouchMove={this.onTouchMovehandler}
        onMouseUp={this.onMouseUpHandler}
        onTouchEnd={this.onTouchEndHandler}
        key={this.props.name}
        id={`${this.props.name}-canvas`}
        ref={(canvas) => {
          if (canvas) {
            // Keep this as it is initially null
            this.canvas = canvas;
            this.canvasContext = canvas.getContext("2d");
          }
        }}
      />
    </div>
  );
}
