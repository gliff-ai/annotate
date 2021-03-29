import React, { Component, ChangeEvent, ReactNode } from "react";

import {
  AppBar,
  Container,
  Toolbar,
  Tooltip,
  IconButton,
  Button,
  ButtonGroup,
  Grid,
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  CssBaseline,
} from "@material-ui/core";

import {
  Add,
  ZoomOut,
  ZoomIn,
  AspectRatio,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardArrowUp,
  ExpandMore,
  Brush,
} from "@material-ui/icons";

import { Annotations } from "./annotation";

import { ThemeProvider, theme } from "./theme";

import { BackgroundCanvas, BackgroundMinimap } from "./toolboxes/background";
import { SplineCanvas } from "./toolboxes/spline";
import { PaintbrushCanvas, PaintbrushUI } from "./toolboxes/paintbrush";
import { Labels } from "./components/Labels";
import { BaseSlider } from "./components/BaseSlider";
import { Sliders, SLIDER_CONFIG } from "./configSlider";
import { keydownListener } from "./keybindings";

// Define all mutually exclusive tools
// enum Tools {
//   paintbrush = "paintbrush",
//   spline = "spline",
//   eraser = "eraser",
// }

import { Tools, Tool } from "./tools";

const CONFIG = {
  PAN_AMOUNT: 20,
} as const;

interface PositionAndSize {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}

interface Event extends CustomEvent {
  type: typeof events[number];
}

// Here we define the methods that are exposed to be called by keyboard shortcuts
export const events = ["nextAnnotation", "previousAnnotation"] as const;

interface State {
  scaleAndPan: {
    x: number;
    y: number;
    scale: number;
  };
  activeTool?: Tool;
  imageWidth: number;
  imageHeight: number;
  activeAnnotationID: number;
  contrast: number;
  brightness: number;

  viewportPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  };

  minimapPositionAndSize: {
    top: number;
    left: number;
    width: number;
    height: number;
  };

  expanded: string | boolean;
}

export class UserInterface extends Component<Record<string, never>, State> {
  annotationsObject: Annotations;

  imageSource: string;

  private presetLabels: string[];

  constructor(props: never) {
    super(props);
    this.annotationsObject = new Annotations();
    this.state = {
      scaleAndPan: {
        scale: 1,
        x: 0,
        y: 0,
      },
      imageWidth: 0,
      imageHeight: 0,
      activeTool: Tools.paintbrush,
      activeAnnotationID: 0,
      viewportPositionAndSize: { top: 0, left: 0, width: 768, height: 768 },
      minimapPositionAndSize: { top: 0, left: 0, width: 200, height: 200 },
      expanded: false,
      brightness: SLIDER_CONFIG[Sliders.brightness].initial,
      contrast: SLIDER_CONFIG[Sliders.contrast].initial,
    };

    this.imageSource = "public/zebrafish-heart.jpg";

    this.annotationsObject.addAnnotation(this.state.activeTool);
    this.presetLabels = ["label-1", "label-2", "label-3"]; // TODO: find a place for this
  }

  componentDidMount = (): void => {
    document.addEventListener("keydown", keydownListener);
    for (const event of events) {
      document.addEventListener(event, this.handleEvent);
    }
  };

  componentWillUnmount(): void {
    for (const event of events) {
      document.removeEventListener(event, this.handleEvent);
    }
  }

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

  handleEvent = (event: Event): void => {
    if (event.detail === "ui") {
      this[event.type]?.call(this);
    }
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
    });

  multiplyScaleAndPan = (key: "x" | "y" | "scale", multiple: number): void =>
    this.setState((prevState: State) => {
      const { scaleAndPan } = prevState;
      scaleAndPan[key] *= multiple;
      return { scaleAndPan };
    });

  limitPan = (): void => {
    // adjust pan such that image borders are not inside the canvas

    // calculate how much bigger the image is than the canvas, in canvas space:
    const imageScalingFactor = Math.min(
      this.state.viewportPositionAndSize.width / this.state.imageWidth,
      this.state.viewportPositionAndSize.height / this.state.imageHeight
    );

    const xMargin =
      this.state.imageWidth *
        imageScalingFactor *
        this.state.scaleAndPan.scale -
      this.state.viewportPositionAndSize.width;

    const yMargin =
      this.state.imageHeight *
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

  updateImageDimensions = (imageWidth: number, imageHeight: number): void => {
    this.setState({
      imageWidth,
      imageHeight,
    });
  };

  selectSplineTool = (): void => {
    // Change active tool to spline.
    if (this.state.activeTool !== Tools.spline) {
      this.setState({ activeTool: Tools.spline }, () => {
        this.reuseEmptyAnnotation();
      });
    }
  };

  activateTool = (tool: Tool): void => {
    this.setState({ activeTool: tool }, () => {
      this.reuseEmptyAnnotation();
    });
  };

  addAnnotation = (): void => {
    this.annotationsObject.addAnnotation(this.state.activeTool);
    this.setState({
      activeAnnotationID: this.annotationsObject.getActiveAnnotationID(),
    });
  };

  nextAnnotation = (): void => {
    this.cycleActiveAnnotation(true);
  };

  previousAnnotation = (): void => {
    this.cycleActiveAnnotation(false);
  };

  cycleActiveAnnotation = (forward = true): void => {
    const data = this.annotationsObject.getAllAnnotations();
    this.setState((prevState) => {
      let i = prevState.activeAnnotationID;
      const inc = forward ? 1 : -1;

      // cycle i forward or backward until we reach another annotation whose toolbox attribute matches the current activeTool:
      do {
        // increment or decrement i by 1, wrapping around if we go above the length of the array(-1) or below 0:
        i =
          (i + inc + this.annotationsObject.length()) %
          this.annotationsObject.length();
      } while (data[i].toolbox !== Tools[prevState.activeTool]);

      this.annotationsObject.setActiveAnnotationID(i);
      return { activeAnnotationID: i };
    });
  };

  reuseEmptyAnnotation = (): void => {
    /* If the active annotation object is empty, change the value of toolbox
    to match the active tool. */
    if (this.annotationsObject.isActiveAnnotationEmpty()) {
      this.annotationsObject.setActiveAnnotationToolbox(this.state.activeTool);
    }
  };

  handleToolboxChange = (panel: string) => (
    event: ChangeEvent,
    isExpanded: boolean
  ): void => {
    this.setState({ expanded: isExpanded ? panel : false });
  };

  handleSliderChange = <K extends keyof State>(key: K) => (
    event: ChangeEvent,
    value: State[K]
  ): void => {
    this.setState({ [key]: value } as Pick<State, K>);
  };

  render = (): ReactNode => (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container disableGutters>
        <AppBar>
          <Toolbar>
            <Tooltip title="Annotate new object">
              <IconButton id="addAnnotation" onClick={this.addAnnotation}>
                <Add />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <Toolbar />

        <Grid container spacing={0} justify="center" wrap="nowrap">
          <Grid item style={{ width: "85%", position: "relative" }}>
            <BackgroundCanvas
              scaleAndPan={this.state.scaleAndPan}
              imgSrc={this.imageSource}
              updateImageDimensions={this.updateImageDimensions}
              canvasPositionAndSize={this.state.viewportPositionAndSize}
              setCanvasPositionAndSize={this.setViewportPositionAndSize}
              contrast={this.state.contrast}
              brightness={this.state.brightness}
            />

            <SplineCanvas
              scaleAndPan={this.state.scaleAndPan}
              isActive={this.state.activeTool === Tools.spline}
              annotationsObject={this.annotationsObject}
              imageWidth={this.state.imageWidth}
              imageHeight={this.state.imageHeight}
              canvasPositionAndSize={this.state.viewportPositionAndSize}
              setCanvasPositionAndSize={this.setViewportPositionAndSize}
            />

            <PaintbrushCanvas
              scaleAndPan={this.state.scaleAndPan}
              brushType={this.state.activeTool}
              annotationsObject={this.annotationsObject}
              imageWidth={this.state.imageWidth}
              imageHeight={this.state.imageHeight}
              canvasPositionAndSize={this.state.viewportPositionAndSize}
              setCanvasPositionAndSize={this.setViewportPositionAndSize}
            />
          </Grid>

          <Grid item style={{ width: 200, position: "relative" }}>
            <div style={{ height: 200 }}>
              <BackgroundMinimap
                scaleAndPan={this.state.scaleAndPan}
                setScaleAndPan={this.setScaleAndPan}
                imgSrc={this.imageSource}
                imageWidth={this.state.imageWidth}
                imageHeight={this.state.imageHeight}
                canvasPositionAndSize={this.state.viewportPositionAndSize}
                minimapPositionAndSize={this.state.minimapPositionAndSize}
                setMinimapPositionAndSize={this.setMinimapPositionAndSize}
                contrast={this.state.contrast}
                brightness={this.state.brightness}
                setCanvasPositionAndSize={this.setViewportPositionAndSize}
              />
            </div>

            <Grid container justify="center">
              <ButtonGroup size="small" style={{ margin: "5px" }}>
                <Tooltip title="Zoom out">
                  <Button id="zoom-out" onClick={this.decrementScale}>
                    <ZoomOut />
                  </Button>
                </Tooltip>
                <Tooltip title="Reset zoom and pan">
                  <Button id="reset" onClick={this.resetScaleAndPan}>
                    <AspectRatio />
                  </Button>
                </Tooltip>
                <Tooltip title="Zoom in">
                  <Button id="zoom-in" onClick={this.incrementScale}>
                    <ZoomIn />
                  </Button>
                </Tooltip>
              </ButtonGroup>

              <ButtonGroup size="small" style={{ marginBottom: "5px" }}>
                <Tooltip title="Pan up">
                  <Button id="pan-up" onClick={this.incrementPanY}>
                    <KeyboardArrowUp />
                  </Button>
                </Tooltip>
                <ButtonGroup size="small">
                  <Tooltip title="Pan left">
                    <Button id="pan-left" onClick={this.incrementPanX}>
                      <KeyboardArrowLeft />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Pan right">
                    <Button id="pan-right" onClick={this.decrementPanX}>
                      <KeyboardArrowRight />
                    </Button>
                  </Tooltip>
                </ButtonGroup>
                <Tooltip title="Pan down">
                  <Button id="pan-down" onClick={this.decrementPanY}>
                    <KeyboardArrowDown />
                  </Button>
                </Tooltip>
              </ButtonGroup>
            </Grid>

            <Accordion
              expanded={this.state.expanded === "background-toolbox"}
              onChange={this.handleToolboxChange("background-toolbox")}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                id="background-toolbox"
              >
                <Typography>Background</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={0} justify="center" wrap="nowrap">
                  <Grid item style={{ width: "85%", position: "relative" }}>
                    <BaseSlider
                      value={this.state.contrast}
                      config={SLIDER_CONFIG[Sliders.contrast]}
                      onChange={this.handleSliderChange}
                    />
                    <BaseSlider
                      value={this.state.brightness}
                      config={SLIDER_CONFIG[Sliders.brightness]}
                      onChange={this.handleSliderChange}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <PaintbrushUI
              expanded={this.state.expanded === "paintbrush-toolbox"}
              activeTool={this.state.activeTool}
              onChange={this.handleToolboxChange("paintbrush-toolbox")}
              activateTool={this.activateTool}
            />

            <Accordion
              expanded={this.state.expanded === "spline-toolbox"}
              onChange={this.handleToolboxChange("spline-toolbox")}
            >
              <AccordionSummary expandIcon={<ExpandMore />} id="spline-toolbox">
                <Typography>Splines</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Tooltip title="Activate spline">
                  <IconButton
                    id="activate-spline"
                    onClick={this.selectSplineTool}
                    color={
                      this.state.activeTool === Tools.spline
                        ? "secondary"
                        : "default"
                    }
                  >
                    <Brush />
                  </IconButton>
                </Tooltip>
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={this.state.expanded === "labels-toolbox"}
              onChange={this.handleToolboxChange("labels-toolbox")}
            >
              <AccordionSummary expandIcon={<ExpandMore />} id="labels-toolbox">
                <Typography>Labels</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Labels
                  annotationObject={this.annotationsObject}
                  presetLabels={this.presetLabels}
                  activeAnnotationID={this.state.activeAnnotationID}
                />
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}
