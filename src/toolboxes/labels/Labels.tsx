import {
  FunctionComponent,
  ChangeEvent,
  ReactElement,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Avatar,
  Chip,
  Divider,
  IconButton,
  InputBase,
  ListItemText,
  Typography,
} from "@mui/material";
import createStyles from "@mui/styles/createStyles";
import makeStyles from "@mui/styles/makeStyles";
import SVG from "react-inlinesvg";
import { theme, icons } from "@gliff-ai/style";
import { Annotations } from "@/annotation";

export interface Props {
  annotationsObject: Annotations;
  activeAnnotationID: number;
  defaultLabels: string[];
  restrictLabels: boolean;
  multiLabel: boolean;
}

const useStyles = makeStyles(() =>
  createStyles({
    listItem: {
      color: theme.palette.primary.main,
      fontSize: "14px",
    },
    list: { width: "100%" },
    inputBase: { marginRight: "55px", fontSize: "14px" },
    labelsChip: {
      margin: "5px",
      borderColor: theme.palette.primary.main,
      borderRadius: "9px",
      color: theme.palette.primary.main,
    },
    chipFont: {
      fontSize: "14px",
    },
    menuLabelsChip: {
      color: theme.palette.text.secondary,
      borderColor: theme.palette.text.secondary,
    },
    addButton: {
      position: "absolute !important" as "absolute",
      right: "18px",
    },
    divider: {
      width: "90%",
      marginTop: "inherit",
      marginLeft: "-1%",
    },
    svgSmall: { width: "10px", height: "100%" },
  })
);

export const Labels: FunctionComponent<Props> = ({
  annotationsObject,
  activeAnnotationID,
  defaultLabels,
  restrictLabels,
  multiLabel,
}: Props): ReactElement => {
  const classes = useStyles();

  // Get array with labels that are yet to be assigned.
  const getMenuLabels = useCallback(() => {
    const menuLabels = restrictLabels
      ? defaultLabels
      : [
          ...new Set(
            defaultLabels.concat(annotationsObject.getAllUniqueLabels())
          ),
        ];
    return menuLabels.filter(
      (label) => !annotationsObject.getLabels().includes(label)
    );
  }, [annotationsObject, restrictLabels, defaultLabels]);

  const [assignedLabels, setAssignedLabels] = useState(
    annotationsObject.getLabels()
  );
  const [menuLabels, setMenuLabels] = useState(defaultLabels);
  const [newLabel, setNewLabel] = useState("");

  function handleNewLabelChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    setNewLabel(event.target.value);
  }

  const updateAllLabels = useCallback(() => {
    const activeLabels = annotationsObject.getLabels(); // returns labels for the ACTIVE ANNOTATION, not all labels
    setAssignedLabels(activeLabels);
    setMenuLabels(getMenuLabels());
  }, [annotationsObject, getMenuLabels]);

  const handleAddLabel = (label: string) => (): void => {
    // Add a label to active annotation object and update some states.
    if (!multiLabel) {
      // if we're not allowing multiple labels per annotation, remove all currently assigned labels before adding this one:
      for (const oldLabel of assignedLabels) {
        annotationsObject.removeLabel(oldLabel);
      }
    }
    annotationsObject.addLabel(label);
    updateAllLabels();
    setNewLabel("");
  };

  const handleRemoveLabel = (label: string) => (): void => {
    // Remove a label from active annotation object and update some states.
    annotationsObject.removeLabel(label);
    updateAllLabels();
  };

  useEffect(() => {
    // Re-render assigned labels at change of active annotation ID.
    updateAllLabels();
  }, [activeAnnotationID, updateAllLabels]);

  return (
    <>
      {!restrictLabels && (
        <>
          <InputBase
            className={classes.inputBase}
            placeholder="New Label"
            value={newLabel}
            onChange={(e) => handleNewLabelChange(e)}
            autoFocus
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddLabel(newLabel)();
              }
            }}
            id="id-labels-input"
          />
          <IconButton
            className={classes.addButton}
            type="submit"
            aria-label="add-new-label"
            onClick={handleAddLabel(newLabel)}
            edge="end"
            size="small"
          >
            <SVG src={icons.add} width="12px" height="100%" fill="#A1A1A1" />
          </IconButton>
          <Divider className={classes.divider} />
        </>
      )}

      {assignedLabels.map((label) => (
        <Chip
          key={`chip-delete-${label}`}
          avatar={
            <Avatar
              variant="circular"
              style={{ cursor: "pointer" }}
              onClick={handleRemoveLabel(label)}
              data-testid={`delete-${label}`}
            >
              <SVG
                src={icons.removeLabel}
                className={classes.svgSmall}
                fill={theme.palette.primary.main}
              />
            </Avatar>
          }
          className={classes.labelsChip}
          label={<Typography className={classes.chipFont}>{label}</Typography>}
          variant="outlined"
        />
      ))}

      {menuLabels.map((label) => (
        <Chip
          key={`chip-add-${label}`}
          avatar={
            <Avatar
              variant="circular"
              style={{ cursor: "pointer" }}
              onClick={handleAddLabel(label)}
              data-testid={`add-${label}`}
            >
              <SVG
                src={icons.add}
                className={classes.svgSmall}
                fill={theme.palette.text.secondary}
              />
            </Avatar>
          }
          className={[classes.labelsChip, classes.menuLabelsChip].join(" ")}
          label={
            <ListItemText
              primary={
                <Typography className={classes.chipFont}>{label}</Typography>
              }
            />
          }
          variant="outlined"
        />
      ))}
    </>
  );
};
