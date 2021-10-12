import { Component, ReactElement, MouseEvent } from "react";
import {
  Slide,
  Card,
  WithStyles,
  withStyles,
  Divider,
} from "@material-ui/core";
import { theme, BaseIconButton } from "@gliff-ai/style";
import { PositionAndSize } from "@/annotation/interfaces";
import { MinimapCanvas } from "@/components/baseCanvas";
import { BackgroundCanvas } from "@/toolboxes/background";
import { Tools } from "@/tooltips";

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
    width: "61px",
    height: "53px",
    left: "540px",
    borderRadius: "10px 0 0 0",
    paddingBottom: "58px",
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

  handleEvent = (event: Event): void => {
    if (event.detail === "minimap") {
      this[event.type]?.call(this);
    }
  };

  handleDrawerClose = () => {
    this.setState({ isOpen: false });
    setTimeout(() => {
      this.setState({ transition: true });
    }, 2000);
  };

  handleDrawerOpen = () => {
    this.setState({ isOpen: true });
    this.setState({ transition: false });
  };

  // const Tools: ToolTips = {
  //   minimiseMap: {
  //     name: "Minimise Map",
  //     icon: imgSrc("minimise-icon"),
  //     shortcut: "ALT",
  //     shortcutSymbol: "-",
  //   },
  //   maximiseMap: {
  //     name: "Maximise Map",
  //     icon: imgSrc("maximise-icon"),
  //     shortcut: "ALT",
  //     shortcutSymbol: "=",
  //   },
  //   zoomIn: {
  //     name: "Zoom In",
  //     icon: imgSrc("zoom-in-icon"),
  //     shortcut: "ALT",
  //     shortcutSymbol: "1",
  //   },
  //   zoomOut: {
  //     name: "Zoom Out",
  //     icon: imgSrc("zoom-out-icon"),
  //     shortcut: "ALT",
  //     shortcutSymbol: "2",
  //   },
  //   fitToPage: {
  //     name: "Fit to Page",
  //     icon: imgSrc("reset-zoom-and-pan-icon"),
  //     shortcut: "ALT",
  //     shortcutSymbol: "3",
  //   },
  // } as const;

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
          <div className={this.props.classes.baseIconButton}>
            <BaseIconButton
              tooltip={Tools.minimiseMap}
              onClick={() => {
                this.props.setButtonClicked(Tools.minimiseMap.name);
                this.handleDrawerClose();
              }}
              fill={this.props.buttonClicked === Tools.minimiseMap.name}
              tooltipPlacement="top"
            />
            <BaseIconButton
              tooltip={Tools.zoomIn}
              onClick={() => {
                this.props.setButtonClicked(Tools.zoomIn.name);
                this.props.incrementScale();
              }}
              fill={this.props.buttonClicked === Tools.zoomIn.name}
              tooltipPlacement="top"
            />
            <BaseIconButton
              tooltip={Tools.zoomOut}
              onClick={() => {
                this.props.setButtonClicked(Tools.zoomOut.name);
                this.props.decrementScale();
              }}
              fill={this.props.buttonClicked === Tools.zoomOut.name}
              tooltipPlacement="top"
            />
            <BaseIconButton
              tooltip={Tools.fitToPage}
              onClick={() => {
                this.props.setButtonClicked(Tools.fitToPage.name);
                this.props.resetScaleAndPan();
              }}
              fill={this.props.buttonClicked === Tools.fitToPage.name}
              tooltipPlacement="top"
            />
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
        <Slide
          in={this.state.transition}
          direction="up"
          timeout={{ enter: 1000 }}
        >
          <Card
            className={this.props.classes.mimimapToggle}
            style={{
              position: "relative",
              textAlign: "center",
            }}
          >
            <BaseIconButton
              tooltip={Tools.maximiseMap}
              onClick={(e: MouseEvent) => {
                this.props.setButtonClicked(
                  Tools.maximiseMap.name,
                  true,
                  e.currentTarget as HTMLButtonElement
                );
                this.handleDrawerOpen();
              }}
              fill={this.props.buttonClicked === Tools.maximiseMap.name}
              tooltipPlacement="top"
            />
          </Card>
        </Slide>
      ) : null}
    </div>
  );
}

const styledMinimap = withStyles(styles)(Minimap);
export { styledMinimap as Minimap };
