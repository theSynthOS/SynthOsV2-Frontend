// Global type declarations for third-party SDKs

declare global {
  interface Window {
    MoonPayWebSdk: {
      init: (config: any) => {
        show: () => void;
        close: () => void;
      };
    };
    Transak: {
      default: new (config: any) => {
        init: () => void;
        close: () => void;
      };
    };
    TransakSDK: {
      default: new (config: any) => {
        init: () => void;
        close: () => void;
      };
    };
  }
}

export {};
