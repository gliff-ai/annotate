import { ReactElement } from "react";
import { Avatar, makeStyles, Box, Typography } from "@material-ui/core";

import { theme } from "@/components/theme";
import { ToolTip } from "@/components/tooltips";

interface Props {
  tooltip: ToolTip;
}

const useStyles = makeStyles({
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

export const BaseTooltipTitle = ({ tooltip }: Props): ReactElement => {
  const classes = useStyles();

  return (
    <Box className={classes.mainbox}>
      <Box mr={3} ml={2}>
        <Typography>{tooltip.name}</Typography>
      </Box>
      {tooltip.shortcutSymbol ? (
        <>
          <Avatar className={classes.popoverAvatar}>
            <Typography className={classes.avatarFontSize}>
              {tooltip.shortcut}
            </Typography>
          </Avatar>
          <div className={classes.spaceBetweenAvatar}>
            <Avatar className={classes.popoverAvatar}>
              <Typography className={classes.avatarFontSize}>
                {tooltip.shortcutSymbol}
              </Typography>
            </Avatar>
          </div>
        </>
      ) : (
        <Avatar className={classes.popoverAvatar}>{tooltip.shortcut}</Avatar>
      )}
    </Box>
  );
};
