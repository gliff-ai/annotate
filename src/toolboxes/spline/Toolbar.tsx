import { Component, ReactElement, MouseEvent } from "react";
import { ButtonGroup, Popover } from "@material-ui/core";
import { BaseIconButton } from "@gliff-ai/style";
import { Toolbox, Toolboxes } from "@/Toolboxes";
import { ToolboxTooltips } from "./Toolbox";
import { useSplineStore } from "./Store";

const events = ["selectSpline"] as const;

interface SubMenuProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClose: (event: MouseEvent) => void;
}

const Submenu = (props: SubMenuProps): ReactElement => {
  const [spline, setSpline] = useSplineStore();

  function selectSpline() {
    setSpline({ splineType: ToolboxTooltips.spline.name });
  }

  function selectLassoSpline() {
    setSpline({ splineType: ToolboxTooltips.lassospline.name });
  }

  // function selectMagicSpline() {
  //   setSpline({ splineType: ToolboxTooltips.magicspline.name });
  // }

  function closeSpline() {
    document.dispatchEvent(
      new CustomEvent("closeSpline", { detail: Toolboxes.spline })
    );
  }

  function convertSpline() {
    document.dispatchEvent(
      new CustomEvent("convertSpline", { detail: Toolboxes.spline })
    );
  }

  return (
    <Popover
      open={props.isOpen}
      anchorEl={props.anchorElement}
      onClose={props.onClose}
    >
      <ButtonGroup size="small" id="spline-toolbar">
        <BaseIconButton
          tooltip={ToolboxTooltips.spline}
          onClick={selectSpline}
          fill={spline.splineType === ToolboxTooltips.spline.name}
        />
        <BaseIconButton
          tooltip={ToolboxTooltips.lassospline}
          onClick={selectLassoSpline}
          fill={spline.splineType === ToolboxTooltips.lassospline.name}
        />
        {/* <BaseIconButton
          tooltip={ToolboxTooltips.magicspline}
          onClick={selectMagicSpline}
          fill={spline.splineType === ToolboxTooltips.magicspline.name}
        /> */}
        <BaseIconButton
          tooltip={ToolboxTooltips.closespline}
          onClick={closeSpline}
          fill={false}
        />
        <BaseIconButton
          tooltip={ToolboxTooltips.convertspline}
          onClick={convertSpline}
          fill={false}
        />
      </ButtonGroup>
    </Popover>
  );
};
interface Event extends CustomEvent {
  type: typeof events[number];
}

interface Props {
  buttonClicked: string;
  setButtonClicked: (buttonName: string) => void;
  activateToolbox: (activeTool: Toolbox) => void;
  handleOpen: (
    event?: MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
  onClose: (event: MouseEvent) => void;
  anchorElement: HTMLButtonElement | null;
  isTyping: () => boolean;
}

class Toolbar extends Component<Props> {
  private refSplinePopover: HTMLButtonElement;

  constructor(props: Props) {
    super(props);
    this.refSplinePopover = null;
  }

  componentDidMount = (): void => {
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
    if (event.detail === Toolboxes.spline) {
      this[event.type]?.call(this);
    }
  };

  selectSpline = (): void => {
    if (this.props.isTyping()) return;
    this.props.handleOpen()(this.refSplinePopover);
    this.props.setButtonClicked(ToolboxTooltips.spline.name);
    this.props.activateToolbox(Toolboxes.spline);
  };

  render = (): ReactElement => (
    <>
      <BaseIconButton
        tooltip={ToolboxTooltips.spline}
        onClick={this.selectSpline}
        fill={this.props.buttonClicked === ToolboxTooltips.spline.name}
        setRefCallback={(ref) => {
          this.refSplinePopover = ref;
        }}
      />
      <Submenu
        isOpen={
          this.props.buttonClicked === ToolboxTooltips.spline.name &&
          Boolean(this.props.anchorElement)
        }
        anchorElement={this.props.anchorElement}
        onClose={this.props.onClose}
      />
    </>
  );
}

export { Toolbar };
