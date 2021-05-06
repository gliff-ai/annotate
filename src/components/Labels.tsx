import React, {
  FunctionComponent,
  ReactElement,
  useState,
  useEffect,
} from "react";

import {
  Collapse,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from "@material-ui/core";
import {
  Add,
  Backspace,
  ExpandLess,
  ExpandMore,
  LibraryAdd,
} from "@material-ui/icons";

import { Annotations } from "@/annotation";
import { theme } from "@/theme";

interface Props {
  annotationObject: Annotations;
  presetLabels: string[];
  updatePresetLabels: (label: string) => void;
  activeAnnotationID: number;
}

export const Labels: FunctionComponent<Props> = ({
  annotationObject,
  presetLabels,
  updatePresetLabels,
  activeAnnotationID,
}: Props): ReactElement => {
  const getMenuLabels = (labels: string[]): string[] =>
    presetLabels.filter((label) => !labels.includes(label));

  const [assignedLabels, setAssignedLabels] = useState(
    annotationObject.getLabels()
  );
  const [menuLabels, setMenuLabels] = useState(
    getMenuLabels(annotationObject.getLabels())
  );

  const [isOpen, setIsOpen] = useState(false);

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

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    // Re-render assigned labels at change of active annotation ID.
    updateAllLabels();
  }, [activeAnnotationID]);

  return (
    <>
      <List component="div" disablePadding>
        {assignedLabels.map((label) => (
          <ListItem key={label} dense>
            <ListItemText primary={label} />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={handleRemoveLabel(label)}
              >
                <Backspace />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <List style={{ width: "100%" }}>
        <ListItem button onClick={handleClick}>
          <ListItemIcon>
            <LibraryAdd />
            Add Labels
            {isOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemIcon>
        </ListItem>

        <Collapse
          in={isOpen}
          timeout="auto"
          unmountOnExit
          style={{
            backgroundColor: theme.palette.divider,
          }}
        >
          <List component="div" disablePadding>
            {menuLabels.map((label) => (
              <ListItem key={label} dense>
                <ListItemText primary={label} />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="add"
                    onClick={handleAddLabel(label)}
                  >
                    <Add />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            <ListItem dense>
              <InputBase
                placeholder="New label"
                value={newLabel}
                onChange={handleNewLabelChange}
                inputProps={{ style: { fontSize: 14 } }}
              />

              <IconButton
                type="submit"
                aria-label="add-new-label"
                onClick={handleAddLabel(newLabel)}
                edge="end"
              >
                <Add />
              </IconButton>
            </ListItem>
          </List>
        </Collapse>
      </List>
    </>
  );
};
