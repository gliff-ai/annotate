import React, { ReactElement } from "react";
import { Avatar, makeStyles, Box, Typography } from "@material-ui/core";
import { theme } from "@/theme";
import { ToolTip } from "@/tooltips";

const useStyles = (props: Props) =>
  makeStyles({
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
  });

interface Props {
  tooltip: ToolTip;
}

export const BaseTooltipTitle = (props: Props): ReactElement => {
  const classes = useStyles(props)();
  return (
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
  );
};
