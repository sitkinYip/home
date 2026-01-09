/// <reference types="vite/client" />

export {};

declare module "@vue/runtime-core" {
  export interface ComponentCustomProperties {
    toVpx: (n: number) => string;
  }
}
