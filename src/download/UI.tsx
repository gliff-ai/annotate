import React, { ReactElement, useState, MouseEvent } from "react";
import { Tooltip, Button, Menu, MenuItem } from "@material-ui/core";
import CloudDownloadIcon from "@material-ui/icons/CloudDownload";
import { ImageFileInfo } from "@gliff-ai/upload";
import { Annotation } from "@/annotation/interfaces";
import { downloadPaintbrushAsTiff } from "@/download/DownloadAsTiff";
import { downloadAnnotationsAsJson } from "@/download/DownloadAsJson";

interface Props {
  annotations: Annotation[];
  imageFileInfo: ImageFileInfo;
}

export function Download({ annotations, imageFileInfo }: Props): ReactElement {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toolboxes: string[] = [];
  annotations.forEach((a) => {
    if (!toolboxes.includes(a.toolbox)) {
      toolboxes.push(a.toolbox);
    }
  });

  const menuItems: Array<{ key: string; text: string; onClick: () => void }> =
    [];
  toolboxes.forEach((toolbox) => {
    if (toolbox === "paintbrush") {
      menuItems.push({
        key: "paintbrush-tiff",
        text: "Export paintbrush as Tiff",
        onClick: () => downloadPaintbrushAsTiff(annotations, imageFileInfo),
      });
    }
    menuItems.push({
      key: `${toolbox}-json`,
      text: `Export ${toolbox} as JSON`,
      onClick: () =>
        downloadAnnotationsAsJson(annotations, toolbox, imageFileInfo.fileName),
    });
  });

  return (
    <>
      <Tooltip title="Download annotations">
        <Button aria-label="download" onClick={handleOpen}>
          <img
            src={require("../assets/save-icon.svg") as string}
            alt="Save Icon"
          />
        </Button>
      </Tooltip>
      <Menu
        id="download-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClick={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        {menuItems.map((item) => (
          <MenuItem key={item.key} onClick={item.onClick} dense>
            {item.text}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
