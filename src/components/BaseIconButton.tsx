import React, { MouseEvent, KeyboardEvent, ReactElement } from "react";
import {
  IconButton,
  Avatar,
  makeStyles,
  Box,
  Typography,
  Tooltip,
  TooltipProps,
} from "@material-ui/core";
import SVG from "react-inlinesvg";
import { theme } from "@/theme";
import { ToolTip } from "@/tooltips";

const useStyles = (props: Props) =>
  makeStyles({
    iconButton: { marginBottom: "5px", marginTop: "7px" },
    svgLarge: { width: "55%", height: "auto" },
    popoverAvatar: {
      backgroundColor: theme.palette.primary.main,
      color: "#2B2F3A",
      width: "30px",
      height: "30px",
    },
    mainbox: {
      display: "flex",
      alignItems: "center",
      justifyItems: "space-between",
    },
    tooltip: {
      backgroundColor: "#FFFFFF",
      fontSize: theme.typography.pxToRem(12),
      border: "1px solid #dadde9",
      color: "#2B2F3A",
    },
    spaceBetweenAvatar: {
      marginLeft: "3px",
    },
    avatarFontSize: {
      fontSize: "11px",
      fontWeight: 600,
    },
    extraButtonStyling: { ...props.tooltip.styling },
  });

interface Props {
  tooltip: ToolTip;
  onClick: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  fill: boolean;
  buttonSize?: "small" | "medium";
  buttonEdge?: "start" | "end";
  tooltipPlacement?: TooltipProps["placement"];
}

export const BaseIconButton = (props: Props): ReactElement => {
  const classes = useStyles(props)();
  return (
    <Tooltip
      key={props.tooltip.name}
      classes={{
        tooltip: classes.tooltip,
      }}
      title={
        <Box className={classes.mainbox}>
          <Box mr={3} ml={2}>
            <Typography>{props.tooltip.name}</Typography>
          </Box>
          {props.tooltip.shortcutSymbol ? (
            <>
              <Avatar className={classes.popoverAvatar}>
                <Typography className={classes.avatarFontSize}>
                  {props.tooltip.shortcut}
                </Typography>
              </Avatar>
              <div className={classes.spaceBetweenAvatar}>
                <Avatar className={classes.popoverAvatar}>
                  <Typography className={classes.avatarFontSize}>
                    {props.tooltip.shortcutSymbol}
                  </Typography>
                </Avatar>
              </div>
            </>
          ) : (
            <Avatar className={classes.popoverAvatar}>
              {props.tooltip.shortcut}
            </Avatar>
          )}
        </Box>
      }
      placement={props.tooltipPlacement}
    >
      <IconButton
        className={
          props.tooltip?.styling
            ? `${classes.extraButtonStyling} ${classes.iconButton}`
            : classes.iconButton
        }
        onKeyDown={props.onKeyDown}
        onClick={props.onClick}
        size={props.buttonSize}
        edge={props.buttonEdge}
      >
        <Avatar>
          <SVG
            src={props.tooltip.icon}
            className={classes.svgLarge}
            fill={props.fill ? theme.palette.primary.main : null}
          />
        </Avatar>
      </IconButton>
    </Tooltip>
  );
};

BaseIconButton.defaultProps = {
  onKeyDown: null,
  buttonSize: "small",
  buttonEdge: "start",
  tooltipPlacement: "right",
};
