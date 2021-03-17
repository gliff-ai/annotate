import {
  AnnotationsDataArray,
  Annotation,
  AnnotationParameters,
  ZTPoint,
  XYPoint,
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
    parameters: AnnotationParameters[] = []
  ): void => {
    this.activeAnnotationID =
      this.data.push({
        labels,
        toolbox,
        spaceTimeInfo,
        coordinates,
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
  scaleAndPan: any
) {
  let { x: translateX, y: translateY, scale: scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  // transform from canvas space to original canvas space:
  let x = (canvasX - translateX) / scale;
  let y = (canvasY - translateY) / scale;

  // original canvas to image transform:
  x = (x / 400) * Math.min(imageWidth, imageHeight);
  y = (y / 400) * Math.min(imageWidth, imageHeight);

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
  scaleAndPan: any
) {
  let { x: translateX, y: translateY, scale: scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  let x = imageX,
    y = imageY;

  //   console.log("Beginning imageToCanvas")

  //   console.log(x, y) // image space

  if (imageWidth > imageHeight) {
    x -= (imageWidth - imageHeight) / 2;
  } else if (imageHeight > imageWidth) {
    y -= (imageHeight - imageWidth) / 2;
  }

  //   console.log(x, y) // largest central square image space

  x = (400 * x) / Math.min(imageWidth, imageHeight);
  y = (400 * y) / Math.min(imageWidth, imageHeight);

  //   console.log(x, y) // original canvas space

  x = x * scale + translateX;
  y = y * scale + translateY;

  //   console.log(x, y) // canvas space

  return { x: x, y: y };
}

export function imageToOriginalCanvas(
  imageX: number,
  imageY: number,
  imageWidth: number,
  imageHeight: number,
  scaleAndPan: any
) {
  let { x: translateX, y: translateY, scale: scale } = scaleAndPan; // destructuring: https://2ality.com/2014/06/es6-multiple-return-values.html

  let x = imageX,
    y = imageY;

  //   console.log("Beginning imageToCanvas");

  //   console.log(x, y); // image space

  if (imageWidth > imageHeight) {
    x -= (imageWidth - imageHeight) / 2;
  } else if (imageHeight > imageWidth) {
    y -= (imageHeight - imageWidth) / 2;
  }

  //   console.log(x, y); // largest central square image space

  x = (400 * x) / Math.min(imageWidth, imageHeight);
  y = (400 * y) / Math.min(imageWidth, imageHeight);

  //   console.log(x, y); // original canvas space

  return { x: x, y: y };
}
