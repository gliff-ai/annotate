import { render, fireEvent, screen } from "@testing-library/react";
import { Annotations } from "@/annotation";
import { Labels } from "./Labels";

let annotationsObject: Annotations;
const newLabel = "new-label";
const currLabel = "current-label";
const prevLabel = "previous-label";

describe("labels assignment", () => {
  beforeEach(() => {
    annotationsObject = new Annotations();
    annotationsObject.addAnnotation("paintbrush");
    annotationsObject.addLabel(currLabel); // current label

    render(
      <Labels
        activeAnnotationID={0}
        annotationsObject={annotationsObject}
        presetLabels={[currLabel, prevLabel]} // preset labels
        updatePresetLabels={jest.fn()}
      />
    );
  });

  test("current and previous labels are displayed correctly", () => {
    expect(annotationsObject.getLabels()).toEqual([currLabel]);

    expect(screen.queryByTestId(`add-${prevLabel}`)).toBeDefined();
    expect(screen.queryByTestId(`delete-${prevLabel}`)).toBeNull();

    expect(screen.queryByTestId(`add-${currLabel}`)).toBeNull();
    expect(screen.queryByTestId(`delete-${currLabel}`)).toBeDefined();

    expect(screen.queryByRole("span", { name: newLabel })).toBeNull();
  });

  test("add a new label", () => {
    fireEvent.change(screen.getByPlaceholderText("New Label"), {
      target: { value: newLabel },
    });
    fireEvent.click(screen.getByRole("button", { name: "add-new-label" }));

    expect(annotationsObject.getLabels()).toEqual([currLabel, newLabel]);
    expect(screen.queryByRole("span", { name: newLabel })).toBeDefined();
  });

  test("delete a label", () => {
    fireEvent.click(screen.getByTestId(`delete-${currLabel}`));

    expect(annotationsObject.getLabels()).toEqual([]);
    expect(screen.queryByTestId(`add-${currLabel}`)).toBeDefined();
    expect(screen.queryByTestId(`delete-${currLabel}`)).toBeNull();
  });

  test("add a preset label", () => {
    fireEvent.click(screen.getByTestId(`add-${prevLabel}`));

    expect(annotationsObject.getLabels()).toEqual([currLabel, prevLabel]);
    expect(screen.queryByTestId(`delete-${prevLabel}`)).toBeDefined();
    expect(screen.queryByTestId(`add-${prevLabel}`)).toBeNull();
  });
});
