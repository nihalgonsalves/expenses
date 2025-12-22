import { atom, useSetAtom, type WritableAtom } from "jotai";

export const tooltipPortalRootElementAtom = atom<HTMLDivElement | null>(null);

export const useAtomElementRef = <T extends HTMLElement>(
  anAtom: WritableAtom<unknown, [T | null], unknown>,
) => {
  const setElement = useSetAtom(anAtom);

  return (element: T | null) => {
    setElement(element);

    return () => {
      setElement(null);
    };
  };
};
