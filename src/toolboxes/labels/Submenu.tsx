import { ReactElement, MouseEvent } from "react";
import { Card, MuiPopover } from "@gliff-ai/style";
import { Labels, Props as LabelsProps } from "./Labels";

interface Props extends LabelsProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClose: (event: MouseEvent) => void;
  defaultLabels: string[];
  restrictLabels: boolean;
  multiLabel: boolean;
}

export const Submenu = (props: Props): ReactElement => (
  <MuiPopover
    open={props.isOpen}
    anchorEl={props.anchorElement}
    onClose={props.onClose}
  >
    <Card title="Annotation Labels">
      <Labels
        annotationsObject={props.annotationsObject}
        activeAnnotationID={props.activeAnnotationID}
        defaultLabels={props.defaultLabels}
        restrictLabels={props.restrictLabels}
        multiLabel={props.multiLabel}
      />
    </Card>
  </MuiPopover>
);
