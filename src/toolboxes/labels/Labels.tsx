import {
  FunctionComponent,
  ChangeEvent,
  ReactElement,
  useState,
  useEffect,
  useCallback,
} from "react";

import SVG from "react-inlinesvg";
import {
  theme,
  icons,
  Avatar,
  Chip,
  Divider,
  MuiIconbutton,
  InputBase,
  ListItemText,
  Typography,
  Box,
} from "@gliff-ai/style";
import { Annotations } from "@/annotation";

export interface Props {
  annotationsObject: Annotations;
  activeAnnotationID: number;
  defaultLabels: string[];
  restrictLabels: boolean;
  multiLabel: boolean;
}

const inputBase = {
  fontSize: "14px",
  "& .MuiInputBase-input": {
    width: "245px",
  },
};
const labelsChip = {
  margin: "5px",
  borderRadius: "9px",
};
const divider = {
  width: "90%",
  marginTop: "inherit",
  marginLeft: "-1%",
};

export const Labels: FunctionComponent<Props> = ({
  annotationsObject,
  activeAnnotationID,
  defaultLabels,
  restrictLabels,
  multiLabel,
}: Props): ReactElement => {
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
            sx={{ ...inputBase }}
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
          <MuiIconbutton
            type="submit"
            aria-label="add-new-label"
            onClick={handleAddLabel(newLabel)}
            edge="end"
            size="small"
            sx={{
              position: "absolute",
              right: "18px",
            }}
          >
            <SVG src={icons.add} width="12px" height="100%" fill="#A1A1A1" />
          </MuiIconbutton>
          <Divider sx={{ ...divider }} />
        </>
      )}
      <Box width={"272px"} maxHeight={"345px"} overflow={"auto"}>
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
                  width="10px"
                  height="100%"
                  fill={theme.palette.primary.main}
                />
              </Avatar>
            }
            sx={{ ...labelsChip }}
            label={<Typography fontSize={"14px"}>{label}</Typography>}
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
                  width="10px"
                  height="100%"
                  fill={theme.palette.text.secondary}
                />
              </Avatar>
            }
            sx={{ ...labelsChip }}
            label={
              <ListItemText
                primary={<Typography fontSize="14px">{label}</Typography>}
              />
            }
            variant="outlined"
          />
        ))}
      </Box>
    </>
  );
};
