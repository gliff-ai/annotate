import React, { ChangeEvent, ReactElement } from "react";
import { createStyles, makeStyles, Popover } from "@material-ui/core";

import { BaseSlider } from "@/components/BaseSlider";
import { Sliders, SLIDER_CONFIG } from "./configSlider";

import { usePaintbrushStore } from "./Store";

interface Props {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClick: (event: React.MouseEvent) => void;
  onClose: (event: React.MouseEvent) => void;
}

const useStyles = makeStyles(() =>
  createStyles({
    baseSlider: {
      width: "63px",
      height: "297px",
      textAlign: "center",
    },
  })
);

const PaintbrushUI = (props: Props): ReactElement => {
  const [paintbrush, setPaintbrush] = usePaintbrushStore();
  const classes = useStyles();

  function changeBrushRadius(e: ChangeEvent, value: number) {
    setPaintbrush({
      brushRadius: value,
    });
  }

  return (
    <Popover
      open={props.isOpen}
      anchorEl={props.anchorElement}
      onClose={props.onClose}
      onClick={props.onClick}
    >
      <div className={classes.baseSlider}>
        <BaseSlider
          value={paintbrush.brushRadius}
          config={SLIDER_CONFIG[Sliders.brushRadius]}
          onChange={() => changeBrushRadius}
          showEndValues={false}
        />
      </div>
    </Popover>
  );
};

export { PaintbrushUI };
