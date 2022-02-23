import { ReactElement, Dispatch, SetStateAction, CSSProperties } from "react";
import { Dialog, Paper } from "@mui/material";
import { theme, IconButton, icons } from "@gliff-ai/style";

interface Props {
  children: JSX.Element | null;
  setChildren: Dispatch<SetStateAction<JSX.Element>>;
}

const style: {
  [key: string]: CSSProperties | { [key: string]: CSSProperties };
} = {
  dialogPaper: {
    ".MuiDialog-paper": {
      width: "100%",
      height: "70%",
      backgroundColor: theme.palette.primary.light,
    },
  },
  paper: {
    width: "100%",
    height: "100%",
  },
  button: {
    float: "right",
  },
};

export function PluginDialog({
  children,
  setChildren,
}: Props): ReactElement | null {
  const classes = style;
  return (
    <Dialog open={!!children} style={classes.dialogPaper}>
      <IconButton
        style={classes.button}
        icon={icons.removeLabel}
        tooltip={{ name: "Close" }}
        onClick={() => setChildren(null)}
        size="small"
      />
      <Paper elevation={0} variant="outlined" style={classes.paper}>
        {children}
      </Paper>
    </Dialog>
  );
}
