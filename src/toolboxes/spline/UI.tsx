import React, { ChangeEvent, ReactElement } from "react";
import { Tooltip, IconButton, Typography, Popover } from "@material-ui/core";

import { Timeline, Gesture } from "@material-ui/icons";

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

const SplineUI = (props: Props): ReactElement => null;

export { SplineUI };
