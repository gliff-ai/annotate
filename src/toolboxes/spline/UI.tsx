import React, { ReactElement } from "react";

import { Tool } from "@/tools";

interface Props {
  open: boolean;
  activeTool: Tool;
  anchorEl: any;
  onClose: (event: React.MouseEvent) => void;
  onClick: (event: React.MouseEvent) => void;
  activateTool: (tool: Tool) => void;
}

const SplineUI = (props: Props): ReactElement => null;

export { SplineUI };
