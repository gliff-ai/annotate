import { ReactElement, useState, MouseEvent } from "react";
import {
  Card,
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
import { Annotations } from "@/annotation";
import { Annotation } from "@/annotation/interfaces";
import createStyles from "@mui/styles/createStyles";
import makeStyles from "@mui/styles/makeStyles";
import { AccordionSummaryProps } from "@mui/material/AccordionSummary";
import { styled } from "@mui/material/styles";

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
          tooltip={{ name: "Select A User" }}
          icon={icons.usersPage}
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
          .map((annotation, i, array) => (
            <Accordion
              disableGutters
              expanded={props.annotationsObject.getActiveAnnotationID() === i}
              onChange={(event, expanded) => {
                if (expanded) {
                  props.setActiveAnnotation(i);
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                className={classes.accordionSummary}
              >
                {`${layerTypeString(annotation)} ${
                  array
                    .filter(
                      (annotation2) =>
                        annotation2.toolbox === annotation.toolbox
                    )
                    .indexOf(annotation) + 1
                }`}
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
                  />
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
      </>
    </Popover>
  );
};
