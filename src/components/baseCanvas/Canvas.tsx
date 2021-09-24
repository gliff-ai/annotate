import { Component, ReactNode, MouseEvent } from "react";

import { XYPoint, PositionAndSize } from "@/annotation/interfaces";

export interface Props {
  name?: string;
  zoomExtents?: {
    min: number;
    max: number;
  };
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  };
  cursor?: "crosshair" | "move" | "pointer" | "none" | "not-allowed";
  onClick?: (x: number, y: number, isCTRL?: boolean) => void;
  onMouseDown?: (x: number, y: number) => void;
  onTouchStart?: (x: number, y: number) => void;
  onMouseMove?: (x: number, y: number) => void;
  onMouseUp?: (x: number, y: number) => void;
  onContextMenu?: (x: number, y: number) => void;
  canvasPositionAndSize: PositionAndSize;
  setCanvasPositionAndSize?: (canvasPositionAndSize: PositionAndSize) => void;
  displayedImage?: ImageBitmap;
}

export class BaseCanvas extends Component<Props> {
  private canvas: HTMLCanvasElement;

  private canvasContainer: HTMLDivElement;

  public canvasContext: CanvasRenderingContext2D;

  private canvasObserver: ResizeObserver;

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
    const isCTRL = e.ctrlKey;

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
    const { x, y } = this.windowToCanvas({
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY,
    });

    if (this.props.onMouseDown) {
      this.props.onMouseDown(x, y);
    }
  };

  onMouseMoveHandler = (e: MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

    if (this.props.onMouseMove) {
      this.props.onMouseMove(x, y);
    }
  };

  onMouseUpHandler = (e: MouseEvent): void => {
    const { x, y } = this.windowToCanvas(e);

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
        marginTop: "30px",
      }}
    >
      <canvas
        style={{ pointerEvents: "inherit" }}
        onClick={this.onClickHandler}
        onMouseDown={this.onMouseDownHandler}
        onTouchStart={this.onTouchStartHandler}
        onMouseMove={this.onMouseMoveHandler}
        onMouseUp={this.onMouseUpHandler}
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
