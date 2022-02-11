import { ReactElement, Dispatch, SetStateAction } from "react";
import { Dialog, Paper } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { theme, IconButton, icons } from "@gliff-ai/style";

interface Props {
  children: JSX.Element | null;
  setChildren: Dispatch<SetStateAction<JSX.Element>>;
}

const useStyle = makeStyles({
  dialogPaper: {
    width: "100%",
    height: "70%",
    backgroundColor: theme.palette.primary.light,
  },
  paper: {
    width: "100%",
    height: "100%",
  },
  button: {
    float: "right",
  },
});

export function PluginDialog({
  children,
  setChildren,
}: Props): ReactElement | null {
  const classes = useStyle();
  return (
    <Dialog open={!!children} classes={{ paper: classes.dialogPaper }}>
      <IconButton
        className={classes.button}
        icon={icons.removeLabel}
        tooltip={{ name: "Close" }}
        onClick={() => setChildren(null)}
        size="small"
      />
      <Paper elevation={0} variant="outlined" className={classes.paper}>
        {children}
      </Paper>
    </Dialog>
  );
}
