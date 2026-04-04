<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  deleteAdminProblemset,
  fetchAdminProblemsets,
  updateAdminProblemset,
  type AdminProblemset
} from "../../api/admin";
import { askConfirm, notifyError, notifySuccess, notifyWarning } from "../../composables/feedback";

const loading = ref(false);
const problemsets = ref<AdminProblemset[]>([]);
const selected = ref<number[]>([]);
const editingId = ref<number | null>(null);

const selectedSet = computed(() => new Set(selected.value));
const allSelected = computed(() => problemsets.value.length > 0 && selected.value.length === problemsets.value.length);

const editForm = reactive({
  id: "",
  title: "",
  description: "",
  durationMinutes: 120
});

function resetEditForm() {
  editForm.id = "";
  editForm.title = "";
  editForm.description = "";
  editForm.durationMinutes = 120;
}

async function loadProblemsets() {
  loading.value = true;
  try {
    problemsets.value = await fetchAdminProblemsets();
    selected.value = selected.value.filter((id) => problemsets.value.some((item) => item.id === id));
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    loading.value = false;
  }
}

function toggleAll() {
  if (allSelected.value) {
    selected.value = [];
  } else {
    selected.value = problemsets.value.map((item) => item.id);
  }
}

function toggleOne(id: number) {
  if (selectedSet.value.has(id)) {
    selected.value = selected.value.filter((item) => item !== id);
  } else {
    selected.value = [...selected.value, id];
  }
}

function startEdit(item: AdminProblemset) {
  editingId.value = item.id;
  editForm.id = String(item.id);
  editForm.title = item.title;
  editForm.description = item.description;
  editForm.durationMinutes = Math.round((item.durationHours ?? 2) * 60);
  document.getElementById("problemset-edit")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function submitEdit() {
  if (!editingId.value) {
    notifyWarning("请先从试卷列表选择“编辑”。");
    return;
  }
  try {
    const updated = await updateAdminProblemset(editingId.value, {
      id: Number(editForm.id),
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      durationMinutes: Number(editForm.durationMinutes)
    });
    editingId.value = updated.id;
    notifySuccess(`试卷 ${updated.id} 更新成功。`);
    await loadProblemsets();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

async function deleteOne(id: number) {
  const confirmed = await askConfirm({
    title: "删除试卷",
    message: `确认删除试卷 ${id} 及其所有试题吗？`,
    confirmText: "删除",
    cancelText: "取消",
    danger: true
  });
  if (!confirmed) return;
  try {
    await deleteAdminProblemset(id);
    notifySuccess(`试卷 ${id} 已删除。`);
    await loadProblemsets();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

async function deleteSelected() {
  if (selected.value.length === 0) {
    notifyWarning("请先勾选试卷。");
    return;
  }
  const confirmed = await askConfirm({
    title: "批量删除试卷",
    message: `将删除 ${selected.value.length} 个试卷及其题目，此操作不可恢复。`,
    confirmText: "确认删除",
    cancelText: "取消",
    danger: true
  });
  if (!confirmed) return;

  let success = 0;
  for (const id of selected.value) {
    try {
      await deleteAdminProblemset(id);
      success += 1;
    } catch (err) {
      notifyError(`试卷 ${id} 删除失败：${String((err as Error)?.message ?? err)}`);
    }
  }
  notifySuccess(`批量删除完成：${success}/${selected.value.length}`);
  selected.value = [];
  await loadProblemsets();
}

onMounted(loadProblemsets);
</script>

<template>
  <div class="admin-page">
    <nav class="admin-anchor-nav">
      <a href="#problemset-list">试卷列表</a>
      <a href="#problemset-edit">编辑试卷</a>
      <RouterLink to="/problemset/_new">创建试卷</RouterLink>
    </nav>

    <section id="problemset-list" class="admin-card">
      <div class="admin-head">
        <h3>试卷列表</h3>
        <div class="actions">
          <button class="admin-btn" type="button" @click="loadProblemsets">刷新</button>
          <button class="admin-btn" type="button" @click="toggleAll">{{ allSelected ? "取消全选" : "全选" }}</button>
          <button class="admin-btn danger" type="button" @click="deleteSelected">批量删除</button>
        </div>
      </div>
      <p v-if="loading">加载中...</p>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>选择</th>
            <th>ID</th>
            <th>名称</th>
            <th>时长(小时)</th>
            <th>题目数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in problemsets" :key="item.id">
            <td><input type="checkbox" :checked="selectedSet.has(item.id)" @change="toggleOne(item.id)" /></td>
            <td>{{ item.id }}</td>
            <td>{{ item.title }}</td>
            <td>{{ item.durationHours }}</td>
            <td>{{ item.questionCount }}</td>
            <td class="actions">
              <button class="admin-btn" type="button" @click="startEdit(item)">编辑</button>
              <button class="admin-btn danger" type="button" @click="deleteOne(item.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section id="problemset-edit" class="admin-card">
      <h3>编辑试卷</h3>
      <p class="admin-hint">先在试卷列表中点击“编辑”。</p>
      <div class="admin-form-grid">
        <label>
          <span>ID</span>
          <input v-model="editForm.id" type="number" min="1" />
        </label>
        <label>
          <span>名称</span>
          <input v-model.trim="editForm.title" type="text" />
        </label>
        <label>
          <span>描述</span>
          <textarea v-model="editForm.description" rows="3"></textarea>
        </label>
        <label>
          <span>时长（分钟）</span>
          <input v-model.number="editForm.durationMinutes" type="number" min="1" />
        </label>
      </div>
      <div class="admin-actions">
        <button class="admin-btn primary" type="button" @click="submitEdit">保存试卷</button>
        <button class="admin-btn" type="button" @click="resetEditForm">重置</button>
      </div>
    </section>
  </div>
</template>
