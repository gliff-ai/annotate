import React from "React";
import {Component} from "React";

import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";

interface Props extends BaseProps {
    imgSrc?: string;
}

interface State {
  brightness: number;
  contrast: number;
}

export class BackgroundCanvas extends Component<Props> {
    private baseCanvas: any;
    // private canvasContainer: HTMLDivElement;
  
    // private canvasContext: CanvasRenderingContext2D;
    // private canvasObserver: ResizeObserver;
  
    // private coordSystem: CoordinateSystem;
  
    // private zoomExtents: Extents;
  
    constructor(props: Props) {
      super(props);
      this.imgSrc = props.imgSrc
      this.imgObj = ImageData()
      this.imgObj.src = this.imgSrc
     
    }

    private addImageToCanvas = (
        imgObj:ImageData
      ): void => {
        let width:number = imgObj.width
        let height:number = imgObj.height
        const imageData = this.baseCanvas.canvasContext.createImageData(width, height);
        imageData.data.set(array);
        this.baseCanvas.canvasContext.putImageData(imageData, 0, 0);
      };
      
    componentDidMount = (): void => {
        console.log("Mounted background");
        console.log(this.baseCanvas);
        console.log(this.baseCanvas?.canvas);
    }

    render() {
        return (<BaseCanvas 
            ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
            name="background" 
            zoomExtents={{min: 0.3, max: 3}}/>)

    }
}
