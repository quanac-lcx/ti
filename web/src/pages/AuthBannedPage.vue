<script setup lang="ts">
import TiLayout from "../layouts/TiLayout.vue";
</script>

<template>
  <TiLayout
    title="出错了"
    subtitle="保存站有题 / 错误"
    :use-panel="false"
  >
    <section class="auth-banned-page">
      <div class="banned-card">
        <div class="banned-icon" aria-hidden="true">
          <i class="fa-solid fa-user-slash"></i>
        </div>
        <h1 class="banned-title">你已被封禁！</h1>
        <p class="banned-text">封禁，你已被。</p>
        <p class="banned-text">You is ban. SOS: i@hiac.me</p>
      </div>
    </section>
  </TiLayout>
</template>
