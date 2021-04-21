import * as React from "react";
import * as ReactDOM from "react-dom";

import { UserInterface } from "@/ui";

import loadImage from "./autoload";

loadImage("zebrafish-heart.jpg").then(
  (slicesData) => {
    ReactDOM.render(
      <UserInterface slicesData={slicesData} />,
      document.getElementById("react-container")
    );
  },
  (e) => {
    ReactDOM.render(
      <UserInterface />,
      document.getElementById("react-container")
    );
  }
);
