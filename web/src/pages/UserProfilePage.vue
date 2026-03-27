<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { getUserByUid, type AuthUser } from "../api/auth";

const route = useRoute();
const loading = ref(true);
const error = ref("");
const user = ref<AuthUser | null>(null);

const uid = computed(() => String(route.params.uid ?? "").trim());

const loadProfile = async () => {
  if (!uid.value) {
    error.value = "uid 无效";
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    user.value = await getUserByUid(uid.value);
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadProfile);
watch(() => route.params.uid, loadProfile);
</script>

<template>
  <TiLayout title="个人中心" subtitle="洛谷有题 / 用户中心">
    <section v-if="loading" class="card">加载中...</section>
    <section v-else-if="error" class="card error">{{ error }}</section>
    <section v-else-if="user" class="card profile">
      <img class="avatar" :src="user.avatarUrl" :alt="user.username" />
      <div class="meta">
        <h2>{{ user.username }}</h2>
        <p><strong>UID：</strong>{{ user.uid }}</p>
        <p><strong>邮箱：</strong>{{ user.email }}</p>
        <p><strong>注册时间：</strong>{{ user.createdAt }}</p>
      </div>
    </section>
  </TiLayout>
</template>

<style scoped>
.card {
  padding: 20px;
  border-top: 1px solid #ececec;
}

.error {
  color: #d9534f;
}

.profile {
  display: flex;
  align-items: center;
  gap: 18px;
}

.avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  border: 1px solid #ddd;
}

.meta h2 {
  margin: 0 0 8px;
}

.meta p {
  margin: 4px 0;
  color: #555;
}
</style>

