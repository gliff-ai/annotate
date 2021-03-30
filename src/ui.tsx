import React, { Component, ChangeEvent, ReactNode } from "react";

import { Annotations } from "./annotation";

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
  AllOut,
  Brush,
  RadioButtonUncheckedSharp,
  Timeline,
  Gesture
} from "@material-ui/icons";

import { ThemeProvider, createMuiTheme, Theme } from "@material-ui/core/styles";

import { BackgroundCanvas, BackgroundMinimap } from "./toolboxes/background";
import { SplineCanvas } from "./toolboxes/spline";
import { PaintbrushCanvas } from "./toolboxes/paintbrush";
import { Labels } from "./components/Labels";
import { BaseSlider } from "./components/BaseSlider";
import { Sliders, SLIDER_CONFIG } from "./configSlider";
import { keydownListener } from "./keybindings";

// Define all mutually exclusive tools
enum Tools {
  paintbrush = "paintbrush",
  eraser = "eraser",
  spline = "spline",
  magicspline = "magicspline",
}

export class UserInterface extends Component {
  state: {
    scaleAndPan: {
      x: number;
      y: number;
      scale: number;
    };
    activeTool?: Tools;
    imageData?: ImageData;
    activeAnnotationID: number;
    brushSize: number;
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
  };

  annotationsObject: Annotations;
  theme: Theme;
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
      activeTool: Tools.paintbrush,
      activeAnnotationID: 0,
      brushSize: 20,
      viewportPositionAndSize: { top: 0, left: 0, width: 768, height: 768 },
      minimapPositionAndSize: { top: 0, left: 0, width: 200, height: 200 },
      expanded: false,
      brightness: SLIDER_CONFIG[Sliders.brightness].initial,
      contrast: SLIDER_CONFIG[Sliders.contrast].initial,
    };

    this.theme = createMuiTheme({
      palette: {
        type: "dark",
      },
    });
    this.imageSource = "zebrafish-heart.jpg";
    this.annotationsObject.addAnnotation(Tools[this.state.activeTool]);
    this.presetLabels = ["label-1", "label-2", "label-3"]; //TODO: find a place for this
  }

  setViewportPositionAndSize = (viewportPositionAndSize: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
  }): void => {
    viewportPositionAndSize.top ??= this.state.viewportPositionAndSize.top;
    viewportPositionAndSize.left ??= this.state.viewportPositionAndSize.left;
    viewportPositionAndSize.width ??= this.state.viewportPositionAndSize.width;
    viewportPositionAndSize.height ??= this.state.viewportPositionAndSize.height;
    this.setState({ viewportPositionAndSize });
  };

  setMinimapPositionAndSize = (minimapPositionAndSize: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
  }): void => {
    minimapPositionAndSize.top ??= this.state.minimapPositionAndSize.top;
    minimapPositionAndSize.left ??= this.state.minimapPositionAndSize.left;
    minimapPositionAndSize.width ??= this.state.minimapPositionAndSize.width;
    minimapPositionAndSize.height ??= this.state.minimapPositionAndSize.height;
    this.setState({ minimapPositionAndSize });
  };

  setScaleAndPan = (scaleAndPan: {
    scale?: number;
    x?: number;
    y?: number;
  }): void => {
    // the is for passing down to the minimap
    scaleAndPan.scale ??= this.state.scaleAndPan.scale;
    scaleAndPan.x ??= this.state.scaleAndPan.x;
    scaleAndPan.y ??= this.state.scaleAndPan.y;
    this.setState({ scaleAndPan }, this.limitPan); // this sets limitPan as a callback after state update, ensuring it will use the new scaleAndPan
  };

  limitPan = (): void => {
    // adjust pan such that image borders are not inside the canvas

    // calculate how much bigger the image is than the canvas, in canvas space:
    const imageScalingFactor = Math.min(
      this.state.viewportPositionAndSize.width / this.state.imageData.width,
      this.state.viewportPositionAndSize.height / this.state.imageData.height
    );

    const xMargin =
      this.state.imageData.width *
        imageScalingFactor *
        this.state.scaleAndPan.scale -
      this.state.viewportPositionAndSize.width;
    const yMargin =
      this.state.imageData.height *
        imageScalingFactor *
        this.state.scaleAndPan.scale -
      this.state.viewportPositionAndSize.height;

    // now calculate the allowable pan range:
    const panRangeX = Math.max(0, xMargin / 2); // scaleAndPan.x can be +-panRangeX
    const panRangeY = Math.max(0, yMargin / 2); // scaleAndPan.y can be +-panRangeY

    console.log(`panRangeX = ${panRangeX}, panRangeY = ${panRangeY}`);

    // move pan into the allowable range:
    let panX = this.state.scaleAndPan.x;
    let panY = this.state.scaleAndPan.y;
    panX = Math.min(panRangeX, Math.abs(panX)) * Math.sign(panX);
    panY = Math.min(panRangeY, Math.abs(panY)) * Math.sign(panY);

    this.setState({
      scaleAndPan: { x: panX, y: panY, scale: this.state.scaleAndPan.scale },
    });
  };

  resetScaleAndPan = (): void => {
    this.setScaleAndPan({ scale: 1, x: 0, y: 0 });
  };

  incrementScale = (): void => {
    const panMultiplier =
      (1 + this.state.scaleAndPan.scale) / this.state.scaleAndPan.scale;
    this.setScaleAndPan({
      x: this.state.scaleAndPan.x * panMultiplier,
      y: this.state.scaleAndPan.y * panMultiplier,
      scale: this.state.scaleAndPan.scale + 1,
    });
  };

  decrementScale = (): void => {
    // Zoom out only if zoomed in.
    if (this.state.scaleAndPan.scale > 1) {
      const panMultiplier =
        (this.state.scaleAndPan.scale - 1) / this.state.scaleAndPan.scale;
      this.setScaleAndPan({
        x: this.state.scaleAndPan.x * panMultiplier,
        y: this.state.scaleAndPan.y * panMultiplier,
        scale: this.state.scaleAndPan.scale - 1,
      });
    }
  };

  incrementPanX = (): void => {
    // negative is left, +ve is right...
    this.setScaleAndPan({ x: this.state.scaleAndPan.x + 20 });
  };

  decrementPanX = (): void => {
    // negative is left, +ve is right...
    this.setScaleAndPan({ x: this.state.scaleAndPan.x - 20 });
  };

  incrementPanY = (): void => {
    // negative is up, +ve is down...
    this.setScaleAndPan({ y: this.state.scaleAndPan.y + 20 });
  };

  decrementPanY = (): void => {
    // negative is up, +ve is down...
    this.setScaleAndPan({ y: this.state.scaleAndPan.y - 20 });
  };

  incrementBrush = (): void => {
    this.setState({ brushSize: this.state.brushSize + 10 });
  };

  toggleEraser = (): void => {
    this.setState({ activeTool: "eraser" });
  };

  updateImageData = (imageData: ImageData): void => {
    this.setState({
      imageData: imageData
    });
  };

  selectSplineTool = (): void => {
    // Change active tool to spline.
    if (this.state.activeTool != Tools.spline) {
      this.setState({ activeTool: Tools.spline }, () => {
        this.reuseEmptyAnnotation();
      });
    }
  };

  selectMagicSplineTool = (): void => {
    // Change active tool to magic spline
    if (this.state.activeTool != Tools.magicspline) {
        this.setState({ activeTool: Tools.magicspline }, () => {
          this.reuseEmptyAnnotation();
        });
      }
  };

  selectPaintbrushTool = (): void => {
    // Change active tool to paintbrush.
    if (this.state.activeTool != Tools.paintbrush) {
      this.setState({ activeTool: Tools.paintbrush }, () => {
        this.reuseEmptyAnnotation();
      });
    }
  };

  selectEraserTool = (): void => {
    // Change active tool to paintbrush.
    if (this.state.activeTool != Tools.eraser) {
      this.setState({ activeTool: Tools.eraser }, () => {
        this.reuseEmptyAnnotation();
      });
    }
  };

  addAnnotation = (): void => {
    this.annotationsObject.addAnnotation(Tools[this.state.activeTool]);
    this.setState({
      activeAnnotationID: this.annotationsObject.getActiveAnnotationID(),
    });
  };

  reuseEmptyAnnotation = (): void => {
    /* If the active annotation object is empty, change the value of toolbox
    to match the active tool. */
    if (this.annotationsObject.isActiveAnnotationEmpty()) {
      this.annotationsObject.setActiveAnnotationToolbox(
        Tools[this.state.activeTool]
      );
    }
  };

  handleToolboxChange = (panel: string) => (
    event: ChangeEvent,
    isExpanded: boolean
  ): void => {
    this.setState({ expanded: isExpanded ? panel : false });
  };

  handleSliderChange = (state: string) => (
    event: ChangeEvent,
    value: number
  ): void => {
    this.setState({ [state]: value });
  };

  componentDidMount = (): void => {
    document.addEventListener("keydown", keydownListener);
  };

  render = (): ReactNode => {
    return (
      <ThemeProvider theme={this.theme}>
        <CssBaseline />
        <Container disableGutters={true}>
          <AppBar>
            <Toolbar>
              <Tooltip title="Annotate new object">
                <IconButton id={"addAnnotation"} onClick={this.addAnnotation}>
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
                updateImageData={this.updateImageData}
                canvasPositionAndSize={this.state.viewportPositionAndSize}
                setCanvasPositionAndSize={this.setViewportPositionAndSize}
                contrast={this.state.contrast}
                brightness={this.state.brightness}
              />

              <SplineCanvas
                scaleAndPan={this.state.scaleAndPan}
                splineType={this.state.activeTool}
                annotationsObject={this.annotationsObject}
                imageData={this.state.imageData}
                canvasPositionAndSize={this.state.viewportPositionAndSize}
                setCanvasPositionAndSize={this.setViewportPositionAndSize}
                theme={this.theme}
              />

              <PaintbrushCanvas
                scaleAndPan={this.state.scaleAndPan}
                brushType={this.state.activeTool}
                annotationsObject={this.annotationsObject}
                imageData={this.state.imageData}
                brushRadius={this.state.brushSize}
                canvasPositionAndSize={this.state.viewportPositionAndSize}
                setCanvasPositionAndSize={this.setViewportPositionAndSize}
                theme={this.theme}
              />
            </Grid>

            <Grid item style={{ width: 200, position: "relative" }}>
              <div style={{ height: 200 }}>
                <BackgroundMinimap
                  scaleAndPan={this.state.scaleAndPan}
                  setScaleAndPan={this.setScaleAndPan}
                  imgSrc={this.imageSource}
                  imageData={this.state.imageData}
                  canvasPositionAndSize={this.state.viewportPositionAndSize}
                  minimapPositionAndSize={this.state.minimapPositionAndSize}
                  setMinimapPositionAndSize={this.setMinimapPositionAndSize}
                  contrast={this.state.contrast}
                  brightness={this.state.brightness}
                />
              </div>

              <Grid container justify="center">
                <ButtonGroup size="small" style={{ margin: "5px" }}>
                  <Tooltip title="Zoom out">
                    <Button id={"zoom-out"} onClick={this.decrementScale}>
                      <ZoomOut />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Reset zoom and pan">
                    <Button id={"reset"} onClick={this.resetScaleAndPan}>
                      <AspectRatio />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Zoom in">
                    <Button id={"zoom-in"} onClick={this.incrementScale}>
                      <ZoomIn />
                    </Button>
                  </Tooltip>
                </ButtonGroup>

                <ButtonGroup size="small" style={{ marginBottom: "5px" }}>
                  <Tooltip title="Pan up">
                    <Button id={"pan-up"} onClick={this.incrementPanY}>
                      <KeyboardArrowUp />
                    </Button>
                  </Tooltip>
                  <ButtonGroup size="small">
                    <Tooltip title="Pan left">
                      <Button id={"pan-left"} onClick={this.incrementPanX}>
                        <KeyboardArrowLeft />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Pan right">
                      <Button id={"pan-right"} onClick={this.decrementPanX}>
                        <KeyboardArrowRight />
                      </Button>
                    </Tooltip>
                  </ButtonGroup>
                  <Tooltip title="Pan down">
                    <Button id={"pan-down"} onClick={this.decrementPanY}>
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
              <Accordion
                expanded={this.state.expanded === "paintbrush-toolbox"}
                onChange={this.handleToolboxChange("paintbrush-toolbox")}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  id="paintbrush-toolbox"
                >
                  <Typography>Paintbrushes</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Tooltip title="Activate paintbrush">
                    <IconButton
                      id={"activate-paintbrush"}
                      onClick={this.selectPaintbrushTool}
                      color={
                        Tools[this.state.activeTool] === Tools.paintbrush
                          ? "secondary"
                          : "default"
                      }
                    >
                      <Brush />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Increase brush size">
                    <IconButton
                      id={"increase-paintbrush-radius"}
                      onClick={this.incrementBrush}
                    >
                      <AllOut />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Activate Eraser">
                    <IconButton
                      id={"activate-eraser"}
                      onClick={this.selectEraserTool}
                    >
                      <RadioButtonUncheckedSharp />
                    </IconButton>
                  </Tooltip>
                </AccordionDetails>
              </Accordion>
              <Accordion
                expanded={this.state.expanded === "spline-toolbox"}
                onChange={this.handleToolboxChange("spline-toolbox")}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  id="spline-toolbox"
                >
                  <Typography>Splines</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Tooltip title="Activate spline">
                    <IconButton
                      id={"activate-spline"}
                      onClick={this.selectSplineTool}
                      color={
                        Tools[this.state.activeTool] === Tools.spline
                          ? "secondary"
                          : "default"
                      }
                    >
                      <Timeline />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Magic spline">
                    <IconButton
                      id={"activate-magic-spline"}
                      onClick={this.selectMagicSplineTool}
                      color={
                        Tools[this.state.activeTool] === Tools.magicspline
                          ? "secondary"
                          : "default"
                      }
                    >
                      <Gesture />
                    </IconButton>
                  </Tooltip>
                </AccordionDetails>
              </Accordion>
              <Accordion
                expanded={this.state.expanded === "labels-toolbox"}
                onChange={this.handleToolboxChange("labels-toolbox")}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  id="labels-toolbox"
                >
                  <Typography>Labels</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Labels
                    annotationObject={this.annotationsObject}
                    presetLabels={this.presetLabels}
                    activeAnnotationID={this.state.activeAnnotationID}
                    theme={this.theme}
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </Container>
      </ThemeProvider>
    );
  };
}
