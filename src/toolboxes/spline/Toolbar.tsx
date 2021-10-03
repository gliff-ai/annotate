import { Component, ReactElement, MouseEvent } from "react";
import { ButtonGroup, Popover } from "@material-ui/core";
import { BaseIconButton } from "@gliff-ai/style";
import { Toolbox, Toolboxes } from "@/Toolboxes";
import { Tools } from "./Toolbox";
import { useSplineStore } from "./Store";

const events = ["selectSpline"] as const;

interface SubmenuProps {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClose: (event: MouseEvent) => void;
}

const Submenu = (props: SubmenuProps): ReactElement => {
  const [spline, setSpline] = useSplineStore();

  const selectSpline = () => {
    setSpline({ splineType: Tools.spline.name });
  };

  const selectLassoSpline = () => {
    setSpline({ splineType: Tools.lassospline.name });
  };

  // function selectMagicSpline() {
  //   setSpline({ splineType: Tools.magicspline.name });
  // }

  const closeSpline = () => {
    document.dispatchEvent(
      new CustomEvent("closeSpline", { detail: Toolboxes.spline })
    );
  };

  const convertSpline = () => {
    document.dispatchEvent(
      new CustomEvent("convertSpline", { detail: Toolboxes.spline })
    );
  };

  return (
    <Popover
      open={props.isOpen}
      anchorEl={props.anchorElement}
      onClose={props.onClose}
    >
      <ButtonGroup size="small" id="spline-toolbar">
        <BaseIconButton
          tooltip={Tools.spline}
          onClick={selectSpline}
          fill={spline.splineType === Tools.spline.name}
        />
        <BaseIconButton
          tooltip={Tools.lassospline}
          onClick={selectLassoSpline}
          fill={spline.splineType === Tools.lassospline.name}
        />
        {/* <BaseIconButton
          tooltip={Tools.magicspline}
          onClick={() => selectMagicSpline}
          fill={spline.splineType === Tools.magicspline.name}
        /> */}
        <BaseIconButton
          tooltip={Tools.closespline}
          onClick={closeSpline}
          fill={false}
        />
        <BaseIconButton
          tooltip={Tools.convertspline}
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
  activateToolbox: (activeToolbox: Toolbox) => void;
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
    this.props.setButtonClicked(Tools.spline.name);
    this.props.activateToolbox(Toolboxes.spline);
  };

  render = (): ReactElement => (
    <>
      <BaseIconButton
        tooltip={Tools.spline}
        onClick={this.selectSpline}
        fill={this.props.buttonClicked === Tools.spline.name}
        setRefCallback={(ref) => {
          this.refSplinePopover = ref;
        }}
      />
      <Submenu
        isOpen={
          this.props.buttonClicked === Tools.spline.name &&
          Boolean(this.props.anchorElement)
        }
        anchorElement={this.props.anchorElement}
        onClose={this.props.onClose}
      />
    </>
  );
}

export { Toolbar };
