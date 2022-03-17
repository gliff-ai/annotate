import { ReactElement, useState, CSSProperties } from "react";
import {
  Card,
  Paper,
  Typography,
  Divider,
  MenuList,
  MenuItem,
  ButtonGroup,
} from "@mui/material";
import SVG from "react-inlinesvg";
import {
  theme,
  icons,
  IconButton,
  WarningSnackbar,
  HtmlTooltip,
  BaseTooltipTitle,
} from "@gliff-ai/style";
import { Annotations } from "@/annotation";
import { Annotation } from "@/annotation/interfaces";
import type { PluginObject, PluginElement, PluginOutput } from "./interfaces";
import { PluginDialog } from "./PluginDialog";
import { ImageFileInfo } from "@gliff-ai/upload";

const style = (
  hover: boolean
): {
  [key: string]: CSSProperties;
} => ({
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
    backgroundColor: hover ? theme.palette.grey[300] : "transparent",
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
  saveMetadataCallback: ((data: any) => void) | null;
  imageData: ImageBitmap[][];
  annotationsObject: Annotations;
  imageFileInfo: ImageFileInfo;
}

export const PluginsCard = ({
  plugins,
  launchPluginSettingsCallback,
  saveMetadataCallback,
  imageData,
  imageFileInfo,
  annotationsObject,
}: Props): ReactElement | null => {
  const [error, setError] = useState<string | null>(null);
  const [dialogContent, setDialogContent] = useState<JSX.Element | null>(null);
  const [hover, setHover] = useState<boolean>(false);
  const classes = style(hover);

  if (!plugins) return null;

  const storeOutputData = (
    collectionUid: string,
    imageUid: string,
    data: PluginOutput["data"]
  ): void => {
    const { annotationData, metadata } = data;

    if (annotationData !== undefined) {
      // add the new annotations to the annotationsObject
      annotationData.forEach((annotation: Annotation) => {
        const {
          toolbox,
          labels,
          spline,
          boundingBox,
          brushStrokes,
          parameters,
        } = annotation;
        annotationsObject.addAnnotation(
          toolbox,
          labels,
          spline,
          boundingBox,
          brushStrokes,
          parameters
        );
      });
    }

    if (metadata !== undefined && saveMetadataCallback) {
      saveMetadataCallback({
        collectionUid,
        metadata: [{ id: imageUid, ...metadata }],
      });
    }
  };

  const runPlugin = async (plugin: PluginElement): Promise<void> => {
    try {
      const url = window.location.href.split("/");
      const imageUid = url.pop();
      const collectionUid = url.pop();

      let data;
      if (plugin.type === "Javascript") {
        data = {
          imageData,
          imageFileInfo,
          annotationData: annotationsObject.getAllAnnotations(),
        };
      } else {
        data = { imageUid, collectionUid };
      }

      const response = await plugin.onClick(data);

      if (response?.message) {
        setError(response.message);
      }

      if (response?.domElement) {
        setDialogContent(response.domElement);
      }

      if (response?.data) {
        storeOutputData(collectionUid, imageUid, response.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getPluginButtons = (): JSX.Element[][] => {
    const pluginNames = Object.keys(plugins);

    const pluginElements = pluginNames.map((name) => {
      const plugin = plugins[name];

      return plugin.map((p) => (
        <MenuItem
          key={p.name}
          style={classes.menuItem}
          onMouseLeave={() => setHover(false)}
          onMouseEnter={() => setHover(true)}
          onClick={() => runPlugin(p)}
          dense
        >
          <HtmlTooltip
            placement="top"
            title={
              <BaseTooltipTitle
                tooltip={{
                  name: `${p.name} — ${p.tooltip}`,
                }}
              />
            }
          >
            <Typography style={classes.truncate}>
              {p.name}&nbsp;—&nbsp;{p.tooltip}
            </Typography>
          </HtmlTooltip>
        </MenuItem>
      ));
    });

    return pluginElements;
  };

  return (
    <>
      <Card style={classes.card}>
        <Paper
          elevation={0}
          variant="outlined"
          square
          style={classes.paperHeader}
        >
          <Typography style={classes.topography}>Plugins</Typography>
        </Paper>
        <MenuList>{getPluginButtons()}</MenuList>
        <Divider style={classes.divider} />
        <Paper elevation={0} square style={classes.paperFooter}>
          <SVG src={icons.betaStatus} height="25px" width="50px" />
          <ButtonGroup
            style={classes.buttonGroup}
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
              onClick={() => {
                document.location = "https://docs.gliff.app/";
              }}
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
