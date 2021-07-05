import React, { Component, ReactElement, MouseEvent } from "react";
import { Slide, Card, WithStyles, withStyles } from "@material-ui/core";
import { PositionAndSize } from "@/annotation/interfaces";
import { BaseIconButton } from "@/components/BaseIconButton";
import { MinimapCanvas } from "@/baseCanvas";
import { BackgroundCanvas } from "@/toolboxes/background";
import { theme } from "@/components/theme";
import { tooltips } from "@/components/tooltips";

const styles = {
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
    padding: "10px",
    left: "250px",
    borderRadius: "10px 0 0 0",
  },
  canvasCard: {
    width: "100%",
    height: "200px",
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
};

export const events = ["handleDrawerOpen", "handleDrawerClose"] as const;

interface Event extends CustomEvent {
  type: typeof events[number];
}

interface Props extends WithStyles<typeof styles> {
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
  canvasContainerColour: number[];
}

interface State {
  isOpen: boolean;
}

class Minimap extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isOpen: false,
    };
  }

  componentDidMount = () => {
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
  };

  componentWillUnmount(): void {
    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

  handleEvent = (event: Event): void => {
    if (event.detail === "minimap") {
      this[event.type]?.call(this);
    }
  };

  handleDrawerClose = () => {
    this.setState({ isOpen: false });
  };

  handleDrawerOpen = () => {
    this.setState({ isOpen: true });
  };

  render = (): ReactElement => (
    <div
      className={this.props.classes.minimap}
      style={{
        position: "fixed",
      }}
    >
      <Slide in={this.state.isOpen} direction="up" timeout={1000}>
        <Card
          className={this.props.classes.minimapCard}
          style={{ position: "relative" }}
        >
          <BaseIconButton
            tooltip={tooltips.minimiseMap}
            onClick={() => {
              this.props.setButtonClicked(tooltips.minimiseMap.name);
              this.handleDrawerClose();
            }}
            fill={this.props.buttonClicked === tooltips.minimiseMap.name}
            tooltipPlacement="top"
            buttonStyling={{ marginRight: "132px" }}
          />
          <BaseIconButton
            tooltip={tooltips.zoomIn}
            onClick={() => {
              this.props.setButtonClicked(tooltips.zoomIn.name);
              this.props.incrementScale();
            }}
            fill={this.props.buttonClicked === tooltips.zoomIn.name}
            tooltipPlacement="top"
            buttonStyling={{ marginRight: "10px" }}
          />
          <BaseIconButton
            tooltip={tooltips.zoomOut}
            onClick={() => {
              this.props.setButtonClicked(tooltips.zoomOut.name);
              this.props.decrementScale();
            }}
            fill={this.props.buttonClicked === tooltips.zoomOut.name}
            tooltipPlacement="top"
            buttonStyling={{ marginRight: "10px" }}
          />
          <BaseIconButton
            tooltip={tooltips.fitToPage}
            onClick={() => {
              this.props.setButtonClicked(tooltips.fitToPage.name);
              this.props.resetScaleAndPan();
            }}
            fill={this.props.buttonClicked === tooltips.fitToPage.name}
            tooltipPlacement="top"
          />
          {/* Background canvas for the minimap */}
          {this.props.displayedImage && (
            <div
              className={this.props.classes.canvasCard}
              style={{ position: "relative" }}
            >
              <BackgroundCanvas
                scaleAndPan={{ x: 0, y: 0, scale: 1 }}
                displayedImage={this.props.displayedImage}
                canvasPositionAndSize={this.props.minimapPositionAndSize}
                setCanvasPositionAndSize={this.props.setMinimapPositionAndSize}
              />
              <MinimapCanvas
                displayedImage={this.props.displayedImage}
                scaleAndPan={this.props.scaleAndPan}
                setScaleAndPan={this.props.setScaleAndPan}
                canvasPositionAndSize={this.props.viewportPositionAndSize}
                minimapPositionAndSize={this.props.minimapPositionAndSize}
                setMinimapPositionAndSize={this.props.setMinimapPositionAndSize}
                canvasContainerColour={this.props.canvasContainerColour}
              />
            </div>
          )}
        </Card>
      </Slide>

      {!this.state.isOpen ? (
        <Slide in={!this.state.isOpen} direction="up" timeout={{ enter: 1000 }}>
          <Card
            className={this.props.classes.mimimapToggle}
            style={{
              position: "relative",
              textAlign: "center",
            }}
          >
            <BaseIconButton
              tooltip={tooltips.maximiseMap}
              onClick={(e: MouseEvent) => {
                this.props.setButtonClicked(
                  tooltips.maximiseMap.name,
                  true,
                  e.currentTarget as HTMLButtonElement
                );
                this.handleDrawerOpen();
              }}
              fill={this.props.buttonClicked === tooltips.maximiseMap.name}
              tooltipPlacement="top"
            />
          </Card>
        </Slide>
      ) : null}
    </div>
  );
}

export const MinimapUI = withStyles(styles)(Minimap);
