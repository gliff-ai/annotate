import { UserAccess } from "@/ui";
import ReactDOM from "react-dom";
import { UserInterface } from "../src";
import loadImage from "./autoload";

loadImage("./zebrafish-heart.jpg").then(
  ({ slicesData, imageFileInfo }) => {
    ReactDOM.render(
      <UserInterface
        slicesData={slicesData}
        imageFileInfo={imageFileInfo}
        userAccess={UserAccess.Owner}
      />,
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
