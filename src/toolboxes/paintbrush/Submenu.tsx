import { ChangeEvent, ReactElement, MouseEvent } from "react";
import {
  ButtonGroup,
  createStyles,
  makeStyles,
  Paper,
  Popover,
} from "@material-ui/core";
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
      height: "285px",
      textAlign: "center",
    },
    subMenu: {
      display: "flex",
      justifyContent: "space-between",
      width: "136px",
      background: "none",
    },
  })
);

const Submenu = (props: Props): ReactElement => {
  const [paintbrush, setPaintbrush] = usePaintbrushStore();
  const classes = useStyles();

  function changeBrushRadius(e: ChangeEvent, value: number) {
    setPaintbrush({
      brushType: paintbrush.brushType, // FIXME
      brushRadius: value,
    });
  }

  function fillBrush() {
    document.dispatchEvent(
      new CustomEvent("fillBrush", { detail: "paintbrush" })
    );
  }

  function selectBrush() {
    setPaintbrush({
      brushType: tooltips.paintbrush.name,
      brushRadius: paintbrush.brushRadius, // FIXME
    });
  }

  function selectEraser() {
    setPaintbrush({
      brushType: tooltips.eraser.name,
      brushRadius: paintbrush.brushRadius, // FIXME
    });
  }

  return (
    <>
      <Popover
        open={props.isOpen}
        anchorEl={props.anchorElement}
        onClose={props.onClose}
        PaperProps={{ classes: { root: classes.subMenu } }}
      >
        <ButtonGroup
          orientation="vertical"
          size="small"
          id="paintbrush-toolbar"
        >
          <BaseIconButton
            tooltip={tooltips.paintbrush}
            onClick={selectBrush}
            fill={paintbrush.brushType === tooltips.paintbrush.name}
          />
          <BaseIconButton
            tooltip={tooltips.eraser}
            onClick={selectEraser}
            fill={paintbrush.brushType === tooltips.eraser.name}
          />
          <BaseIconButton
            tooltip={tooltips.fillbrush}
            onClick={fillBrush}
            fill={false}
          />
        </ButtonGroup>
        <Paper>
          <div className={classes.baseSlider}>
            <BaseSlider
              value={paintbrush.brushRadius}
              config={SLIDER_CONFIG[Sliders.brushRadius]}
              onChange={() => changeBrushRadius}
              showEndValues={false}
            />
          </div>
        </Paper>
      </Popover>
    </>
  );
};

export { Submenu };
