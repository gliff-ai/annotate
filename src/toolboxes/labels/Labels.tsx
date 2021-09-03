import {
  FunctionComponent,
  ChangeEvent,
  ReactElement,
  useState,
  useEffect,
} from "react";

import {
  createStyles,
  Divider,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
  Theme,
} from "@material-ui/core";

import SVG from "react-inlinesvg";

import { imgSrc } from "@/imgSrc";

import { Annotations } from "@/annotation";

export interface Props {
  annotationsObject: Annotations;
  presetLabels: string[];
  updatePresetLabels: (label: string) => void;
  activeAnnotationID: number;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    listItem: {
      color: theme.palette.primary.main,
      fontSize: "50px",
      marginLeft: "-7px",
    },
    list: { width: "100%" },
    inputBaseProps: { fontSize: 18, marginRight: 57, marginLeft: -7 },
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
      <List component="div" disablePadding className={classes.list}>
        <ListItem>
          <InputBase
            placeholder="New label"
            value={newLabel}
            onChange={(e) => handleNewLabelChange(e)}
            inputProps={{ styles: `${classes.inputBaseProps}` }}
          />

          <IconButton
            type="submit"
            aria-label="add-new-label"
            onClick={handleAddLabel(newLabel)}
            edge="end"
          >
            <SVG
              src={imgSrc("add-icon")}
              width="12px"
              height="100%"
              fill="#A1A1A1"
            />
          </IconButton>
        </ListItem>
        <Divider />
      </List>

      <List component="div" disablePadding className={classes.list}>
        {assignedLabels.map((label) => (
          <ListItem key={label} dense>
            <ListItemText primary={label} className={classes.listItem} />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={handleRemoveLabel(label)}
              >
                <SVG
                  src={imgSrc("backspace-icon")}
                  width="28px"
                  height="100%"
                  fill="#02FFAD"
                />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <List component="div" disablePadding className={classes.list}>
        {menuLabels.map((label) => (
          <ListItem key={label} dense>
            <ListItemText primary={label} />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="add"
                onClick={handleAddLabel(label)}
              >
                <SVG
                  src={imgSrc("add-icon")}
                  width="12px"
                  height="100%"
                  fill="#000000"
                />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </>
  );
};
