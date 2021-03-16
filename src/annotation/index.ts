import {
  Annotations as AnnotationsType,
  AnnotationVector,
  ZTPoint,
} from "./interfaces";
export { AnnotationParameters } from "./interfaces";

export class Annotations {
  private data: AnnotationsType;

  constructor() {
    this.data = [];
  }

  addLayer = (
    layer: number,
    toolbox: string,
    labels: string[] = [],
    spaceTimeInfo: ZTPoint = { z: 0, t: 0 },
    annotation: AnnotationVector = null
  ) => {
    this.data[layer] = { labels, toolbox, spaceTimeInfo, annotation };
  };

  addLabel = (layer: number, newLabel: string) => {
    this.data[layer]["labels"].push(newLabel);
    // this.data[layer]["labels"] = unique(this.data[layer]["labels"]); // TODO
  };

  removeLabel = (layer: number, existingLabel: string) => {
    this.data[layer]["labels"] = this.data[layer]["labels"].filter(
      (label) => label != existingLabel
    );
  };

  setAnnotation = (layer: number, newAnnotation: AnnotationVector) => {
    this.data[layer]["annotation"] = newAnnotation;
  };
}
