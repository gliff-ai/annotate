import * as React from "react";
import * as ReactDOM from "react-dom";

import {BaseCanvas} from "./baseCanvas";


ReactDOM.render(
  <BaseCanvas name="cccc" zoomExtents={{min: 0.33, max: 3}} />,
  document.getElementById("react-container")
);
