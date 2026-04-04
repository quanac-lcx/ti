<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: "页面加载中"
  }
);
</script>

<template>
  <div class="ui-loading-bar" role="status" aria-live="polite" :aria-label="label">
    <div class="ui-loading-bar__track">
      <span class="ui-loading-bar__value"></span>
    </div>
  </div>
</template>

<style scoped>
.ui-loading-bar {
  width: 100%;
}

.ui-loading-bar__track {
  position: relative;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-bg-subtle);
  box-shadow: inset 0 0 0 1px var(--app-border);
}

.ui-loading-bar__value {
  position: absolute;
  inset: 0 auto 0 0;
  width: min(28%, 220px);
  min-width: 72px;
  border-radius: inherit;
  background: var(--app-primary);
  box-shadow: none;
  animation: ui-loading-bar-slide 1.15s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes ui-loading-bar-slide {
  from {
    transform: translateX(-120%);
  }

  to {
    transform: translateX(420%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-loading-bar__value {
    animation-duration: 2s;
  }
}
</style>
