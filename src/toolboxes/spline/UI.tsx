import React, { ReactElement } from "react";

import { Tool } from "@/tools";

interface Props {
  isOpen: boolean;
  activeTool: Tool;
  anchorEl: HTMLButtonElement | null;
  onClose: (event: React.MouseEvent) => void;
  onClick: (event: React.MouseEvent) => void;
  activateTool: (tool: Tool) => void;
}

const SplineUI = (props: Props): ReactElement => null;

export { SplineUI };
