import { UserAccess } from "@/ui";
import ReactDOM from "react-dom";
import { UserInterface } from "../src";
import loadImage from "./autoload";

const plugins = {
  "Example plug-in": [
    {
      type: "Javascript",
      name: "Example plug-in",
      tooltip: "Short description",
      onClick: function () {
        alert("Some plug-in action.");
        return Promise.resolve({});
      },
    },
  ],
};

loadImage("./zebrafish-heart.jpg").then(
  ({ slicesData, imageFileInfo }) => {
    ReactDOM.render(
      <UserInterface
        slicesData={slicesData}
        imageFileInfo={imageFileInfo}
        userAccess={UserAccess.Owner}
        plugins={plugins}
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
