import { computed, onMounted, onUnmounted, ref } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import { translate } from "../i18n";
import { askConfirm } from "./feedback";

interface UnsavedChangesGuardOptions {
  getSnapshot: () => string;
  isEnabled?: () => boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export function useUnsavedChangesGuard(options: UnsavedChangesGuardOptions) {
  const savedSnapshot = ref<string | null>(null);
  const skipLeaveConfirmOnce = ref(false);

  const hasUnsavedChanges = computed(() => {
    if (savedSnapshot.value === null) return false;
    if (!options.isEnabled?.() && options.isEnabled !== undefined) return false;
    return options.getSnapshot() !== savedSnapshot.value;
  });

  function markCurrentSnapshotSaved() {
    savedSnapshot.value = options.getSnapshot();
  }

  function allowNextLeaveWithoutConfirm() {
    skipLeaveConfirmOnce.value = true;
  }

  async function confirmLeaveIfNeeded() {
    if (skipLeaveConfirmOnce.value) {
      skipLeaveConfirmOnce.value = false;
      return true;
    }
    if (!hasUnsavedChanges.value) return true;
    return askConfirm({
      title: options.title ?? translate("unsaved.title"),
      message: options.message ?? translate("unsaved.message"),
      confirmText: options.confirmText ?? translate("unsaved.leave"),
      cancelText: options.cancelText ?? translate("unsaved.stay"),
      danger: true
    });
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (skipLeaveConfirmOnce.value || !hasUnsavedChanges.value) return;
    event.preventDefault();
    event.returnValue = "";
  }

  onBeforeRouteLeave(confirmLeaveIfNeeded);
  onBeforeRouteUpdate(confirmLeaveIfNeeded);

  onMounted(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
  });

  onUnmounted(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  });

  return {
    hasUnsavedChanges,
    markCurrentSnapshotSaved,
    allowNextLeaveWithoutConfirm
  };
}
