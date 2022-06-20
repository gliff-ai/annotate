import { ReactElement, MouseEvent, useState } from "react";
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
import { Toolbox } from "@/Toolboxes";

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
    accordionDetails: {
      paddingTop: "0px",
      paddingBottom: "0px",
    },
    convertIcon: {
      border: "1px solid",
      borderColor: "#DADDE9",
      borderRadius: "9px",
      height: "40px",
      width: "40px",
      padding: "10px",
    },
    nameBox: {
      border: "1px solid",
      borderColor: "#DADDE9",
      borderRadius: "9px",
      height: "42px",
      verticalAlign: "middle",
      fontFamily: "Roboto",
      fontWeight: "400",
      fontSize: "0.875rem",
      lineHeight: "1.75",
      display: "flex",
      alignItems: "center",
      paddingLeft: "10px",
      paddingRight: "10px",
    },
  })
);

interface Props {
  annotationsObject: Annotations;
  annotationsObject2?: Annotations;
  usernames?: { user1: string; user2: string };
  setActiveAnnotation: (annotationsObject: Annotations, id: number) => void;
  handleOpen: (
    event?: MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
  setActiveToolbox: (tool: Toolbox) => void;
}

let refLayersPopoverButton: HTMLButtonElement;

const layerTypeString = (layer: Annotation) =>
  `${layer.toolbox.charAt(0).toUpperCase()}${layer.toolbox.slice(1)}`;

export const LayersPopover = (props: Props): ReactElement => {
  const [showUser1, setShowUser1] = useState<boolean>(true);
  const classes = useStyles();

  const annotationsObject = showUser1
    ? props.annotationsObject
    : props.annotationsObject2;

  return (
    <Popover
      title="Annotation Layers"
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      TriggerButton={
        <IconButton
          id="id-layers-button"
          tooltip={{ name: "Annotation Layers" }}
          icon={icons.layers}
          size="small"
          setRefCallback={(ref) => {
            refLayersPopoverButton = ref;
          }}
          onClick={() => {
            props.handleOpen()(refLayersPopoverButton);
          }}
        />
      }
    >
      <>
        {props.annotationsObject2 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div
              className={classes.nameBox}
              style={{
                backgroundColor: showUser1
                  ? theme.palette.primary.main
                  : "white",
              }}
            >
              {props.usernames.user1}
            </div>
            <img
              src={icons.convert}
              className={classes.convertIcon}
              onClick={() => {
                setShowUser1(!showUser1);
              }}
            />
            <div
              className={classes.nameBox}
              style={{
                backgroundColor: showUser1
                  ? "white"
                  : theme.palette.primary.main,
              }}
            >
              {props.usernames.user2}
            </div>
          </div>
        )}
        {annotationsObject.getAllAnnotations().map((annotation, i, array) => {
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
              expanded={annotationsObject.getActiveAnnotationID() === i}
              onChange={(event, expanded: boolean) => {
                if (expanded) {
                  props.setActiveAnnotation(annotationsObject, i);
                  props.setActiveToolbox(
                    annotationsObject.getAllAnnotations()[i].toolbox as Toolbox
                  );
                }
              }}
              key={name}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
