import {
  AnnotationsDataArray,
  Annotation,
  AnnotationParameters,
  ZTPoint,
  XYPoint,
  BrushStrokes,
} from "./interfaces";

export class Annotations {
  private data: AnnotationsDataArray;
  private activeAnnotationID: number;

  constructor() {
    this.data = [];
    this.activeAnnotationID = null;
  }

  addAnnotation = (
    toolbox: string,
    labels: string[] = [],
    spaceTimeInfo: ZTPoint = { z: 0, t: 0 },
    coordinates: XYPoint[] = [],
    brushStrokes: BrushStrokes[] = [],
    parameters: AnnotationParameters[] = []
  ): void => {
    this.activeAnnotationID =
      this.data.push({
        labels,
        toolbox,
        spaceTimeInfo,
        coordinates,
        brushStrokes,
        parameters,
      }) - 1;
  };

  addLabel = (activeAnnotation: number, newLabel: string): void => {
    this.data[activeAnnotation]["labels"].push(newLabel);
    // this.data[activeAnnotation]["labels"] = unique(this.data[activeAnnotation]["labels"]); // TODO
  };

  removeLabel = (activeAnnotation: number, existingLabel: string): void => {
    this.data[activeAnnotation]["labels"] = this.data[activeAnnotation][
      "labels"
    ].filter((label) => label != existingLabel);
  };

  getActiveAnnotationID = (): number => {
    return this.activeAnnotationID;
  };

  getActiveAnnotation = (): Annotation => {
    return this.data[this.activeAnnotationID];
  };

  length = (): number => {
    return this.data.length;
  };

  setAnnotationCoordinates = (newCoordinates: XYPoint[]): void => {
    this.data[this.activeAnnotationID]["coordinates"] = newCoordinates;
  };
}

export function canvasToImage(
  canvasX: number,
  canvasY: number,
  imageWidth: number,
  imageHeight: number,
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  },
  canvasPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  }
) {
  let { x: translateX, y: translateY, scale: scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  // transform from canvas space to original canvas space:
  let x = (canvasX - translateX) / scale;
  let y = (canvasY - translateY) / scale;

  // original canvas to image transform:
  x = (x / canvasPositionAndSize.width) * Math.min(imageWidth, imageHeight);
  y = (y / canvasPositionAndSize.height) * Math.min(imageWidth, imageHeight);

  if (imageWidth > imageHeight) {
    x += (imageWidth - imageHeight) / 2;
  } else if (imageHeight > imageWidth) {
    y += (imageHeight - imageWidth) / 2;
  }

  return { x: x, y: y };
}

export function imageToCanvas(
  imageX: number,
  imageY: number,
  imageWidth: number,
  imageHeight: number,
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  },
  canvasPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  }
) {
  let { x: translateX, y: translateY, scale: scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  let x = imageX,
    y = imageY;

  if (imageWidth > imageHeight) {
    x -= (imageWidth - imageHeight) / 2;
  } else if (imageHeight > imageWidth) {
    y -= (imageHeight - imageWidth) / 2;
  }

  //   console.log(x, y) // largest central square image space

  x = (canvasPositionAndSize.width * x) / Math.min(imageWidth, imageHeight);
  y = (canvasPositionAndSize.height * y) / Math.min(imageWidth, imageHeight);

  //   console.log(x, y) // original canvas space

  x = x * scale + translateX;
  y = y * scale + translateY;

  return { x: x, y: y };
}

export function imageToOriginalCanvas(
  imageX: number,
  imageY: number,
  imageWidth: number,
  imageHeight: number,
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  },
  canvasPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  }
) {
  let { x: translateX, y: translateY, scale: scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  let x = imageX,
    y = imageY;

  if (imageWidth > imageHeight) {
    x -= (imageWidth - imageHeight) / 2;
  } else if (imageHeight > imageWidth) {
    y -= (imageHeight - imageWidth) / 2;
  }

  x = (canvasPositionAndSize.width * x) / Math.min(imageWidth, imageHeight);
  y = (canvasPositionAndSize.height * y) / Math.min(imageWidth, imageHeight);

  return { x: x, y: y };
}

export function originalCanvasToMinimap(
  imageWidth: number,
  imageHeight: number,
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  },
  canvasPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  },
  minimapPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  }
) {
  let { x: translateX, y: translateY, scale: scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  let x = scaleAndPan.x,
    y = scaleAndPan.y;

  // move x and y to the largest central square
  if (canvasPositionAndSize.width > canvasPositionAndSize.height) {
    x -= (canvasPositionAndSize.width - canvasPositionAndSize.height) / 2;
  } else if (canvasPositionAndSize.height > canvasPositionAndSize.width) {
    y -= (canvasPositionAndSize.width - canvasPositionAndSize.height) / 2;
  }

  // convert width and height
  let viewfinderWidth = minimapPositionAndSize.width / scaleAndPan.scale;
  let viewfinderHeight = minimapPositionAndSize.width / scaleAndPan.scale;

  // convert X and Y into minimap space
  let viewfinderX =
    (viewfinderWidth * -x) /
    Math.min(canvasPositionAndSize.width, canvasPositionAndSize.height);
  let viewfinderY =
    (viewfinderHeight * -y) /
    Math.min(canvasPositionAndSize.width, canvasPositionAndSize.height);

  //   console.log(scaleAndPan.x, scaleAndPan.y, scaleAndPan.scale);
  //   console.log(viewfinderX, viewfinderY, viewfinderWidth, viewfinderHeight);

  return {
    x: viewfinderX,
    y: viewfinderY,
    width: viewfinderWidth,
    height: viewfinderHeight,
  };
}

export function minimapToOriginalCanvas(
  minimapX: number,
  minimapY: number,
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  },
  canvasPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  },
  minimapPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  }
) {
  let { x: translateX, y: translateY, scale: scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  // transform from canvas space to original canvas space:
  let x = minimapX; // * (canvasPositionAndSize.width / minimapPositionAndSize.width);
  let y = minimapY; // * (canvasPositionAndSize.height / minimapPositionAndSize.height);

  // original canvas to image transform:
  x =
    (x / minimapPositionAndSize.width) *
    Math.min(canvasPositionAndSize.width, canvasPositionAndSize.height);
  y =
    (y / minimapPositionAndSize.height) *
    Math.min(canvasPositionAndSize.width, canvasPositionAndSize.height);

  if (canvasPositionAndSize.width > canvasPositionAndSize.height) {
    x -= (canvasPositionAndSize.width - canvasPositionAndSize.height) / 2;
  } else if (canvasPositionAndSize.height > canvasPositionAndSize.width) {
    y -= (canvasPositionAndSize.height - canvasPositionAndSize.width) / 2;
  }

  return { x: x, y: y };
}
