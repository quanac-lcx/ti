import { computed, onMounted, onUnmounted, ref } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
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
      title: options.title ?? "确认离开当前编辑？",
      message: options.message ?? "你有尚未保存的修改，离开或刷新页面会丢失这些内容。确定继续吗？",
      confirmText: options.confirmText ?? "离开",
      cancelText: options.cancelText ?? "继续编辑",
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
