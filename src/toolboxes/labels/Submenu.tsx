import { ReactElement } from "react";
import { Card, Popper } from "@gliff-ai/style";
import { Labels, Props as LabelsProps } from "./Labels";

interface Props extends LabelsProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  handleClickAway: () => void;
  defaultLabels: string[];
  restrictLabels: boolean;
  multiLabel: boolean;
  isPinned: boolean;
  handlePin: () => void;
}

export const Submenu = (props: Props): ReactElement => (
  <Popper
    open={props.isOpen}
    anchorEl={props.anchorElement}
    handleClickAway={props.handleClickAway}
    el={
      <Card
        title="Annotation Labels"
        isPinned={props.isPinned}
        handlePin={props.handlePin}
      >
        <Labels
          annotationsObject={props.annotationsObject}
          activeAnnotationID={props.activeAnnotationID}
          defaultLabels={props.defaultLabels}
          restrictLabels={props.restrictLabels}
          multiLabel={props.multiLabel}
        />
      </Card>
    }
  />
);
