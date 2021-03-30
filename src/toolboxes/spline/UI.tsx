import React, { ChangeEvent, ReactElement } from "react";
import {
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
} from "@material-ui/core";

import { ExpandMore, Brush } from "@material-ui/icons";

import { Tool } from "@/tools";

interface Props {
  expanded: boolean;
  activeTool: Tool;
  onChange: (event: ChangeEvent, isExpanded: boolean) => void;
  activateTool: (tool: Tool) => void;
}

const SplineUI = (props: Props): ReactElement => (
  <Accordion expanded={props.expanded} onChange={props.onChange}>
    <AccordionSummary expandIcon={<ExpandMore />} id="spline-toolbox">
      <Typography>Splines</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Tooltip title="Activate spline">
        <IconButton
          id="activate-spline"
          onClick={() => props.activateTool("spline")}
          color={props.activeTool === "spline" ? "secondary" : "default"}
        >
          <Brush />
        </IconButton>
      </Tooltip>
    </AccordionDetails>
  </Accordion>
);

export { SplineUI };
