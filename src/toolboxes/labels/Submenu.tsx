import { ReactElement, MouseEvent } from "react";
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
import { imgSrc } from "@/imgSrc";

const useStyles = makeStyles((theme: Theme) => ({
  annotationCard: {
    width: "271px",
    height: "fit-content",
  },
  annotationPaper: {
    padding: "10px",
    backgroundColor: theme.palette.primary.main,
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
}

export const Submenu = (props: Props): ReactElement => {
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
            Annotation Labels
          </Typography>
        </Paper>
        <Paper elevation={0} square className={classes.labelsPaper}>
          <Grid>
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
