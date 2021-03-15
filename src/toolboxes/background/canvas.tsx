import React from "React";
import {Component} from "React";

import { BaseCanvas, Props as BaseProps } from "../../baseCanvas";

interface Props extends BaseProps {
  image?: ImageData;
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
  
    // constructor(props: Props) {
    //   super(props);
    //   this.name = props.name;
    //   this.zoomExtents = props.zoomExtents;
    //   this.coordSystem = new CoordinateSystem({
    //     scaleExtents: this.zoomExtents,
    //     documentSize: { width: 400, height: 400 },
    //   });
    //   this.coordSystem.attachViewChangeListener(this.applyView.bind(this));
    // }

    // private addImageToCanvas = (
    //     array: Uint8Array | Uint8ClampedArray,
    //     width: number,
    //     height: number
    //   ): void => {
    //     const imageData = this.canvasContext.createImageData(width, height);
    //     imageData.data.set(array);
    //     this.canvasContext.putImageData(imageData, 0, 0);
    //   };
      
    componentDidMount = (): void => {
        console.log("Mounted background");
        console.log(this.baseCanvas);
        console.log(this.baseCanvas?.current);
    }

    render() {
        return (<BaseCanvas 
            ref={(baseCanvas) => (this.baseCanvas = baseCanvas)}
            name="background" zoomExtents={{min: 0.3, max: 3}}/>)

    }
}
