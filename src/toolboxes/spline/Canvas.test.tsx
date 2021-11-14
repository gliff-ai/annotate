import { Toolbox } from "@/Toolboxes";
import { render, screen } from "@testing-library/react";
import { Canvas } from "./Canvas";

const mockedsetUIActiveAnnotationID = jest.fn((number: number) => void
);

const mockedsetActiveToolbox = jest.fn(
  (tool: Toolbox) => void
);





describe("Convert spline to paintbrush", () => {
  test("should render splines as paintbrush", () => {
    render(<Canvas 
  activeToolbox={"spline"}
  mode = {"draw"}
  annotationsObject = {}
  redraw = {3}
  sliceIndex = {4}
  setUIActiveAnnotationID = {mockedsetUIActiveAnnotationID}
  setActiveToolbox = {mockedsetActiveToolbox}
    
    />);
  
    screen.debug();
  });
});
