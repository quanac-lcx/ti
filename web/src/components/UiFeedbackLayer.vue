<script setup lang="ts">
import { computed } from "vue";
import { closeConfirm, dismissToast, useFeedbackState } from "../composables/feedback";
import { useI18n } from "vue-i18n";

const state = useFeedbackState();
const { t } = useI18n();

const toasts = computed(() => state.toasts);
const confirm = computed(() => state.confirm);

function onMaskClick() {
  closeConfirm(false);
}
</script>

<template>
  <Teleport to="body">
    <div class="feedback-toast-stack">
      <div
        v-for="item in toasts"
        :key="item.id"
        class="feedback-toast"
        :class="`is-${item.type}`"
      >
        <div class="feedback-toast-head">
          <strong>{{ item.title || t("feedback.defaultToastTitle") }}</strong>
          <button type="button" class="feedback-close" @click="dismissToast(item.id)">×</button>
        </div>
        <p>{{ item.message }}</p>
      </div>
    </div>

    <div v-if="confirm?.visible" class="feedback-mask" @click.self="onMaskClick">
      <div class="feedback-confirm">
        <button type="button" class="feedback-close modal-close" @click="closeConfirm(false)">×</button>
        <h3>{{ confirm.title }}</h3>
        <p>{{ confirm.message }}</p>
        <div class="feedback-actions">
          <button
            type="button"
            class="confirm-btn"
            :class="{ danger: confirm.danger }"
            @click="closeConfirm(true)"
          >
            {{ confirm.confirmText }}
          </button>
          <button type="button" class="confirm-btn ghost" @click="closeConfirm(false)">
            {{ confirm.cancelText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
