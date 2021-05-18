import React, { ChangeEvent, ReactElement } from "react";
import {
  Tooltip,
  IconButton,
  Typography,
  Grid,
  Popover,
} from "@material-ui/core";

import { Brush, RadioButtonUncheckedSharp } from "@material-ui/icons";

import { Tool } from "@/tools";

import { BaseSlider } from "@/components/BaseSlider";
import { Sliders, SLIDER_CONFIG } from "./configSlider";

import { usePaintbrushStore } from "./Store";

interface Props {
  open: boolean;
  activeTool: Tool;
  anchorEl: any;
  onClose: (event: React.MouseEvent) => void;
  onClick: (event: React.MouseEvent) => void;
  onChange: (event: ChangeEvent, isExpanded: boolean) => void;
  activateTool: (tool: Tool) => void;
}

const PaintbrushUI = (props: Props): ReactElement => {
  const [paintbrush, setPaintbrush] = usePaintbrushStore();

  function changeBrushRadius(e: ChangeEvent, value: number) {
    setPaintbrush({
      brushRadius: value,
    });
  }

  return (
    <Popover
      open={props.open}
      anchorEl={props.anchorEl}
      onClose={props.onClose}
      onClick={props.onClick}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <Typography>Paintbrushes</Typography>

      <Grid container spacing={0} justify="center" wrap="nowrap">
        <Grid item style={{ width: "85%", position: "relative" }}>
          <Tooltip title="Activate paintbrush">
            <IconButton
              id="activate-paintbrush"
              onClick={() => props.activateTool("paintbrush")}
              color={
                props.activeTool === "paintbrush" ? "secondary" : "default"
              }
            >
              <Brush />
            </IconButton>
          </Tooltip>
          <Tooltip title="Activate Eraser">
            <IconButton
              id="activate-eraser"
              onClick={() => props.activateTool("eraser")}
              color={props.activeTool === "eraser" ? "secondary" : "default"}
            >
              <RadioButtonUncheckedSharp />
            </IconButton>
          </Tooltip>

          <BaseSlider
            value={paintbrush.brushRadius}
            config={SLIDER_CONFIG[Sliders.brushRadius]}
            onChange={() => changeBrushRadius}
          />
        </Grid>
      </Grid>
    </Popover>
  );
};

export { PaintbrushUI };
