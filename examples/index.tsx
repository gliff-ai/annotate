import { UserAccess } from "@/ui";
import ReactDOM from "react-dom";
import { UserInterface } from "../src";
import loadImage from "./autoload";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { Annotations } from "../src";

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

Promise.all([
  loadImage("./zebrafish-heart.jpg"),
  fetch("annotation.json").then((response) => response.json()),
]).then(
  async ([{ slicesData, imageFileInfo }, annotation]) => {
    ReactDOM.render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <UserInterface
                slicesData={slicesData}
                imageFileInfo={imageFileInfo}
                userAccess={UserAccess.Owner}
                plugins={plugins}
                saveAnnotationsCallback={() => {}}
              />
            }
          />
          <Route
            path="/readonly"
            element={
              <UserInterface
                slicesData={slicesData}
                imageFileInfo={imageFileInfo}
                userAccess={UserAccess.Owner}
                plugins={plugins}
                readonly={true}
                annotationsObject={new Annotations(annotation[0])}
                annotationsObject2={new Annotations(annotation[1])}
                userAnnotations={{
                  "user1@gliff.ai": new Annotations(annotation[0]),
                  "user2@gliff.ai": new Annotations(annotation[1]),
                }}
                saveAnnotationsCallback={() => {}}
              />
            }
          />
        </Routes>
      </BrowserRouter>,
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
