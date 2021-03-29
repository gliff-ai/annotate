import React, {
  FunctionComponent,
  ReactElement,
  useState,
  useEffect,
} from "react";

import {
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import BackspaceIcon from "@material-ui/icons/Backspace";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import LibraryAddIcon from "@material-ui/icons/LibraryAdd";

import { Annotations } from "@/annotation";
import { theme } from "@/theme";

interface Props {
  annotationObject: Annotations;
  presetLabels: string[];
  activeAnnotationID: number;
}

export const Labels: FunctionComponent<Props> = ({
  annotationObject,
  presetLabels,
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

  const updateAllLabels = (): void => {
    const labels = annotationObject.getLabels();
    setAssignedLabels(labels);
    setMenuLabels(getMenuLabels(labels));
  };

  const handleAddLabel = (label: string) => (): void => {
    // Add a label to active annotation object and update some states.
    annotationObject.addLabel(label);
    updateAllLabels();
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
    <List style={{ width: "100%" }}>
      <ListItem button onClick={handleClick}>
        <ListItemIcon>
          <LibraryAddIcon />
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
                  <AddIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Collapse>
      {assignedLabels.map((label) => (
        <ListItem key={label} dense>
          <ListItemText primary={label} />
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={handleRemoveLabel(label)}
            >
              <BackspaceIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
};
