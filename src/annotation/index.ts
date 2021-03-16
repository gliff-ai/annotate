import {
  Annotations as AnnotationsType,
   Annotation,
  ZTPoint,
  XYPoint,
} from "./interfaces";
export { AnnotationParameters } from "./interfaces";

export class Annotations {
  private data: AnnotationsType;
  private activeAnnotationID: number;

  constructor() {
    this.data = [];
    this.activeAnnotationID = null;
  }

  addAnnotation = (
    toolbox: string,
    labels: string[] = [],
    spaceTimeInfo: ZTPoint = { z: 0, t: 0 },
    coordinates:XYPoint[]  = null,
    parameters:AnnotationParameters[]  = null

  ):void => {
    this.activeAnnotationID = this.data.push({ labels, toolbox, spaceTimeInfo, coordinates, parameters })
  };


  addLabel = (activeAnnotation: number, newLabel: string):void => {
    this.data[activeAnnotation]["labels"].push(newLabel);
    // this.data[activeAnnotation]["labels"] = unique(this.data[activeAnnotation]["labels"]); // TODO
  };

  removeLabel = (activeAnnotation: number, existingLabel: string):void => {
    this.data[activeAnnotation]["labels"] = this.data[activeAnnotation]["labels"].filter(
      (label) => label != existingLabel
    );
  };

   

  getActiveAnnotationID = ():number => {
    return this.activeAnnotationID

  }

  getActiveAnnotation = ():Annotation => {
    return this.data[this.activeAnnotationID]
  }



  length = ():number => {
    return this.data.length
  }

  setAnnotationCoordinates = (newCoordinates:XYPoint[]) :void => {
    this.data[this.activeAnnotationID]["coordinates"] = newCoordinates;
  };


}
