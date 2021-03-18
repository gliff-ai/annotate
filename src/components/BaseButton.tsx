import React, { useState } from "react";
import { Button, Tooltip } from "reactstrap";

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
}) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const toggle = () => setTooltipOpen(!tooltipOpen);

  return (
    <span>
      <Button id={name} color="secondary" onClick={onClick}>
        <i className={`fas ${icon}`} />
      </Button>
      <Tooltip
        placement="right"
        isOpen={tooltipOpen}
        target={name}
        toggle={toggle}
      >
        {tooltip}
      </Tooltip>
    </span>
  );
};
