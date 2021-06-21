import React, { ReactElement, useState, MouseEvent } from "react";
import {
  Tooltip,
  Button,
  Menu,
  MenuItem,
  makeStyles,
  Theme,
} from "@material-ui/core";
import { ImageFileInfo } from "@gliff-ai/upload";
import { Annotation } from "@/annotation/interfaces";
import { downloadPaintbrushAsTiff } from "@/download/DownloadAsTiff";
import { downloadAnnotationsAsJson } from "@/download/DownloadAsJson";

const useStyles = makeStyles({
  menu: {
    borderRadius: "9px",
    opacity: 1,
  },
  text: {
    fontSize: "17px",
    letterSpacing: "0px",
    color: "#2B2F3A",
    fontWeight: 400,
  },
  menuItem: {
    opacity: "1",
    "&:hover": {
      background: "#02FFAD 0% 0% no-repeat padding-box",
    },
  },
  paper: {
    marginTop: "90px",
    marginLeft: "-20px",
  },
  tooltip: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #dadde9",
    opacity: "1",
    marginTop: "30px",
    marginLeft: "0px",
  },
});

interface Props {
  annotations: Annotation[];
  imageFileInfo: ImageFileInfo;
}

export function Download({ annotations, imageFileInfo }: Props): ReactElement {
  const classes = useStyles();
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
      <Tooltip
        title="Download annotations"
        classes={{ tooltip: `${classes.tooltip} ${classes.text}` }}
      >
        <Button aria-label="download" onClick={handleOpen}>
          <img
            src={require("../assets/save-icon.svg") as string}
            alt="Save Icon"
          />
        </Button>
      </Tooltip>
      <Menu
        id="download-menu"
        className={classes.menu}
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClick={handleClose}
        getContentAnchorEl={null}
        PopoverClasses={{ paper: classes.paper }}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.key}
            className={`${classes.menuItem} ${classes.text}`}
            onClick={item.onClick}
            dense
          >
            {item.text}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
