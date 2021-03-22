import {
  AnnotationsDataArray,
  Annotation,
  AnnotationParameters,
  ZTPoint,
  XYPoint,
  BrushStrokes,
  PositionAndSize,
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

  getAllAnnotations = (): AnnotationsDataArray => {
    return this.data;
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
): XYPoint {
  const { x: translateX, y: translateY, scale: scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  // transform from canvas space to original canvas space:
  let x = canvasX - translateX;
  let y = canvasY - translateY;
  // scale towards center of image:
  x += (canvasPositionAndSize.width / 2 - x) * (1 - 1 / scale);
  y += (canvasPositionAndSize.height / 2 - y) * (1 - 1 / scale);

  // chop off the transparent bars so that canvas space has the same aspect ratio as image space:
  let imageScalingFactor = Math.min(
    canvasPositionAndSize.height / imageHeight,
    canvasPositionAndSize.width / imageWidth
  );
  if (imageScalingFactor * imageWidth < canvasPositionAndSize.width) {
    // vertical bars either side
    x -= (canvasPositionAndSize.width - imageScalingFactor * imageWidth) / 2;
  } else if (imageScalingFactor * imageHeight < canvasPositionAndSize.height) {
    // horizontal bars top and bottom
    y -= (canvasPositionAndSize.height - imageScalingFactor * imageHeight) / 2;
  }

  // unscale the image:
  x = x / imageScalingFactor;
  y = y / imageScalingFactor;

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
): XYPoint {
  const { x: translateX, y: translateY, scale: scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  let x = imageX,
    y = imageY;

  // apply image scaling factor:
  let imageScalingFactor = Math.min(
    canvasPositionAndSize.height / imageHeight,
    canvasPositionAndSize.width / imageWidth
  );
  x = x * imageScalingFactor;
  y = y * imageScalingFactor;

  // apply transparent bars to make the canvas the correct size:
  if (imageScalingFactor * imageWidth < canvasPositionAndSize.width) {
    x += (canvasPositionAndSize.width - imageScalingFactor * imageWidth) / 2;
  } else if (imageScalingFactor * imageHeight < canvasPositionAndSize.height) {
    y += (canvasPositionAndSize.height - imageScalingFactor * imageHeight) / 2;
  }

  // now in original canvas space, scale and translate to get canvas space:
  x = x + (x - canvasPositionAndSize.width / 2) * (scale - 1) + translateX;
  y = y + (y - canvasPositionAndSize.height / 2) * (scale - 1) + translateY;
  //      ^------------ scaling away from center ------------^

  return { x: x, y: y };
}

export function getMinimapViewFinder(
  imageWidth: number,
  imageHeight: number,
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  },
  canvasPositionAndSize: PositionAndSize,
  minimapPositionAndSize: PositionAndSize
): PositionAndSize {
  // transform canvas corners into image space:
  let topLeft: XYPoint = canvasToImage(
    0,
    0,
    imageWidth,
    imageHeight,
    scaleAndPan,
    canvasPositionAndSize
  );
  let bottomRight: XYPoint = canvasToImage(
    canvasPositionAndSize.width,
    canvasPositionAndSize.height,
    imageWidth,
    imageHeight,
    scaleAndPan,
    canvasPositionAndSize
  );

  // clip:
  topLeft = {
    x: Math.max(0, topLeft.x),
    y: Math.max(0, topLeft.y),
  };
  bottomRight = {
    x: Math.min(imageWidth, bottomRight.x),
    y: Math.min(imageHeight, bottomRight.y),
  };

  // scale down to minimap size:
  let scalingFactor = Math.min(
    minimapPositionAndSize.height / imageHeight,
    minimapPositionAndSize.width / imageWidth
  );
  topLeft = { x: topLeft.x * scalingFactor, y: topLeft.y * scalingFactor };
  bottomRight = {
    x: bottomRight.x * scalingFactor,
    y: bottomRight.y * scalingFactor,
  };

  // chop off ears:
  if (bottomRight.x < minimapPositionAndSize.width) {
    topLeft.x += (minimapPositionAndSize.width - bottomRight.x) / 2;
    bottomRight.x += (minimapPositionAndSize.width - bottomRight.x) / 2;
  } else if (bottomRight.y < minimapPositionAndSize.height) {
    topLeft.y += (minimapPositionAndSize.height - bottomRight.y) / 2;
    bottomRight.y += (minimapPositionAndSize.height - bottomRight.y) / 2;
  }

  console.log(topLeft, bottomRight);

  return {
    left: topLeft.x,
    top: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
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
  canvasPositionAndSize: PositionAndSize,
  minimapPositionAndSize: PositionAndSize
): XYPoint {
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
