import * as React from "react";
import * as ReactDOM from "react-dom";

import {BaseCanvas} from "./baseCanvas";
import {BackgroundCanvas} from "./toolboxes/background/canvas";


ReactDOM.render(
  // <BaseCanvas name="cccc" zoomExtents={{min: 0.33, max: 3}} />,
  <BackgroundCanvas name="cccc" zoomExtents={{min: 0.33, max: 3}} imgSrc="./test.png" />,
  document.getElementById("react-container")
);
 