import React, { ChangeEvent, ReactElement } from "react";
import { Popover } from "@material-ui/core";

import { Tool } from "@/tools";

import { BaseSlider } from "@/components/BaseSlider";
import { Sliders, SLIDER_CONFIG } from "./configSlider";

import { usePaintbrushStore } from "./Store";

interface Props {
  open: boolean;
  activeTool: Tool;
  anchorEl: any;
  buttonClicked: string;
  onClick: (event: React.MouseEvent) => void;
  onClose: (event: React.MouseEvent) => void;
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
    >
      <div
        style={{
          width: "63px",
          height: "297px",
          textAlign: "center",
        }}
      >
        <BaseSlider
          value={paintbrush.brushRadius}
          config={SLIDER_CONFIG[Sliders.brushRadius]}
          onChange={() => changeBrushRadius}
          slider={"paintbrush"}
        />
      </div>
    </Popover>
  );
};

export { PaintbrushUI };
