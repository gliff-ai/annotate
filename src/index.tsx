import * as React from "react";
import * as ReactDOM from "react-dom";

import {BaseCanvas} from "./baseCanvas";
import {BackgroundCanvas} from "./toolboxes/background/canvas";
    // change the zoom after five seconds

let i = 1;
let scale = { scale: i, x: 1, y: 1 }

    setInterval(() => {
      console.log(`ZOOMING IN x${i}`);

        scale = { scale: i, x: 1, y: 1 }
        console.log(scale)
      i++;
    }, 5000);

ReactDOM.render(
  // <BaseCanvas name="cccc" zoomExtents={{min: 0.33, max: 3}} />,
  <BackgroundCanvas name="cccc" zoomExtents={{min: 0.33, max: 3}} scaleAndPan={scale} imgSrc="../public/test.png" />,
  document.getElementById("react-container")
);
