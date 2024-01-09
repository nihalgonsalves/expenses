declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface IntrinsicElements {
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
