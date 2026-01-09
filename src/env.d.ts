/// <reference types="vite/client" />

export {};

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "@vue/runtime-core" {
  export interface ComponentCustomProperties {
    toVpx: (n: number) => string;
  }
}
