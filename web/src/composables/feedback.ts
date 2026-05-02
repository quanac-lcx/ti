import { reactive } from "vue";
import { translate } from "../i18n";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  type: ToastType;
  duration: number;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  visible: boolean;
  resolve: (value: boolean) => void;
}

interface FeedbackState {
  toasts: ToastItem[];
  confirm: ConfirmState | null;
}

const state = reactive<FeedbackState>({
  toasts: [],
  confirm: null
});

let toastIdSeed = 1;

export function useFeedbackState() {
  return state;
}

export function notify(input: string | ToastOptions): number {
  const options = typeof input === "string" ? { message: input } : input;
  const item: ToastItem = {
    id: toastIdSeed++,
    title: options.title,
    message: options.message,
    type: options.type ?? "info",
    duration: options.duration ?? 2800
  };
  state.toasts.push(item);
  window.setTimeout(() => dismissToast(item.id), item.duration);
  return item.id;
}

export function notifySuccess(message: string, title = translate("common.success")) {
  return notify({ type: "success", title, message });
}

export function notifyError(message: string, title = translate("common.error")) {
  return notify({ type: "error", title, message, duration: 4200 });
}

export function notifyWarning(message: string, title = translate("common.tip")) {
  return notify({ type: "warning", title, message, duration: 3600 });
}

export function dismissToast(id: number) {
  const index = state.toasts.findIndex((item) => item.id === id);
  if (index >= 0) state.toasts.splice(index, 1);
}

export function askConfirm(options: ConfirmOptions): Promise<boolean> {
  if (state.confirm) {
    state.confirm.resolve(false);
    state.confirm = null;
  }
  return new Promise<boolean>((resolve) => {
    state.confirm = {
      visible: true,
      title: options.title ?? translate("common.pleaseConfirm"),
      message: options.message,
      confirmText: options.confirmText ?? translate("confirm.ok"),
      cancelText: options.cancelText ?? translate("confirm.cancel"),
      danger: Boolean(options.danger),
      resolve
    };
  });
}

export function closeConfirm(result: boolean) {
  if (!state.confirm) return;
  const resolver = state.confirm.resolve;
  state.confirm = null;
  resolver(result);
}
