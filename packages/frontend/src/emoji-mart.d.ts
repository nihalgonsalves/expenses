declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends JSX.IntrinsicElements {
      "em-emoji": (
        | { id: string; shortcodes?: undefined }
        | { id?: undefined; shortcodes: string }
      ) & {
        size?: string;
        skin?: string;
      };
    }
  }
}

export {};
