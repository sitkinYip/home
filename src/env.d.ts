/// <reference types="vite/client" />

export {};

declare module "@vue/runtime-core" {
  export interface ComponentCustomProperties {
    toVpx: (n: number) => string;
  }
}

// 兼容某些版本的 Volar 或配置
declare module "vue" {
  export interface ComponentCustomProperties {
    toVpx: (n: number) => string;
  }
}
