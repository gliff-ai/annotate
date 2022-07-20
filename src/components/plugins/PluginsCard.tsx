import { ReactElement, useState } from "react";
import {
  Paper,
  Typography,
  Divider,
  MenuList,
  MenuItem,
  ButtonGroup,
} from "@mui/material";
import SVG from "react-inlinesvg";
import {
  icons,
  IconButton,
  WarningSnackbar,
  HtmlTooltip,
  BaseTooltipTitle,
  Card,
} from "@gliff-ai/style";
import { ImageFileInfo } from "@gliff-ai/upload";
import { Annotations } from "@/annotation";
import { Annotation } from "@/annotation/interfaces";
import type { PluginObject, PluginElement, PluginOutput } from "./interfaces";
import { PluginDialog } from "./PluginDialog";

interface Props {
  plugins: PluginObject | null;
  launchPluginSettingsCallback: () => void | null;
  saveMetadataCallback: ((data: any) => void) | null;
  imageData: ImageBitmap[][];
  annotationsObject: Annotations;
  imageFileInfo: ImageFileInfo;
  isPinned: boolean;
  handlePin: () => void;
}

export const PluginsCard = ({
  plugins,
  launchPluginSettingsCallback,
  saveMetadataCallback,
  imageData,
  imageFileInfo,
  annotationsObject,
  isPinned,
  handlePin,
}: Props): ReactElement | null => {
  const [error, setError] = useState<string | null>(null);
  const [dialogContent, setDialogContent] = useState<JSX.Element | null>(null);

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
        // NOTE: the plugin expects an array of image uids
        data = { imageUids: [imageUid], collectionUid };
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
          onClick={() => runPlugin(p)}
          dense
          sx={{
            margin: 0,
            fontSize: "16px",
            paddingLeft: "0px",
            height: "40px",
          }}
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
            <Typography
              sx={{
                width: "250px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginLeft: "16px",
              }}
            >
              {p.name}&nbsp;—&nbsp;{p.tooltip}
            </Typography>
          </HtmlTooltip>
        </MenuItem>
      ));
    });

    return pluginElements;
  };
  return (
    <Card title="Plugins" isPinned={isPinned} handlePin={handlePin}>
      <>
        <MenuList>{getPluginButtons()}</MenuList>
        <Divider
          sx={{
            margin: 0,
            width: "100%",
            lineHeight: "1px",
          }}
        />
        <Paper
          elevation={0}
          square
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "10px",
            margin: "0 15px 0",
            height: "40px",
          }}
        >
          <SVG src={icons.betaStatus} height="30px" width="50px" />
          <ButtonGroup
            orientation="horizontal"
            variant="text"
            sx={{
              border: "none",
              backgroundColor: "transparent",
              position: "relative",
              right: "-15px",
            }}
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
        <WarningSnackbar
          open={error !== null}
          onClose={() => setError(null)}
          messageText={error}
        />
        <PluginDialog setChildren={setDialogContent}>
          {dialogContent}
        </PluginDialog>
      </>
    </Card>
  );
};
