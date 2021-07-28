import { ReactElement, MouseEvent } from "react";
import { ButtonGroup, Popover } from "@material-ui/core";
import { BaseIconButton } from "@/components/BaseIconButton";
import { tooltips } from "@/components/tooltips";
import { useSplineStore } from "./Store";

interface Props {
  isOpen: boolean;
  anchorElement: HTMLButtonElement | null;
  onClose: (event: MouseEvent) => void;
}

const Submenu = (props: Props): ReactElement => {
  const [spline, setSpline] = useSplineStore();

  function selectSpline() {
    setSpline({ splineType: tooltips.spline.name });
  }

  function selectLassoSpline() {
    setSpline({ splineType: tooltips.lassospline.name });
  }

  // function selectMagicSpline() {
  //   setSpline({ splineType: tooltips.magicspline.name });
  // }

  function closeSpline() {
    document.dispatchEvent(
      new CustomEvent("closeSpline", { detail: "spline" })
    );
  }

  function fillSpline() {
    document.dispatchEvent(new CustomEvent("fillSpline", { detail: "spline" }));
  }

  return (
    <Popover
      open={props.isOpen}
      anchorEl={props.anchorElement}
      onClose={props.onClose}
    >
      <ButtonGroup size="small" id="spline-toolbar">
        <BaseIconButton
          tooltip={tooltips.spline}
          onClick={selectSpline}
          fill={spline.splineType === tooltips.spline.name}
        />
        <BaseIconButton
          tooltip={tooltips.lassospline}
          onClick={selectLassoSpline}
          fill={spline.splineType === tooltips.lassospline.name}
        />
        {/* <BaseIconButton
        tooltip={tooltips.magicspline}
        onClick={selectMagicSpline}
        fill={spline.splineType === tooltips.magicspline.name}
      /> */}
        <BaseIconButton
          tooltip={tooltips.closespline}
          onClick={closeSpline}
          fill={false}
        />
        <BaseIconButton
          tooltip={tooltips.fillspline}
          onClick={fillSpline}
          fill={false}
        />
      </ButtonGroup>
    </Popover>
  );
};

export { Submenu };
