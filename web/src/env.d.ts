/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module "markdown-it";
declare module "markdown-it-emoji" {
  export const bare: any;
  export const full: any;
  export const light: any;
}
declare module "markdown-it-sub";
declare module "markdown-it-sup";
declare module "markdown-it-footnote";
declare module "markdown-it-texmath";
