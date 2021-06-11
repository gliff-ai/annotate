import * as React from "react";
import * as ReactDOM from "react-dom";

import UserInterface from "@/ui";

import loadImage from "./autoload";

loadImage("zebrafish-heart.jpg").then(
  ({ slicesData, imageFileInfo }) => {
    ReactDOM.render(
      <UserInterface slicesData={slicesData} imageFileInfo={imageFileInfo} />,
      document.getElementById("react-container")
    );
  },
  () => {
    ReactDOM.render(
      <UserInterface />,
      document.getElementById("react-container")
    );
  }
);
