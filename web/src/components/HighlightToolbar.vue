<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { HighlightColor } from "../composables/useTextHighlighter";

const props = defineProps<{
  x: number;
  y: number;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "highlight", color: HighlightColor): void;
  (e: "clear"): void;
  (e: "close"): void;
}>();

const { t } = useI18n();

const style = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
  display: props.visible ? "flex" : "none"
}));
</script>

<template>
  <div class="highlight-toolbar" :style="style" @mousedown.stop>
    <button
      type="button"
      class="hl-btn hl-btn-red"
      :aria-label="t('highlighter.red')"
      @mousedown.prevent.stop="emit('highlight', 'red')"
    ></button>
    <button
      type="button"
      class="hl-btn hl-btn-yellow"
      :aria-label="t('highlighter.yellow')"
      @mousedown.prevent.stop="emit('highlight', 'yellow')"
    ></button>
    <button
      type="button"
      class="hl-btn hl-btn-green"
      :aria-label="t('highlighter.green')"
      @mousedown.prevent.stop="emit('highlight', 'green')"
    ></button>
    <span class="hl-sep"></span>
    <button type="button" class="hl-clear-btn" @mousedown.prevent.stop="emit('clear')">
      {{ t('highlighter.clear') }}
    </button>
    <button type="button" class="hl-close-btn" :aria-label="t('common.cancel')" @mousedown.prevent.stop="emit('close')">
      ×
    </button>
  </div>
</template>
