import { ChangeEvent, ReactElement, MouseEvent } from "react";
import { createStyles, makeStyles, Popover } from "@material-ui/core";
import { BaseIconButton } from "@gliff-ai/style";
import { BaseSlider } from "@/components/BaseSlider";
import { tooltips } from "@/components/tooltips";
import { Sliders, SLIDER_CONFIG } from "./configSlider";
import { usePaintbrushStore } from "./Store";

interface Props {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClose: (event: MouseEvent) => void;
}

const useStyles = makeStyles(() =>
  createStyles({
    baseSlider: {
      width: "63px",
      height: "345px",
      textAlign: "center",
    },
  })
);

const Submenu = (props: Props): ReactElement => {
  const [paintbrush, setPaintbrush] = usePaintbrushStore();
  const classes = useStyles();

  function changeBrushRadius(e: ChangeEvent, value: number) {
    setPaintbrush({
      brushRadius: value,
    });
  }

  function fillBrush() {
    document.dispatchEvent(
      new CustomEvent("fillBrush", { detail: "paintbrush" })
    );
  }

  return (
    <Popover
      open={props.isOpen}
      anchorEl={props.anchorElement}
      onClose={props.onClose}
    >
      <div className={classes.baseSlider}>
        <BaseSlider
          value={paintbrush.brushRadius}
          config={SLIDER_CONFIG[Sliders.brushRadius]}
          onChange={() => changeBrushRadius}
          showEndValues={false}
        />
        <BaseIconButton
          tooltip={tooltips.fillbrush}
          onClick={() => fillBrush()}
          fill={false}
        />
      </div>
    </Popover>
  );
};

export { Submenu };
