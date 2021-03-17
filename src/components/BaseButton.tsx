import * as React from "react";
import { Button, UncontrolledTooltip } from "reactstrap";

export interface ButtonProps {
  tooltip: string;
  icon: string;
  name: string;
  onClick: () => void;
}

export const BaseButton: React.FC<ButtonProps> = ({
  tooltip,
  icon,
  name,
  onClick,
}) => (
  <span className="mt-3 mb-3">
    <Button id={name} color="secondary" onClick={onClick}>
      <i className={`fas ${icon}`} />
    </Button>
    <UncontrolledTooltip placement="left" target={name} fade={false}>
      {tooltip}
    </UncontrolledTooltip>
  </span>
);
