import React, { ReactElement } from "react";
import {
  Grid,
  Typography,
  Avatar,
  Popover,
  Card,
  Paper,
  makeStyles,
  Theme,
} from "@material-ui/core";
import SVG from "react-inlinesvg";
import { Labels, Props as LabelsProps } from "./Labels";

const useStyles = makeStyles((theme: Theme) => ({
  annotationCard: {
    width: "271px",
    height: "375px",
  },
  annotationPaper: {
    padding: "10px",
    backgroundColor: theme.palette.primary.main,
    width: "271px",
  },
  annotationTypography: {
    display: "inline",
    fontSize: "21px",
    marginRight: "125px",
  },
  annotationAvatar: {
    backgroundColor: theme.palette.primary.main,
    display: "inline",
  },
  svg: { width: "18px", height: "auto" },
}));

interface Props extends LabelsProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClose: (event: React.MouseEvent) => void;
}

export const LabelsPopover = (props: Props): ReactElement => {
  const classes = useStyles();

  return (
    <Popover
      open={props.isOpen}
      anchorEl={props.anchorElement}
      onClose={props.onClose}
    >
      <Card className={classes.annotationCard}>
        <Paper
          elevation={0}
          variant="outlined"
          square
          className={classes.annotationPaper}
        >
          <Typography className={classes.annotationTypography}>
            Annotation
          </Typography>
          <Avatar className={classes.annotationAvatar}>
            <SVG
              src={require("../../assets/pin-icon.svg") as string}
              className={classes.svg}
            />
          </Avatar>
        </Paper>
        <Paper elevation={0} square>
          <Grid container justify="center">
            <Labels
              annotationsObject={props.annotationsObject}
              activeAnnotationID={props.activeAnnotationID}
              presetLabels={props.presetLabels}
              updatePresetLabels={props.updatePresetLabels}
            />
          </Grid>
        </Paper>
      </Card>
    </Popover>
  );
};
