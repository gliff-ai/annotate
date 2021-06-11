import React, {
  FunctionComponent,
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

import { Annotations } from "@/annotation";

interface Props {
  annotationObject: Annotations;
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
  })
);

export const Labels: FunctionComponent<Props> = ({
  annotationObject,
  presetLabels,
  updatePresetLabels,
  activeAnnotationID,
}: Props): ReactElement => {
  const getMenuLabels = (labels: string[]): string[] =>
    presetLabels.filter((label) => !labels.includes(label));

  const classes = useStyles();

  const [assignedLabels, setAssignedLabels] = useState(
    annotationObject.getLabels()
  );
  const [menuLabels, setMenuLabels] = useState(
    getMenuLabels(annotationObject.getLabels())
  );

  const [newLabel, setNewLabel] = React.useState("");

  const handleNewLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewLabel(event.target.value);
  };

  const updateAllLabels = (): void => {
    const labels = annotationObject.getLabels();
    setAssignedLabels(labels);
    setMenuLabels(getMenuLabels(labels));
  };

  const handleAddLabel = (label: string) => (): void => {
    // Add a label to active annotation object and update some states.
    annotationObject.addLabel(label);
    updatePresetLabels(label);
    updateAllLabels();
    setNewLabel("");
  };

  const handleRemoveLabel = (label: string) => (): void => {
    // Remove a label from active annotation object and update some states.
    annotationObject.removeLabel(label);
    updateAllLabels();
  };

  useEffect(() => {
    // Re-render assigned labels at change of active annotation ID.
    updateAllLabels();
  }, [activeAnnotationID]);

  return (
    <>
      <List component="div" disablePadding style={{ width: "100%" }}>
        <ListItem>
          <InputBase
            placeholder="New label"
            value={newLabel}
            onChange={handleNewLabelChange}
            inputProps={{
              style: { fontSize: 18, marginRight: 57, marginLeft: -7 },
            }}
            startAdornment
          />

          <IconButton
            type="submit"
            aria-label="add-new-label"
            onClick={handleAddLabel(newLabel)}
            edge="end"
          >
            <SVG
              src={require("../assets/add-icon.svg") as string}
              width="12px"
              height="auto"
              fill="#A1A1A1"
            />
          </IconButton>
        </ListItem>
        <Divider />
      </List>

      <List component="div" disablePadding style={{ width: "100%" }}>
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
                  src={require("../assets/backspace-icon.svg") as string}
                  width="28px"
                  height="auto"
                  fill="#02FFAD"
                />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <List component="div" disablePadding style={{ width: "100%" }}>
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
                  src={require("../assets/add-icon.svg") as string}
                  width="12px"
                  height="auto"
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
