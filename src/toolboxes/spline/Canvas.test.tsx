import { Toolbox } from "@/Toolboxes";
import { render, screen } from "@testing-library/react";
import { Canvas } from "./Canvas";

const mockedsetUIActiveAnnotationID = jest.fn((number: number) => void
);

const mockedsetActiveToolbox = jest.fn(
  (tool: Toolbox) => void
);

 enum Mode {
  draw,
  select,
}

describe("Close Spline", () => {
  test("should render same text passed into title prop", () => {
    render(<Canvas activeToolbox={"spline"}
  mode = {Mode}
  annotationsObject = {}
  redraw = {3}
  sliceIndex = {4}
  setUIActiveAnnotationID = {mockedsetUIActiveAnnotationID}
  setActiveToolbox = {mockedsetActiveToolbox}
    
    />);
    // const h1Element = screen.getByText(/todo/i);
    // expect(h1Element).toBeInTheDocument();
    screen.debug();
  });
});
