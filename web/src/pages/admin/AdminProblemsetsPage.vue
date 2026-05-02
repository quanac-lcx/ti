<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  deleteAdminProblemset,
  fetchAdminProblemsets,
  updateAdminProblemset,
  type AdminProblemset
} from "../../api/admin";
import { askConfirm, notifyError, notifySuccess, notifyWarning } from "../../composables/feedback";

const { t } = useI18n();
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
    notifyWarning(t("admin.problemsets.selectEditFirst"));
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
    notifySuccess(t("admin.problemsets.updated", { id: updated.id }));
    await loadProblemsets();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

async function deleteOne(id: number) {
  const confirmed = await askConfirm({
    title: t("admin.problemsets.deleteTitle"),
    message: t("admin.problemsets.deleteMessage", { id }),
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
    danger: true
  });
  if (!confirmed) return;
  try {
    await deleteAdminProblemset(id);
    notifySuccess(t("admin.problemsets.deleted", { id }));
    await loadProblemsets();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

async function deleteSelected() {
  if (selected.value.length === 0) {
    notifyWarning(t("admin.problemsets.selectFirst"));
    return;
  }
  const confirmed = await askConfirm({
    title: t("admin.problemsets.bulkDeleteTitle"),
    message: t("admin.problemsets.bulkDeleteMessage", { count: selected.value.length }),
    confirmText: t("admin.problemsets.bulkDeleteConfirm"),
    cancelText: t("common.cancel"),
    danger: true
  });
  if (!confirmed) return;

  let success = 0;
  for (const id of selected.value) {
    try {
      await deleteAdminProblemset(id);
      success += 1;
    } catch (err) {
      notifyError(t("admin.problemsets.deleteFailed", { id, reason: String((err as Error)?.message ?? err) }));
    }
  }
  notifySuccess(t("admin.problemsets.bulkDeleted", { success, total: selected.value.length }));
  selected.value = [];
  await loadProblemsets();
}

onMounted(loadProblemsets);
</script>

<template>
  <div class="admin-page">
    <nav class="admin-anchor-nav">
      <a href="#problemset-list">{{ t("admin.problemsets.listAnchor") }}</a>
      <a href="#problemset-edit">{{ t("admin.problemsets.editAnchor") }}</a>
      <RouterLink to="/problemset/_new">{{ t("admin.problemsets.createAnchor") }}</RouterLink>
    </nav>

    <section id="problemset-list" class="admin-card">
      <div class="admin-head">
        <h3>{{ t("admin.problemsets.listHeading") }}</h3>
        <div class="actions">
          <button class="admin-btn" type="button" @click="loadProblemsets">{{ t("common.refresh") }}</button>
          <button class="admin-btn" type="button" @click="toggleAll">{{ allSelected ? t("admin.common.clearSelection") : t("admin.common.selectAll") }}</button>
          <button class="admin-btn danger" type="button" @click="deleteSelected">{{ t("admin.common.bulkDelete") }}</button>
        </div>
      </div>
      <p v-if="loading">{{ t("common.loading") }}</p>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>{{ t("admin.common.select") }}</th>
            <th>ID</th>
            <th>{{ t("problemset.common.name") }}</th>
            <th>{{ t("admin.problemsets.durationHours") }}</th>
            <th>{{ t("admin.problemsets.questionCount") }}</th>
            <th>{{ t("admin.common.actions") }}</th>
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
              <button class="admin-btn" type="button" @click="startEdit(item)">{{ t("common.edit") }}</button>
              <button class="admin-btn danger" type="button" @click="deleteOne(item.id)">{{ t("common.delete") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section id="problemset-edit" class="admin-card">
      <h3>{{ t("admin.problemsets.editHeading") }}</h3>
      <p class="admin-hint">{{ t("admin.problemsets.editHint") }}</p>
      <div class="admin-form-grid">
        <label>
          <span>ID</span>
          <input v-model="editForm.id" type="number" min="1" />
        </label>
        <label>
          <span>{{ t("problemset.common.name") }}</span>
          <input v-model.trim="editForm.title" type="text" />
        </label>
        <label>
          <span>{{ t("problemset.common.description") }}</span>
          <textarea v-model="editForm.description" rows="3"></textarea>
        </label>
        <label>
          <span>{{ t("problemset.common.durationMinutes") }}</span>
          <input v-model.number="editForm.durationMinutes" type="number" min="1" />
        </label>
      </div>
      <div class="admin-actions">
        <button class="admin-btn primary" type="button" @click="submitEdit">{{ t("admin.problemsets.save") }}</button>
        <button class="admin-btn" type="button" @click="resetEditForm">{{ t("common.reset") }}</button>
      </div>
    </section>
  </div>
</template>
