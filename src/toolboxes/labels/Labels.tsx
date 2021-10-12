import {
  FunctionComponent,
  ChangeEvent,
  ReactElement,
  useState,
  useEffect,
} from "react";

import {
  Avatar,
  Chip,
  createStyles,
  Divider,
  IconButton,
  InputBase,
  ListItemText,
  makeStyles,
  Typography,
} from "@material-ui/core";

import SVG from "react-inlinesvg";

import { theme, icons } from "@gliff-ai/style";

import { Annotations } from "@/annotation";

export interface Props {
  annotationsObject: Annotations;
  presetLabels: string[];
  updatePresetLabels: (label: string) => void;
  activeAnnotationID: number;
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

    divider: {
      width: "97%",
      marginTop: "inherit",
      marginLeft: "-1%",
    },
    svgSmall: { width: "10px", height: "100%" },
  })
);

export const Labels: FunctionComponent<Props> = ({
  annotationsObject,
  presetLabels,
  updatePresetLabels,
  activeAnnotationID,
}: Props): ReactElement => {
  const classes = useStyles();

  const [assignedLabels, setAssignedLabels] = useState(
    annotationsObject.getLabels()
  );

  function getMenuLabels(labels: string[]): string[] {
    // Get array with labels that are yet to be assigned.
    return presetLabels.filter((label) => !labels.includes(label));
  }

  const [menuLabels, setMenuLabels] = useState(
    getMenuLabels(annotationsObject.getLabels())
  );
  const [newLabel, setNewLabel] = useState("");

  function handleNewLabelChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    // Handle the input of a new label.
    const { value } = event.target; // TODO: add input validation

    setNewLabel(value);
  }

  const updateAllLabels = (): void => {
    const labels = annotationsObject.getLabels();
    setAssignedLabels(labels);
    setMenuLabels(getMenuLabels(labels));
  };

  const handleAddLabel = (label: string) => (): void => {
    // Add a label to active annotation object and update some states.
    annotationsObject.addLabel(label);
    updatePresetLabels(label);
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
  }, [activeAnnotationID]);

  return (
    <>
      <InputBase
        placeholder="Add new label..."
        value={newLabel}
        onChange={(e) => handleNewLabelChange(e)}
        className={classes.inputBase}
      />

      <IconButton
        type="submit"
        aria-label="add-new-label"
        onClick={handleAddLabel(newLabel)}
        edge="end"
      >
        <SVG src={icons.add} width="12px" height="100%" fill="#A1A1A1" />
      </IconButton>
      <Divider className={classes.divider} />
      {assignedLabels.map((label) => (
        <Chip
          key={`chip-add-${label}`}
          avatar={
            <Avatar
              variant="circular"
              style={{ cursor: "pointer" }}
              onClick={handleRemoveLabel(label)}
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
