import { ReactElement, useState } from "react";
import {
  Card,
  Paper,
  Typography,
  Divider,
  MenuList,
  MenuItem,
  ButtonGroup,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import SVG from "react-inlinesvg";
import { theme, icons, IconButton, WarningSnackbar } from "@gliff-ai/style";
import type { PluginObject, PluginElement } from "./interfaces";
import { PluginDialog } from "./PluginDialog";

const useStyles = makeStyles({
  card: { width: "300px" },
  paperHeader: {
    padding: "10px",
    backgroundColor: theme.palette.primary.main,
  },
  topography: {
    display: "inline",
    fontWeight: 500,
    marginLeft: "10px",
  },
  menuItem: {
    margin: 0,
    fontSize: "16px",
    paddingLeft: "20px",
    height: "40px",
    "&:hover": {
      backgroundColor: theme.palette.grey[300],
    },
  },
  divider: { margin: 0, width: "100%", lineHeight: "1px" },
  paperFooter: {
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonGroup: { border: "none", backgroundColor: "transparent" },
  truncate: {
    width: "250px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
});

interface Props {
  plugins: PluginObject | null;
  launchPluginSettingsCallback: () => void | null;
}

export const PluginsCard = ({
  plugins,
  launchPluginSettingsCallback,
}: Props): ReactElement | null => {
  const classes = useStyles();
  const [error, setError] = useState<string | null>(null);
  const [dialogContent, setDialogContent] = useState<JSX.Element | null>(null);

  if (!plugins) return null;

  const openDocs = () => {
    // TODO: Navigate to docs
  };

  const runPlugin = async (plugin: PluginElement): Promise<void> => {
    try {
      const url = window.location.href.split("/");
      const data = {
        imageUid: url.pop(),
        collectionUid: url.pop(),
      };

      const response = await plugin.onClick(data);

      if (response?.message) {
        setError(response.message);
      }

      if (response?.domElement) {
        setDialogContent(response.domElement);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getPluginButtons = (): JSX.Element[][] => {
    const pluginNames = Object.keys(plugins);

    return pluginNames.map((name) => {
      const plugin = plugins[name];

      return plugin.map((p) => (
        <MenuItem
          key={p.name}
          className={classes.menuItem}
          onClick={() => runPlugin(p)}
          dense
        >
          <Typography className={classes.truncate}>
            {p.name}&nbsp;—&nbsp;{p.tooltip}
          </Typography>
        </MenuItem>
      ));
    });
  };

  return (
    <>
      <Card className={classes.card}>
        <Paper
          elevation={0}
          variant="outlined"
          square
          className={classes.paperHeader}
        >
          <Typography className={classes.topography}>Plugins</Typography>
        </Paper>
        <MenuList>{getPluginButtons()}</MenuList>
        <Divider className={classes.divider} />
        <Paper elevation={0} square className={classes.paperFooter}>
          <SVG src={icons.betaStatus} width="auto" height="25px" />
          <ButtonGroup
            className={classes.buttonGroup}
            orientation="horizontal"
            variant="text"
          >
            {launchPluginSettingsCallback && (
              <IconButton
                tooltip={{ name: "Settings" }}
                icon={icons.cog}
                onClick={launchPluginSettingsCallback}
                fill={false}
                tooltipPlacement="top"
                size="small"
              />
            )}
            <IconButton
              tooltip={{ name: "Docs" }}
              icon={icons.documentHelp}
              onClick={openDocs}
              tooltipPlacement="top"
              size="small"
            />
          </ButtonGroup>
        </Paper>
      </Card>
      <WarningSnackbar
        open={error !== null}
        onClose={() => setError(null)}
        messageText={error}
      />
      <PluginDialog setChildren={setDialogContent}>
        {dialogContent}
      </PluginDialog>
    </>
  );
};
