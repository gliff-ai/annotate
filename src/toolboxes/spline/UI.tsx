import React, { ChangeEvent, ReactElement } from "react";
import {
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  Popover,
} from "@material-ui/core";

import { ExpandMore, Timeline, Gesture } from "@material-ui/icons";

import { Tool } from "@/tools";

interface Props {
  open: boolean;
  activeTool: Tool;
  anchorEl: any;
  onClose: (event: React.MouseEvent) => void;
  onClick: (event: React.MouseEvent) => void;
  onChange: (event: ChangeEvent, isExpanded: boolean) => void;
  activateTool: (tool: Tool) => void;
}

const SplineUI = (props: Props): ReactElement => (
  <Popover
    open={props.open}
    anchorEl={props.anchorEl}
    onClose={props.onClose}
    onClick={props.onClick}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "left",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "left",
    }}
  >
    <Typography>Splines</Typography>

    <Tooltip title="Activate spline">
      <IconButton
        id="activate-spline"
        onClick={() => props.activateTool("spline")}
        color={props.activeTool === "spline" ? "secondary" : "default"}
      >
        <Timeline />
      </IconButton>
    </Tooltip>
    <Tooltip title="Magic spline">
      <IconButton
        id="activate-magic-spline"
        onClick={() => props.activateTool("magicspline")}
        color={props.activeTool === "magicspline" ? "secondary" : "default"}
      >
        <Gesture />
      </IconButton>
    </Tooltip>
  </Popover>
);

export { SplineUI };
