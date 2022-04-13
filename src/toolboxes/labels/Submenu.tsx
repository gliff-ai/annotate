import { ReactElement, MouseEvent } from "react";
import { Grid, Typography, Card, Paper } from "@mui/material";
import { theme, Popover, IconButton, icons } from "@gliff-ai/style";
import makeStyles from "@mui/styles/makeStyles";
import { Labels, Props as LabelsProps } from "./Labels";
import { display } from "@mui/system";

const useStyles = makeStyles(() => ({
  annotationCard: {
    width: "271px",
    height: "fit-content",
  },
  annotationPaper: {
    padding: "10px",
    backgroundColor: `${theme.palette.primary.main} !important`,
    width: "271px",
  },
  annotationTypography: {
    display: "inline",
    fontWeight: 500,
  },
  annotationAvatar: {
    backgroundColor: theme.palette.primary.main,
    display: "inline",
  },
  labelsPaper: {
    padding: "15px",
  },
  svg: { width: "18px", height: "auto" },
}));

interface Props extends LabelsProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClose: (event: MouseEvent) => void;
  defaultLabels: string[];
  restrictLabels: boolean;
  multiLabel: boolean;
}

export const Submenu = (props: Props): ReactElement => {
  const classes = useStyles();

  return (
    <Popover
      title="Annotation Labels"
      TriggerButton={
        <IconButton
          tooltip={{
            name: "Open Popover",
          }}
          icon={icons.plugins}
          size="small"
          style={{ display: "none" }}
        />
      }
      // open={props.isOpen}
      // anchorEl={props.anchorElement}
      // onClose={props.onClose}
    >
      <Labels
        annotationsObject={props.annotationsObject}
        activeAnnotationID={props.activeAnnotationID}
        defaultLabels={props.defaultLabels}
        restrictLabels={props.restrictLabels}
        multiLabel={props.multiLabel}
      />
    </Popover>
  );
};
