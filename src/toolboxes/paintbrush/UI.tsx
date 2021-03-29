import React, { ReactNode, Component, ChangeEvent } from "react";
import {
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
} from "@material-ui/core";

import {
  ExpandMore,
  AllOut,
  Brush,
  RadioButtonUncheckedSharp,
} from "@material-ui/icons";

import { usePaintbrushStore } from "./Store";

type Tool = "paintbrush" | "eraser";

interface Props {
  expanded: boolean;
  activeTool: Tool;
  onChange: (event: ChangeEvent, isExpanded: boolean) => void;
  activateTool: (tool: Tool) => void;
}

const PaintbrushUI = (props: Props) => {
  const [paintbrush, setPaintbrush] = usePaintbrushStore();

  function incrementBrush() {
    setPaintbrush({ brushRadius: paintbrush.brushRadius + 10 });
  }

  return (
    <Accordion expanded={props.expanded} onChange={props.onChange}>
      <AccordionSummary expandIcon={<ExpandMore />} id="paintbrush-toolbox">
        <Typography>Paintbrushes</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Tooltip title="Activate paintbrush">
          <IconButton
            id="activate-paintbrush"
            onClick={() => props.activateTool("paintbrush")}
            color={props.activeTool === "paintbrush" ? "secondary" : "default"}
          >
            <Brush />
          </IconButton>
        </Tooltip>
        <Tooltip title="Increase brush size">
          <IconButton id="increase-paintbrush-radius" onClick={incrementBrush}>
            <AllOut />
          </IconButton>
        </Tooltip>

        <Tooltip title="Activate Eraser">
          <IconButton
            id="activate-eraser"
            onClick={() => props.activateTool("eraser")}
            color={props.activeTool === "eraser" ? "secondary" : "default"}
          >
            <RadioButtonUncheckedSharp />
          </IconButton>
        </Tooltip>
      </AccordionDetails>
    </Accordion>
  );
};

export { PaintbrushUI };
