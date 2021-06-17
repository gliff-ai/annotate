import React, { ReactElement, useState, MouseEvent } from "react";
import { Slide, Card, makeStyles } from "@material-ui/core";
import { PositionAndSize } from "@/annotation/interfaces";
import { BaseIconButton } from "@/components/BaseIconButton";
import { MinimapCanvas } from "@/baseCanvas";
import { BackgroundCanvas } from "@/toolboxes/background";
import { theme } from "@/theme";
import { tooltips } from "@/tooltips";

const useStyles = makeStyles({
  minimap: {
    right: "250px",
    bottom: "0",
    marginTop: "30px",
    zIndex: 100,
  },
  minimapCard: {
    width: "344px",
    height: "255px",
    paddingTop: "7px",
    left: "250px",
    borderRadius: "10px 0 0 0",
    marginTop: "70px",
  },
  mimimapToggle: {
    width: "61px",
    height: "53px",
    left: "540px",
    borderRadius: "10px 0 0 0",
    padding: "7px 0",
  },
  miniMapToolTipAvatar: {
    backgroundColor: theme.palette.primary.main,
    color: "#2B2F3A",
    width: "40px",
    height: "40px",
  },
});

interface Props {
  buttonClicked: string;
  setButtonClicked: (
    buttonClicked: string,
    popover?: boolean,
    anchorElement?: HTMLButtonElement
  ) => void;
  displayedImage: ImageBitmap;
  viewportPositionAndSize: PositionAndSize;
  incrementScale: () => void;
  decrementScale: () => void;
  minimapPositionAndSize: PositionAndSize;
  setMinimapPositionAndSize: (
    newMinimapPositionAndSize: PositionAndSize
  ) => void;
  scaleAndPan: {
    scale: number;
    x: number;
    y: number;
  };
  resetScaleAndPan: () => void;
  setScaleAndPan: (newScaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }) => void;
}

const MinimapUI = (props: Props): ReactElement => {
  const classes = useStyles();
  const [isOpen, setIsOpen] = useState(false);

  const handleDrawerClose = () => {
    setIsOpen(false);
  };

  const handleDrawerOpen = () => {
    setIsOpen(true);
  };

  return (
    <div
      className={classes.minimap}
      style={{
        position: "fixed",
      }}
    >
      <Slide in={isOpen} direction="up" timeout={1000}>
        <Card
          className={classes.minimapCard}
          style={{
            position: "relative",
          }}
        >
          <BaseIconButton
            tooltip={tooltips.minimiseMap}
            onClick={(e: MouseEvent) => {
              props.setButtonClicked(tooltips.minimiseMap.name);
              handleDrawerClose();
            }}
            fill={props.buttonClicked === tooltips.minimiseMap.name}
            tooltipPlacement="top"
          />
          <BaseIconButton
            tooltip={tooltips.zoomIn}
            onClick={(e: MouseEvent) => {
              props.setButtonClicked(tooltips.zoomIn.name);
              props.incrementScale();
            }}
            fill={props.buttonClicked === tooltips.zoomIn.name}
            tooltipPlacement="top"
          />
          <BaseIconButton
            tooltip={tooltips.zoomOut}
            onClick={(e: MouseEvent) => {
              props.setButtonClicked(tooltips.zoomOut.name);
              props.decrementScale();
            }}
            fill={props.buttonClicked === tooltips.zoomOut.name}
            tooltipPlacement="top"
          />
          <BaseIconButton
            tooltip={tooltips.fitToPage}
            onClick={(e: MouseEvent) => {
              props.setButtonClicked(tooltips.fitToPage.name);
              props.resetScaleAndPan();
            }}
            fill={props.buttonClicked === tooltips.fitToPage.name}
            tooltipPlacement="top"
          />
          {/* Background canvas for the minimap */}
          {props.displayedImage && (
            <>
              <BackgroundCanvas
                scaleAndPan={{ x: 0, y: 0, scale: 1 }}
                displayedImage={props.displayedImage}
                canvasPositionAndSize={props.minimapPositionAndSize}
                setCanvasPositionAndSize={props.setMinimapPositionAndSize}
              />
              <MinimapCanvas
                displayedImage={props.displayedImage}
                scaleAndPan={props.scaleAndPan}
                setScaleAndPan={props.setScaleAndPan}
                canvasPositionAndSize={props.viewportPositionAndSize}
                minimapPositionAndSize={props.minimapPositionAndSize}
                setMinimapPositionAndSize={props.setMinimapPositionAndSize}
              />{" "}
            </>
          )}
        </Card>
      </Slide>

      {!isOpen ? (
        <Slide in={!isOpen} direction="up" timeout={{ enter: 1000 }}>
          <Card
            className={classes.mimimapToggle}
            style={{
              position: "relative",
              textAlign: "center",
            }}
          >
            <BaseIconButton
              tooltip={tooltips.maximiseMap}
              onClick={(e: MouseEvent) => {
                props.setButtonClicked(
                  tooltips.maximiseMap.name,
                  true,
                  e.currentTarget as HTMLButtonElement
                );
                handleDrawerOpen();
              }}
              fill={props.buttonClicked === tooltips.maximiseMap.name}
              tooltipPlacement="top"
            />
          </Card>
        </Slide>
      ) : null}
    </div>
  );
};

export { MinimapUI };
