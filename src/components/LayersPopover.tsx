import { ReactElement, MouseEvent } from "react";
import {
  Popover,
  IconButton,
  icons,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Typography,
  theme,
} from "@gliff-ai/style";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import createStyles from "@mui/styles/createStyles";
import makeStyles from "@mui/styles/makeStyles";
import { Annotations } from "@/annotation";
import { Annotation } from "@/annotation/interfaces";

const useStyles = makeStyles(() =>
  createStyles({
    labelsChip: {
      margin: "5px",
      borderColor: theme.palette.primary.main,
      borderRadius: "9px",
      color: theme.palette.primary.main,
    },
    chipFont: {
      fontSize: "14px",
    },
    accordionSummary: {
      marginTop: "5px",
    },
    accordionDetails: {
      paddingTop: "0px",
      paddingBottom: "0px",
    },
  })
);

interface Props {
  annotationsObject: Annotations;
  setActiveAnnotation: (id: number) => void;
  handleOpen: (
    event?: MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
}

let refBackgroundSettingsPopover: HTMLButtonElement;

const layerTypeString = (layer: Annotation) =>
  `${layer.toolbox.charAt(0).toUpperCase()}${layer.toolbox.slice(1)}`;

export const LayersPopover = (props: Props): ReactElement => {
  const classes = useStyles();

  return (
    <Popover
      title="Annotation Layers"
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      TriggerButton={
        <IconButton
          tooltip={{ name: "Annotation Layers" }}
          icon={icons.layers}
          size="small"
          setRefCallback={(ref) => {
            refBackgroundSettingsPopover = ref;
          }}
          onClick={() => {
            props.handleOpen()(refBackgroundSettingsPopover);
          }}
        />
      }
    >
      <>
        {props.annotationsObject
          .getAllAnnotations()
          .map((annotation, i, array) => {
            const name = `${layerTypeString(annotation)} ${
              array
                .filter(
                  (annotation2) => annotation2.toolbox === annotation.toolbox
                )
                .indexOf(annotation) + 1
            }`;

            return (
              <Accordion
                disableGutters
                expanded={props.annotationsObject.getActiveAnnotationID() === i}
                onChange={(event, expanded) => {
                  if (expanded) {
                    props.setActiveAnnotation(i);
                  }
                }}
                key={name}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  className={classes.accordionSummary}
                >
                  {name}
                </AccordionSummary>
                <AccordionDetails className={classes.accordionDetails}>
                  {annotation.labels.map((label) => (
                    <Chip
                      className={classes.labelsChip}
                      label={
                        <Typography className={classes.chipFont}>
                          {label}
                        </Typography>
                      }
                      variant="outlined"
                      key={`${name}-${label}`}
                    />
                  ))}
                </AccordionDetails>
              </Accordion>
            );
          })}
      </>
    </Popover>
  );
};
