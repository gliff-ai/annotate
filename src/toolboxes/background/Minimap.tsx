import { Component, ReactElement, MouseEvent } from "react";
import {
  Slide,
  Card,
  WithStyles,
  withStyles,
  Divider,
} from "@material-ui/core";
import { theme, IconButton, icons } from "@gliff-ai/style";
import { PositionAndSize } from "@/annotation/interfaces";
import { MinimapCanvas } from "@/components/baseCanvas";
import { BackgroundCanvas } from "@/toolboxes/background";
import { getShortcut } from "@/keybindings";
import { Toolbox } from "@/Toolboxes";

const styles = {
  minimapCard: {
    width: "344px",
    height: "255px",
    paddingTop: "7px",
    padding: "10px",
    left: "250px",
    borderRadius: "10px 0 0 0",
  },
  baseIconButton: {
    display: "flex",
    justifyContent: "flex-end",
    margin: "-10px 0 13px",
    "& $button": {
      marginRight: "10px",
      "&:nth-child(4)": {
        marginRight: "0",
      },
      "&:nth-child(1)": {
        marginRight: "auto",
      },
    },
  },
  divider: {
    width: "inherit",
    marginLeft: "-10px",
    marginBottom: "4px",
  },
  canvasCard: {
    width: "100%",
    height: "200px",
  },
  mimimapToggle: {
    borderRadius: "10px 0 0 0",
  },
  miniMapToolTipAvatar: {
    backgroundColor: theme.palette.primary.main,
    color: "#2B2F3A",
    width: "40px",
    height: "40px",
  },
};

const ToolboxName: Toolbox = "ui";

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
  transition: boolean;
}

class Minimap extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isOpen: false,
      transition: true,
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

  componentDidUpdate = (prevProps: Props, preState: State): void => {
    if (preState.isOpen !== this.state.isOpen) {
      /* eslint-disable react/no-did-update-set-state */
      this.setState({ transition: true });
    }
  };

  handleEvent = (event: Event): void => {
    if (event.detail === "minimap") {
      this[event.type]?.call(this);
    }
  };

  handleDrawerClose = () => {
    this.setState({ isOpen: false, transition: false });
  };

  handleDrawerOpen = () => {
    this.setState({ isOpen: true, transition: false });
  };

  render = (): ReactElement => {
    const tools = [
      {
        name: "Minimise Map",
        icon: icons.minimise,
        event: this.handleDrawerClose,
      },
      {
        name: "Zoom In",
        icon: icons.zoomIn,
        event: "incrementScale",
      },
      {
        name: "Zoom Out",
        icon: icons.zoomOut,
        event: "decrementScale",
      },
      {
        name: "Fit to Page",
        icon: icons.fitToPage,
        event: "resetScaleAndPan",
      },
    ] as const;

    console.log(this.state.isOpen);

    return (
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
        }}
      >
        {this.state.isOpen ? (
          <Slide
            in={this.state.transition}
            direction="up"
            timeout={{ enter: 750 }}
          >
            <Card className={this.props.classes.minimapCard}>
              <div className={this.props.classes.baseIconButton}>
                {tools.map(({ icon, name, event }) => (
                  <IconButton
                    key={name}
                    icon={icon}
                    tooltip={{
                      name,
                      ...getShortcut(
                        `${ToolboxName}.${
                          typeof event === "string" ? event : event.name
                        }`
                      ),
                    }}
                    onClick={() => {
                      this.props.setButtonClicked(name);
                      if (typeof event === "string") {
                        this.props[event]();
                      } else {
                        event();
                      }
                    }}
                    fill={this.props.buttonClicked === name}
                    tooltipPlacement="top"
                  />
                ))}
              </div>
              <Divider className={this.props.classes.divider} />
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
                    setCanvasPositionAndSize={
                      this.props.setMinimapPositionAndSize
                    }
                  />
                  <MinimapCanvas
                    displayedImage={this.props.displayedImage}
                    scaleAndPan={this.props.scaleAndPan}
                    setScaleAndPan={this.props.setScaleAndPan}
                    canvasPositionAndSize={this.props.viewportPositionAndSize}
                    minimapPositionAndSize={this.props.minimapPositionAndSize}
                    setMinimapPositionAndSize={
                      this.props.setMinimapPositionAndSize
                    }
                    canvasContainerColour={this.props.canvasContainerColour}
                  />
                </div>
              )}
            </Card>
          </Slide>
        ) : (
          <Slide
            in={this.state.transition}
            direction="up"
            timeout={{ enter: 750 }}
          >
            <Card className={this.props.classes.mimimapToggle}>
              <IconButton
                icon={icons.maximise}
                tooltip={{
                  name: "Maximise Map",
                  ...getShortcut(`${ToolboxName}.maximiseMap`),
                }}
                onClick={(e: MouseEvent) => {
                  this.props.setButtonClicked(
                    "Maximise Map",
                    true,
                    e.currentTarget as HTMLButtonElement
                  );
                  this.handleDrawerOpen();
                }}
                fill={this.props.buttonClicked === "Maximise Map"}
                tooltipPlacement="top"
              />
            </Card>
          </Slide>
        )}
      </div>
    );
  };
}

const StyledMinimap = withStyles(styles)(Minimap);
export { StyledMinimap as Minimap, ToolboxName };
