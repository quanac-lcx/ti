<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";

const route = useRoute();

const problemsetId = computed(() => Number(route.params.id) || 1001);
const isExam = computed(() => route.path.endsWith("/exam"));

const pageTitle = computed(() =>
  isExam.value ? `${problemsetId.value} - 限时测试` : `${problemsetId.value} - 自由练习`
);

const modeDescription = computed(() =>
  isExam.value
    ? "这里是限时测试入口页。后续接入后端后可对接计时、自动保存、提交判分等能力。"
    : "这里是自由练习入口页。后续接入后端后可对接练习记录、错题本、进度跟踪等能力。"
);
</script>

<template>
  <TiLayout :title="pageTitle" subtitle="洛谷有题 / 试题列表 / 模式入口">
    <section class="mode-shell">
      <div class="mode-card">
        <h2>{{ isExam ? "限时测试模式" : "自由练习模式" }}</h2>
        <p>{{ modeDescription }}</p>
        <div class="actions">
          <router-link class="btn btn-primary" :to="`/problemset/${problemsetId}`">返回题面</router-link>
          <router-link class="btn" to="/problemset">返回题库</router-link>
        </div>
      </div>
    </section>
  </TiLayout>
</template>

<style scoped>
.mode-shell {
  padding: 10px 12px;
}

.mode-card {
  border: 1px solid #ececec;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 18px;
}

.mode-card h2 {
  margin: 0 0 10px;
  font-size: 20px;
  color: #222;
}

.mode-card p {
  margin: 0;
  line-height: 1.8;
  color: #555;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.btn {
  height: 36px;
  padding: 0 14px;
  border: 1px solid #cfcfcf;
  border-radius: 4px;
  background: #fff;
  color: #333;
  font-size: 14px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  border-color: #3297db;
  background: #3297db;
  color: #fff;
}
</style>

