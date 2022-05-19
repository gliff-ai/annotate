import { Component, ReactNode } from "react";
import {
  AppBar,
  Container,
  Toolbar,
  ButtonGroup,
  Grid,
  CssBaseline,
  Paper,
  ThemeProvider,
  Theme,
  StyledEngineProvider,
} from "@mui/material";
import { WithStyles } from "@mui/styles";
import withStyles from "@mui/styles/withStyles";
import StylesProvider from "@mui/styles/StylesProvider";
import { UploadImage, ImageFileInfo } from "@gliff-ai/upload";
import {
  theme,
  Logo,
  IconButton,
  icons,
  generateClassName,
  WarningSnackbar,
  MuiPopover,
} from "@gliff-ai/style";
import { Annotations } from "@/annotation";
import { PositionAndSize } from "@/annotation/interfaces";
import { Toolboxes, Toolbox } from "@/Toolboxes";
import { pageLoading } from "@/decorators";
import {
  BackgroundCanvas,
  BackgroundToolbar,
  Minimap,
} from "@/toolboxes/background";
import { SplineCanvas, SplineToolbar } from "@/toolboxes/spline";
import { BoundingBoxCanvas, BoundingBoxToolbar } from "@/toolboxes/boundingBox";
import { PaintbrushCanvas, PaintbrushToolbar } from "@/toolboxes/paintbrush";
import { LabelsSubmenu } from "@/toolboxes/labels";
import { Download } from "@/download/UI";
import { getShortcut, keydownListener } from "@/keybindings";
import { BaseSlider, Config } from "@/components/BaseSlider";
import { KeybindPopup } from "./keybindings/KeybindPopup";
import { PluginObject, PluginsCard } from "./components/plugins";

declare module "@mui/styles/defaultTheme" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

const logger = console;

const CONFIG = {
  PAN_AMOUNT: 20,
} as const;

export enum Mode {
  draw,
  select,
}
interface Event extends CustomEvent {
  type: typeof events[number];
}

export enum UserAccess {
  Owner = "owner",
  Member = "member",
  Collaborator = "collaborator",
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
export const events = [
  "nextAnnotation",
  "previousAnnotation",
  "toggleMode",
  "addAnnotation",
  "selectBrightness",
  "selectContrast",
  "selectChannels",
  "selectAnnotationLabel",
  "clearActiveAnnotation",
  "incrementScale",
  "decrementScale",
  "resetScaleAndPan",
  "saveAnnotations",
  "undo",
  "redo",
] as const;

interface State {
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  };
  activeToolbox?: Toolbox; // FIXME
  displayedImage?: ImageBitmap;
  activeAnnotationID: number;
  viewportPositionAndSize: Required<PositionAndSize>;
  minimapPositionAndSize: Required<PositionAndSize>;
  redrawEverything: number;
  sliceIndex: number;
  channels: boolean[];
  activeSubmenuAnchor: HTMLButtonElement | null; // A HTML element. It specifies which button has its submenu open, and serves as anchorEl for that submenu: https://material-ui.com/api/menu/#props
  buttonClicked: string;
  mode: Mode;
  canvasContainerColour: number[];
}

const styles = {
  mainContainer: {
    position: "relative" as const,
    height: "100%",
    width: "100%",
  },
  selectionContainer: {
    left: "18px",
    marginTop: "18px",
    top: "90px",
    width: "auto",
    zIndex: 100,
  },
  displayContainer: {
    marginTop: "18px",
  },
  leftToolbar: {
    display: "flex",
    flexDirection: "column" as const,
    top: "108px",
    left: "18px",
    bottom: "18px",
    width: "63px",
    zIndex: 100,
    justifyContent: "space-between",
    position: "fixed" as const,
    "& $button": {
      [theme.breakpoints.down("lg")]: {
        margin: "0px",
      },
    },
  },

  bottomToolbars: {
    bottom: "18px",
    left: "18px",
    width: "63px",
    zIndex: 100,
  },
  iconbutton: {
    marginBottom: "5px",
    marginTop: "7px",
  },
  imageGrid: {
    justifyContent: "flex-start",
    marginTop: "20px",
  },
  mainGrid: {
    height: "100%",
  },
  appbar: {
    backgroundColor: "#fafafa",
  },
  canvasGrid: {
    width: "100%",
  },
  slicesSlider: {
    width: "63px",
    height: "390px",
    top: "180px",
    right: "18px",
  },
};

interface Props extends WithStyles<typeof styles> {
  slicesData?: ImageBitmap[][] | null;
  imageFileInfo?: ImageFileInfo;
  annotationsObject?: Annotations;
  saveAnnotationsCallback?: (annotationsObject: Annotations) => void;
  showAppBar?: boolean;
  // setIsLoading is used, but in progress.tsx
  // eslint-disable-next-line react/no-unused-prop-types
  setIsLoading?: (isLoading: boolean) => void;
  userAccess?: UserAccess;
  plugins?: PluginObject | null;
  launchPluginSettingsCallback?: (() => void) | null;
  defaultLabels?: string[];
  restrictLabels?: boolean;
  multiLabel?: boolean;
  saveMetadataCallback?: ((data: any) => void) | null;
  readonly?: boolean;
}

class UserInterface extends Component<Props, State> {
  public static defaultProps: Omit<Props, "classes"> = {
    annotationsObject: null,
    saveAnnotationsCallback: null,
    showAppBar: true,
    setIsLoading: null,
    slicesData: null,
    imageFileInfo: undefined,
    userAccess: UserAccess.Collaborator,
    plugins: null,
    launchPluginSettingsCallback: null,
    defaultLabels: [],
    restrictLabels: false,
    multiLabel: true,
    saveMetadataCallback: null,
    readonly: false,
  };

  annotationsObject: Annotations;

  private slicesData: ImageBitmap[][] | null;

  private imageFileInfo: ImageFileInfo | null;

  private refBtnsPopovers: { [buttonName: string]: HTMLButtonElement };

  private keyListener: (event: KeyboardEvent) => boolean;

  constructor(props: Props) {
    super(props);

    this.annotationsObject = this.props.annotationsObject || new Annotations();

    this.slicesData = this.props.slicesData || null;

    this.state = {
      scaleAndPan: {
        scale: 1,
        x: 0,
        y: 0,
      },
      activeAnnotationID: 0,
      viewportPositionAndSize: { top: 0, left: 0, width: 768, height: 768 },
      minimapPositionAndSize: { top: 0, left: 0, width: 200, height: 200 },
      sliceIndex: 0,
      channels: [true],
      displayedImage: this.slicesData ? this.slicesData[0][0] : null,
      redrawEverything: 0,
      activeSubmenuAnchor: null,
      buttonClicked: null,
      activeToolbox: Toolboxes.paintbrush,
      mode: Mode.draw,
      canvasContainerColour: [255, 255, 255, 1],
    };

    this.imageFileInfo = this.props.imageFileInfo || null;
    this.refBtnsPopovers = {};
  }

  @pageLoading
  componentDidMount(): void {
    this.keyListener = keydownListener(this.isTyping);
    document.addEventListener("keydown", this.keyListener);

    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
    this.mixChannels();

    this.annotationsObject.giveRedrawCallback(this.redrawUI);
    this.annotationsObject.addAnnotation(this.state.activeToolbox);
  }

  componentDidUpdate = (prevProps: Props): void => {
    if (
      this.props.slicesData &&
      prevProps.slicesData !== this.props.slicesData
    ) {
      this.slicesData = this.props.slicesData;
      /* eslint-disable react/no-did-update-set-state */
      this.setState(
        {
          channels: this.slicesData[0].map(() => true),
          sliceIndex: 0,
        },
        () => {
          this.mixChannels(); // computes and sets this.state.displayedImage
        }
      );

      this.imageFileInfo = this.props.imageFileInfo;
    }

    if (
      this.props.annotationsObject &&
      prevProps.annotationsObject !== this.props.annotationsObject
    ) {
      this.annotationsObject = this.props.annotationsObject;
      this.annotationsObject.giveRedrawCallback(this.redrawUI);
      this.redrawUI();
    }
  };

  componentWillUnmount(): void {
    document.removeEventListener("keydown", this.keyListener);

    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

  handleEvent = (event: Event): void => {
    if (event.detail === "ui") {
      this[event.type]?.call(this);
    }
  };

  getRGBAforCanvasContainerColour = (): string => {
    const [r, g, b, a] = [...this.state.canvasContainerColour];
    return `rgba(${r},${g},${b},${a})`;
  };

  setViewportPositionAndSize = (
    newViewportPositionAndSize: PositionAndSize
  ): void => {
    this.setState((prevState: State) => {
      const { viewportPositionAndSize } = prevState;
      return {
        viewportPositionAndSize: {
          top: newViewportPositionAndSize.top || viewportPositionAndSize.top,
          left: newViewportPositionAndSize.left || viewportPositionAndSize.left,
          width:
            newViewportPositionAndSize.width || viewportPositionAndSize.width,
          height:
            newViewportPositionAndSize.height || viewportPositionAndSize.height,
        },
      };
    });
  };

  setMinimapPositionAndSize = (
    newMinimapPositionAndSize: PositionAndSize
  ): void => {
    this.setState((prevState: State) => {
      const { minimapPositionAndSize } = prevState;
      return {
        minimapPositionAndSize: {
          top: newMinimapPositionAndSize.top || minimapPositionAndSize.top,
          left: newMinimapPositionAndSize.left || minimapPositionAndSize.left,
          width:
            newMinimapPositionAndSize.width || minimapPositionAndSize.width,
          height:
            newMinimapPositionAndSize.height || minimapPositionAndSize.height,
        },
      };
    });
  };

  setScaleAndPan = (newScaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }): void => {
    this.setState((prevState: State) => {
      const { scaleAndPan } = prevState;
      return {
        scaleAndPan: {
          x: newScaleAndPan.x || scaleAndPan.x,
          y: newScaleAndPan.y || scaleAndPan.y,
          scale: newScaleAndPan.scale || scaleAndPan.scale,
        },
      };
    }, this.limitPan); // this sets limitPan as a callback after state update, ensuring it will use the new scaleAndPan
  };

  incrementScaleAndPan = (key: "x" | "y" | "scale", increment: number): void =>
    this.setState((prevState: State) => {
      const { scaleAndPan } = prevState;
      scaleAndPan[key] += increment;
      return { scaleAndPan };
    }, this.limitPan);

  multiplyScaleAndPan = (key: "x" | "y" | "scale", multiple: number): void =>
    this.setState((prevState: State) => {
      const { scaleAndPan } = prevState;
      scaleAndPan[key] *= multiple;
      return { scaleAndPan };
    }, this.limitPan);

  limitPan = (): void => {
    // adjust pan such that image borders are not inside the canvas

    // calculate how much bigger the image is than the canvas, in canvas space:
    if (!this.state.displayedImage) return;
    const imageScalingFactor = Math.min(
      this.state.viewportPositionAndSize.width /
        this.state.displayedImage.width,
      this.state.viewportPositionAndSize.height /
        this.state.displayedImage.height
    );

    const xMargin =
      this.state.displayedImage.width *
        imageScalingFactor *
        this.state.scaleAndPan.scale -
      this.state.viewportPositionAndSize.width;

    const yMargin =
      this.state.displayedImage.height *
        imageScalingFactor *
        this.state.scaleAndPan.scale -
      this.state.viewportPositionAndSize.height;

    // now calculate the allowable pan range:
    const panRangeX = Math.max(0, xMargin / 2); // scaleAndPan.x can be +-panRangeX
    const panRangeY = Math.max(0, yMargin / 2); // scaleAndPan.y can be +-panRangeY

    // move pan into the allowable range:
    let panX = this.state.scaleAndPan.x;
    let panY = this.state.scaleAndPan.y;
    panX = Math.min(panRangeX, Math.abs(panX)) * Math.sign(panX);
    panY = Math.min(panRangeY, Math.abs(panY)) * Math.sign(panY);

    this.setState((prevState: State) => ({
      scaleAndPan: { x: panX, y: panY, scale: prevState.scaleAndPan.scale },
    }));
  };

  resetScaleAndPan = (): void => {
    this.setScaleAndPan({ scale: 1, x: 0, y: 0 });
  };

  incrementScale = (): void => {
    const panMultiplier =
      (1 + this.state.scaleAndPan.scale) / this.state.scaleAndPan.scale;

    this.multiplyScaleAndPan("x", panMultiplier);
    this.multiplyScaleAndPan("y", panMultiplier);
    this.incrementScaleAndPan("scale", 1);
  };

  decrementScale = (): void => {
    // Zoom out only if zoomed in.
    if (this.state.scaleAndPan.scale > 1) {
      const panMultiplier =
        (this.state.scaleAndPan.scale - 1) / this.state.scaleAndPan.scale;

      this.multiplyScaleAndPan("x", panMultiplier);
      this.multiplyScaleAndPan("y", panMultiplier);
      this.incrementScaleAndPan("scale", -1);
    }
  };

  incrementPanX = (): void => {
    // negative is left, +ve is right...
    this.incrementScaleAndPan("x", CONFIG.PAN_AMOUNT);
  };

  decrementPanX = (): void => {
    // negative is left, +ve is right...
    this.incrementScaleAndPan("x", -CONFIG.PAN_AMOUNT);
  };

  incrementPanY = (): void => {
    // negative is up, +ve is down...
    this.incrementScaleAndPan("y", CONFIG.PAN_AMOUNT);
  };

  decrementPanY = (): void => {
    // negative is up, +ve is down...
    this.incrementScaleAndPan("y", -CONFIG.PAN_AMOUNT);
  };

  setUploadedImage = (
    imageFileInfo: ImageFileInfo[],
    slicesData: ImageBitmap[][][]
  ): void => {
    if (this.props.userAccess === UserAccess.Collaborator) return;

    [this.imageFileInfo] = imageFileInfo; // the Upload component passes arrays of images/metadata even when multiple=false, as it is in ANNOTATE but not CURATE
    [this.slicesData] = slicesData;
    this.setState(
      {
        sliceIndex: 0,
        channels: Array(this.slicesData[0].length).fill(true) as boolean[],
      },
      this.mixChannels
    );

    // If annotationsObject is not passed down as props, create a new annotationsObject.
    // Otherwise the props for annotationsObject will update after the uplaoed image has been stored.
    if (!this.props.annotationsObject) {
      this.annotationsObject = new Annotations();
      this.annotationsObject.giveRedrawCallback(this.redrawUI);
      this.annotationsObject.addAnnotation(this.state.activeToolbox);
    }

    // TODO: Add saveImageCallback to store uplaoded image in dominate
  };

  mixChannels = (): void => {
    // combines the separate channels in this.slicesData[this.state.sliceIndex] into
    // a single ImageBitmap according to the user's channel picker settings, and stores
    // the result in this.state.displayedImage

    // draw the channels onto a new canvas using additive composition:
    if (!this.slicesData) return;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = this.slicesData[this.state.sliceIndex][0].width;
    canvas.height = this.slicesData[this.state.sliceIndex][0].height;
    context.globalCompositeOperation = "lighter";
    this.slicesData[this.state.sliceIndex].forEach(
      (channel: ImageBitmap, i: number) => {
        if (this.state.channels[i]) {
          context.drawImage(channel, 0, 0);
        }
      }
    );

    createImageBitmap(canvas)
      .then((displayedImage) => this.setState({ displayedImage }))
      .catch((e) => logger.error(e));
  };

  activateToolbox = (toolbox: Toolbox): void => {
    this.setState({ activeToolbox: toolbox, mode: Mode.draw }, () => {
      this.reuseEmptyAnnotation();
    });
  };

  addAnnotation = (): void => {
    if (!this.state.displayedImage) return;
    this.annotationsObject.addAnnotation(this.state.activeToolbox);
    this.annotationsObject.setSplineSpaceTimeInfo(this.state.sliceIndex);
    this.setState({
      activeAnnotationID: this.annotationsObject.getActiveAnnotationID(),
    });
    if (this.state.activeToolbox === Toolboxes.spline) {
      // This component doesn't know which spline type is active, because that data is stored
      // in a hook variable and class components can't use hooks. Therefore, if we're in the spline
      // toolbox, dispatch an event that tells the spline canvas to check the spline type and
      // set the isBezier flag on the annotation appropriately:
      document.dispatchEvent(
        new CustomEvent("makeBezierIfBezierActive", {
          detail: Toolboxes.spline,
        })
      );
    }
    this.redrawEverything();
  };

  nextAnnotation = (): void => {
    this.cycleActiveAnnotation(true);
  };

  previousAnnotation = (): void => {
    this.cycleActiveAnnotation(false);
  };

  selectDrawMode = (): void => {
    // Select draw mode and re-activate last used toolbox
    this.setState((prevState) => ({
      mode: Mode.draw,
      buttonClicked: prevState.activeToolbox,
    }));
  };

  toggleMode = (): void => {
    // Toggle between draw and select mode.
    if (this.state.mode === Mode.draw) {
      this.setState({ mode: Mode.select, buttonClicked: "Select" });
    } else {
      this.selectDrawMode();
    }
  };

  cycleActiveAnnotation = (forward = true): void => {
    const data = this.annotationsObject.getAllAnnotations();
    this.setState((prevState) => {
      let i = prevState.activeAnnotationID;
      const inc = forward ? 1 : -1;

      // cycle i forward or backward until we reach another annotation whose toolbox attribute matches the current activeToolbox:
      do {
        // increment or decrement i by 1, wrapping around if we go above the length of the array(-1) or below 0:
        i =
          (i + inc + this.annotationsObject.length()) %
          this.annotationsObject.length();
      } while (data[i].toolbox !== prevState.activeToolbox);

      this.annotationsObject.setActiveAnnotationID(i);
      return { activeAnnotationID: i };
    });
  };

  reuseEmptyAnnotation = (): void => {
    /* If the active annotation object is empty, change the value of toolbox
    to match the active tool. */
    if (this.annotationsObject.isActiveAnnotationEmpty()) {
      this.annotationsObject.setActiveAnnotationToolbox(
        this.state.activeToolbox
      );
      this.annotationsObject.setSplineSpaceTimeInfo(this.state.sliceIndex);
    }
    this.redrawEverything();
  };

  clearActiveAnnotation = (): void => {
    const deletedLastAnnotation = this.annotationsObject.length() === 1;
    this.annotationsObject.deleteActiveAnnotation();
    if (deletedLastAnnotation) {
      // if we delete the last annotation, annotationsObject will make a new one with the paintbrush toolbox
      // (since it doesn't know which tool is active), so we set the toolbox correctly here:
      this.annotationsObject.setActiveAnnotationToolbox(
        this.state.activeToolbox
      );
    }
    this.redrawEverything();
  };

  redrawUI = (): void => {
    this.forceUpdate();
  };

  redrawEverything = (): void => {
    this.setState((prevState) => ({
      redrawEverything: prevState.redrawEverything + 1,
    }));
  };

  changeSlice = (e: Event, value: number): void => {
    this.setState({ sliceIndex: value }, () => {
      this.reuseEmptyAnnotation();
      this.mixChannels();
    });
  };

  toggleChannelAtIndex = (index: number): void => {
    this.setState((prevState: State) => {
      const { channels } = prevState;
      channels[index] = !channels[index];
      return { channels };
    }, this.mixChannels);
  };

  handleClose = (): void => {
    this.setState({ activeSubmenuAnchor: null });
  };

  handleOpen =
    (event?: React.MouseEvent) =>
    (activeSubmenuAnchor?: HTMLButtonElement): void => {
      if (activeSubmenuAnchor !== undefined) {
        this.setState({ activeSubmenuAnchor });
      } else if (event) {
        this.setState({
          activeSubmenuAnchor: event.currentTarget as HTMLButtonElement,
        });
      }
    };

  setButtonClicked = (buttonClicked: string): void =>
    this.setState({ buttonClicked });

  // Functions of type select<ToolTip.name>, added for use in keybindings and OnClick events
  // TODO: find a way to pass parameters in keybindings and get rid of code duplication
  selectContrast = (): void => {
    this.handleOpen()(this.refBtnsPopovers.Contrast);
    this.setButtonClicked("Contrast");
  };

  selectBrightness = (): void => {
    this.handleOpen()(this.refBtnsPopovers.Brightness);
    this.setButtonClicked("Brightness");
  };

  selectChannels = (): void => {
    this.handleOpen()(this.refBtnsPopovers.Channels);
    this.setButtonClicked("Channels");
  };

  selectAnnotationLabel = (): void => {
    this.handleOpen()(this.refBtnsPopovers["Annotation Label"]);
    this.setButtonClicked("Annotation Label");
  };

  selectPlugins = (): void => {
    this.handleOpen()(this.refBtnsPopovers.Plugins);
    this.setButtonClicked("Plugins");
  };

  saveAnnotations = (): void => {
    if (!this.props.saveAnnotationsCallback) return;
    this.props.saveAnnotationsCallback(this.annotationsObject);
  };

  undo = (): void => {
    this.redrawEverything();
    this.setButtonClicked("Undo");
    this.annotationsObject.undo();
  };

  redo = (): void => {
    this.redrawEverything();
    this.setButtonClicked("Redo");
    this.annotationsObject.redo();
  };

  isTyping = (): boolean =>
    // Added to prevent single-key shortcuts that are also valid text input
    // to get triggered during text input.
    this.refBtnsPopovers["Annotation Label"] === this.state.activeSubmenuAnchor;

  setModeCallback = (mode: Mode): void => {
    this.setState(() => ({ mode, buttonClicked: null }));
  };

  setUIActiveAnnotationIDCallback = (id: number): void => {
    this.setState({ activeAnnotationID: id });
  };

  setActiveToolboxCallback = (tool: Toolbox): void => {
    this.setState({ activeToolbox: tool });
  };

  setCanvasContainerColourCallback = (canvasContainerColour: number[]): void =>
    this.setState({ canvasContainerColour });

  render = (): ReactNode => {
    const { classes, showAppBar, saveAnnotationsCallback } = this.props;

    const uploadDownload = (
      <>
        {(this.props.userAccess === UserAccess.Owner ||
          this.props.userAccess === UserAccess.Member) && (
          <Grid item>
            <UploadImage
              setUploadedImage={this.setUploadedImage}
              spanElement={
                <IconButton
                  tooltip={{ name: "Upload Images" }}
                  icon={icons.upload}
                  fill={false}
                  tooltipPlacement="bottom"
                  size="medium"
                  component="span"
                />
              }
              multiple={false}
            />
          </Grid>
        )}
        <Grid item>
          <Download
            annotationsObject={this.annotationsObject}
            imageFileInfo={this.imageFileInfo}
            redraw={this.state.redrawEverything}
          />
        </Grid>
      </>
    );

    const appBar = !showAppBar ? null : (
      <AppBar position="fixed" className={classes.appbar}>
        <Toolbar>
          <Grid container direction="row">
            <div className={classes.iconbutton}>
              <Logo />
            </div>
          </Grid>
          <KeybindPopup />

          {uploadDownload}
        </Toolbar>
      </AppBar>
    );

    const tools = [
      {
        name: "Select Annotation",
        icon: icons.select,
        event: "toggleMode",
        active: () => this.state.mode === Mode.select,
        enabled: () => true,
      },
      {
        name: "Add New Annotation",
        icon: icons.addAnnotation,
        event: "addAnnotation",
        active: () => false, // TODO: add feedback when this is clicked
        enabled: () => true,
      },
      {
        name: "Clear Annotation",
        icon: icons.deleteAnnotation,
        event: "clearActiveAnnotation",
        active: () => false, // TODO: add feedback when this is clicked
        enabled: () => true,
      },
      {
        name: "Annotation Label",
        icon: icons.annotationLabel,
        event: "selectAnnotationLabel",
        active: () =>
          this.state.activeSubmenuAnchor ===
          this.refBtnsPopovers["Annotation Label"],
        enabled: () => true,
      },
      {
        name: "Undo Last Action",
        icon: icons.undo,
        event: "undo",
        active: () => false,
        enabled: () => this.annotationsObject.canUndo(),
      },
      {
        name: "Redo Last Action",
        icon: icons.redo,
        event: "redo",
        active: () => false,
        enabled: () => this.annotationsObject.canRedo(),
      },
      {
        name: "Plugins",
        icon: icons.plugins,
        event: "selectPlugins",
        active: () =>
          this.state.activeSubmenuAnchor === this.refBtnsPopovers.Plugins,
        enabled: () => !!this.props?.plugins,
      },
    ] as const;

    const leftToolbar = (
      <div className={classes.leftToolbar}>
        <ButtonGroup variant="text">
          {tools.map(({ icon, name, event, active, enabled }) => (
            <IconButton
              id={`id-${name.toLowerCase().replace(/ /g, "-")}`}
              key={name}
              icon={icon}
              tooltip={{
                name,
                ...getShortcut(`ui.${event}`),
              }}
              onClick={this[event]}
              fill={active()}
              setRefCallback={(ref: HTMLButtonElement) => {
                this.refBtnsPopovers[name] = ref;
              }}
              disabled={!enabled()}
              size="small"
            />
          ))}

          {saveAnnotationsCallback && (
            <IconButton
              tooltip={{ name: "Save Annotations" }}
              icon={icons.save}
              onMouseDown={() => {
                this.setButtonClicked("Save Annotations");
                this.saveAnnotations();
              }}
              onMouseUp={this.selectDrawMode}
              fill={this.state.buttonClicked === "Save Annotations"}
              size="small"
            />
          )}
          <LabelsSubmenu
            isOpen={
              this.state.activeSubmenuAnchor ===
              this.refBtnsPopovers["Annotation Label"]
            }
            anchorElement={this.state.activeSubmenuAnchor}
            onClose={this.handleClose}
            annotationsObject={this.annotationsObject}
            activeAnnotationID={this.state.activeAnnotationID}
            defaultLabels={this.props.defaultLabels}
            restrictLabels={this.props.restrictLabels}
            multiLabel={this.props.multiLabel}
          />
          <MuiPopover
            open={
              this.state.activeSubmenuAnchor === this.refBtnsPopovers.Plugins
            }
            anchorEl={this.state.activeSubmenuAnchor}
            onClose={this.handleClose}
          >
            <PluginsCard
              plugins={this.props.plugins}
              launchPluginSettingsCallback={
                this.props.launchPluginSettingsCallback
              }
              imageData={this.slicesData}
              imageFileInfo={this.props.imageFileInfo}
              annotationsObject={this.annotationsObject}
              saveMetadataCallback={this.props.saveMetadataCallback}
            />
          </MuiPopover>
        </ButtonGroup>

        <ButtonGroup>
          <PaintbrushToolbar
            active={this.state.activeToolbox === "paintbrush"}
            activateToolbox={this.activateToolbox}
            handleOpen={this.handleOpen}
            anchorElement={this.state.activeSubmenuAnchor}
            is3D={this.slicesData?.length > 1}
          />
          <SplineToolbar
            active={this.state.activeToolbox === "spline"}
            activateToolbox={this.activateToolbox}
            handleOpen={this.handleOpen}
            anchorElement={this.state.activeSubmenuAnchor}
          />

          <BoundingBoxToolbar
            active={this.state.activeToolbox === "boundingBox"}
            activateToolbox={this.activateToolbox}
            handleOpen={this.handleOpen}
          />
          <BackgroundToolbar
            handleOpen={this.handleOpen}
            anchorElement={this.state.activeSubmenuAnchor}
            channels={this.state.channels}
            toggleChannelAtIndex={this.toggleChannelAtIndex}
          />
        </ButtonGroup>
      </div>
    );

    const readonlyToolbar = (
      <div className={classes.leftToolbar}>
        <ButtonGroup>
          <IconButton
            id={"id-select-annotation"}
            key={"Select Annotation"}
            icon={tools[0].icon}
            tooltip={{
              name: "Select Annotation",
              ...getShortcut("ui.toggleMode"),
            }}
            onClick={this["toggleMode"]}
            fill={tools[0].active()}
            setRefCallback={(ref: HTMLButtonElement) => {
              this.refBtnsPopovers["Select Annotation"] = ref;
            }}
            disabled={!tools[0].enabled()}
            size="small"
          />
          <BackgroundToolbar
            handleOpen={this.handleOpen}
            anchorElement={this.state.activeSubmenuAnchor}
            channels={this.state.channels}
            toggleChannelAtIndex={this.toggleChannelAtIndex}
          />
        </ButtonGroup>
      </div>
    );

    return (
      <StylesProvider generateClassName={generateClassName("annotate")}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <Grid container className={classes.mainContainer}>
              <CssBaseline />
              <Container
                disableGutters
                maxWidth={false}
                style={{
                  backgroundColor: this.getRGBAforCanvasContainerColour(),
                  margin: 0,
                  height: "100vh",
                }}
              >
                {appBar}
                {this.props.readonly ? readonlyToolbar : leftToolbar}
                <div
                  style={{
                    display: "block",
                    position: "fixed",
                    bottom: 0,
                    width: "100%",
                    // the height of the canvas container is 100% of the parent minus the height of the app bar
                    // when the app bar is displayed and 100% otherwise.
                    height: showAppBar ? "calc(100% - 85px)" : "100%",
                  }}
                >
                  <BackgroundCanvas
                    scaleAndPan={this.state.scaleAndPan}
                    displayedImage={this.state.displayedImage}
                    canvasPositionAndSize={this.state.viewportPositionAndSize}
                    setCanvasPositionAndSize={this.setViewportPositionAndSize}
                    setCanvasContainerColourCallback={
                      this.setCanvasContainerColourCallback
                    }
                    setScaleAndPan={this.setScaleAndPan}
                  />
                  <SplineCanvas
                    scaleAndPan={this.state.scaleAndPan}
                    activeToolbox={this.state.activeToolbox}
                    mode={this.state.mode}
                    setMode={this.setModeCallback}
                    annotationsObject={this.annotationsObject}
                    displayedImage={this.state.displayedImage}
                    redraw={this.state.redrawEverything}
                    sliceIndex={this.state.sliceIndex}
                    setUIActiveAnnotationID={
                      this.setUIActiveAnnotationIDCallback
                    }
                    setActiveToolbox={this.setActiveToolboxCallback}
                    setScaleAndPan={this.setScaleAndPan}
                  />
                  <BoundingBoxCanvas
                    scaleAndPan={this.state.scaleAndPan}
                    activeToolbox={this.state.activeToolbox}
                    mode={this.state.mode}
                    setMode={this.setModeCallback}
                    annotationsObject={this.annotationsObject}
                    displayedImage={this.state.displayedImage}
                    redraw={this.state.redrawEverything}
                    sliceIndex={this.state.sliceIndex}
                    setUIActiveAnnotationID={
                      this.setUIActiveAnnotationIDCallback
                    }
                    setActiveToolbox={this.setActiveToolboxCallback}
                    setScaleAndPan={this.setScaleAndPan}
                  />
                  <PaintbrushCanvas
                    scaleAndPan={this.state.scaleAndPan}
                    activeToolbox={this.state.activeToolbox}
                    mode={this.state.mode}
                    setMode={this.setModeCallback}
                    annotationsObject={this.annotationsObject}
                    displayedImage={this.state.displayedImage}
                    redraw={this.state.redrawEverything}
                    sliceIndex={this.state.sliceIndex}
                    setUIActiveAnnotationID={
                      this.setUIActiveAnnotationIDCallback
                    }
                    setActiveToolbox={this.setActiveToolboxCallback}
                    setScaleAndPan={this.setScaleAndPan}
                  />
                  {this.slicesData?.length > 1 && (
                    <Paper
                      elevation={3}
                      className={classes.slicesSlider}
                      style={{ position: "absolute" }}
                    >
                      <BaseSlider
                        value={this.state.sliceIndex}
                        config={
                          {
                            name: "slices",
                            id: "slices-slider",
                            initial: 1,
                            step: 1,
                            min: 0,
                            max: this.slicesData.length - 1,
                            unit: "",
                          } as Config
                        }
                        onChange={() => this.changeSlice}
                        sliderHeight="300px"
                      />
                    </Paper>
                  )}
                </div>
              </Container>
              <Minimap
                buttonClicked={this.state.buttonClicked}
                displayedImage={this.state.displayedImage}
                minimapPositionAndSize={this.state.minimapPositionAndSize}
                viewportPositionAndSize={this.state.viewportPositionAndSize}
                scaleAndPan={this.state.scaleAndPan}
                setButtonClicked={this.setButtonClicked}
                incrementScale={this.incrementScale}
                decrementScale={this.decrementScale}
                setMinimapPositionAndSize={this.setMinimapPositionAndSize}
                resetScaleAndPan={this.resetScaleAndPan}
                setScaleAndPan={this.setScaleAndPan}
                canvasContainerColour={this.state.canvasContainerColour}
              />
            </Grid>
            <WarningSnackbar
              messageText={
                <>
                  Another toolbox is already in use. Add new annotation to
                  continue.
                </>
              }
              onClose={() => {}}
              open={
                this.annotationsObject.length() > 0 &&
                !this.annotationsObject.isActiveAnnotationEmpty() &&
                this.state.activeToolbox !==
                  this.annotationsObject.getActiveAnnotation().toolbox
              }
            />
          </ThemeProvider>
        </StyledEngineProvider>
      </StylesProvider>
    );
  };
}

const styledUserInterface = withStyles(styles)(UserInterface);
export {
  styledUserInterface as UserInterface,
  UserInterface as UnstyledUserInterface,
};
