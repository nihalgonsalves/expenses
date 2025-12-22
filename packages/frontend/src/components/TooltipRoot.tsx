import {
  tooltipPortalRootElementAtom,
  useAtomElementRef,
} from "#/state/portals";

export const TooltipRoot = () => {
  const ref = useAtomElementRef<HTMLDivElement>(tooltipPortalRootElementAtom);

  return <div ref={ref} className="contents" />;
};
