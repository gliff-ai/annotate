import React, { MouseEvent, ReactElement, CSSProperties } from "react";
import {
  IconButton,
  Avatar,
  makeStyles,
  Tooltip,
  TooltipProps,
} from "@material-ui/core";
import SVG from "react-inlinesvg";
import { theme } from "@/theme";
import { ToolTip } from "@/tooltips";
import { BaseTooltipTitle } from "@/components/BaseTooltipTitle";

interface Props {
  tooltip: ToolTip;
  onClick?: (event: MouseEvent) => void;
  onMouseDown?: (event: MouseEvent) => void;
  onMouseUp?: (event: MouseEvent) => void;
  fill: boolean;
  buttonSize?: "small" | "medium";
  buttonEdge?: "start" | "end";
  tooltipPlacement?: TooltipProps["placement"];
  setRefCallback?: (ref: HTMLButtonElement) => void;
  svgStyling?: CSSProperties;
  tooltipStyling?: CSSProperties;
  buttonStyling?: CSSProperties;
  hasAvatar?: boolean;
}

export const BaseIconButton = (props: Props): ReactElement => {
  const classes = makeStyles({
    iconButton: {
      marginBottom: "5px",
      marginTop: "7px",
      ...props.buttonStyling,
    },
    tooltip: {
      backgroundColor: "#FFFFFF",
      fontSize: theme.typography.pxToRem(12),
      border: "1px solid #dadde9",
      color: "#2B2F3A",
      ...props.tooltipStyling,
    },
    svg: {
      width: "55%",
      height: "auto",
      "&:hover": { fill: "#000000" },
      ...props.svgStyling,
    },
  })(props);

  const svgIcon = (
    <SVG
      src={props.tooltip.icon}
      className={classes.svg}
      fill={props.fill ? theme.palette.primary.main : null}
    />
  );

  return (
    <Tooltip
      key={props.tooltip.name}
      classes={{
        tooltip: classes.tooltip,
      }}
      title={<BaseTooltipTitle tooltip={props.tooltip} />}
      placement={props.tooltipPlacement}
    >
      <IconButton
        ref={(ref) => {
          if (!ref || !props.setRefCallback) return;
          props.setRefCallback(ref);
        }}
        className={classes.iconButton}
        onMouseUp={props.onMouseUp}
        onMouseDown={props.onMouseDown}
        onClick={props.onClick}
        size={props.buttonSize}
        edge={props.buttonEdge}
      >
        {props.hasAvatar ? <Avatar>{svgIcon}</Avatar> : <>{svgIcon}</>}
      </IconButton>
    </Tooltip>
  );
};

BaseIconButton.defaultProps = {
  buttonSize: "small",
  buttonEdge: "start",
  tooltipPlacement: "right",
  setRefCallback: null,
  onMouseUp: null,
  onMouseDown: null,
  onClick: null,
  svgStyling: null,
  hasAvatar: true,
  tooltipStyling: null,
  buttonStyling: null,
};
