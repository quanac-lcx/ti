<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  banUser,
  deleteUser,
  fetchAdminUsers,
  promoteUser,
  updateUser
} from "../../api/admin";
import type { AuthUser } from "../../api/auth";
import { askConfirm, notifyError, notifySuccess, notifyWarning } from "../../composables/feedback";
import { useAdminAccess } from "./useAdminAccess";

const { user: currentUser } = useAdminAccess();
const users = ref<AuthUser[]>([]);
const loading = ref(false);
const selected = ref<string[]>([]);
const editingUid = ref("");

const editForm = reactive({
  uid: "",
  username: "",
  email: "",
  password: ""
});

const allSelected = computed(() => users.value.length > 0 && selected.value.length === users.value.length);
const selectedSet = computed(() => new Set(selected.value));

function isSelf(uid: string) {
  return uid === currentUser?.uid;
}

async function loadUsers() {
  loading.value = true;
  try {
    users.value = await fetchAdminUsers();
    selected.value = selected.value.filter((uid) => users.value.some((item) => item.uid === uid));
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
    selected.value = users.value.map((item) => item.uid);
  }
}

function toggleOne(uid: string) {
  if (selectedSet.value.has(uid)) {
    selected.value = selected.value.filter((item) => item !== uid);
  } else {
    selected.value = [...selected.value, uid];
  }
}

function startEdit(target: AuthUser) {
  editingUid.value = target.uid;
  editForm.uid = target.uid;
  editForm.username = target.username;
  editForm.email = target.email;
  editForm.password = "";
  document.getElementById("user-edit")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function submitEdit() {
  if (!editingUid.value) {
    notifyWarning("请先从用户列表选择一个用户进行编辑。");
    return;
  }
  try {
    const updated = await updateUser(editingUid.value, {
      uid: editForm.uid.trim(),
      username: editForm.username.trim(),
      email: editForm.email.trim(),
      ...(editForm.password ? { password: editForm.password } : {})
    });
    editingUid.value = updated.uid;
    editForm.password = "";
    notifySuccess(`用户 ${updated.uid} 更新成功。`);
    await loadUsers();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

async function runBatch(title: string, message: string, task: (uid: string) => Promise<void>) {
  if (selected.value.length === 0) {
    notifyWarning("请先勾选要操作的用户。");
    return;
  }
  const confirmed = await askConfirm({
    title,
    message: `${message}\n当前选中：${selected.value.length} 人`,
    confirmText: "继续执行",
    cancelText: "取消",
    danger: true
  });
  if (!confirmed) return;

  let success = 0;
  for (const uid of selected.value) {
    try {
      await task(uid);
      success += 1;
    } catch (err) {
      notifyError(`用户 ${uid} 处理失败：${String((err as Error)?.message ?? err)}`);
    }
  }
  notifySuccess(`批量操作完成：成功 ${success}/${selected.value.length}。`);
  await loadUsers();
}

async function batchPromote() {
  await runBatch("批量提权", "将选中用户提升为管理员。", async (uid) => {
    await updateUser(uid, { isAdmin: true });
  });
}

async function batchDemote() {
  await runBatch("批量解除管理员", "将移除选中用户的管理员权限。", async (uid) => {
    if (isSelf(uid)) return;
    await updateUser(uid, { isAdmin: false });
  });
}

async function batchBan(nextBanned: boolean) {
  await runBatch(nextBanned ? "批量封禁" : "批量解封", nextBanned ? "将封禁选中用户。" : "将解封选中用户。", async (uid) => {
    if (nextBanned && isSelf(uid)) return;
    await banUser(uid, nextBanned);
  });
}

async function batchDelete() {
  await runBatch("批量删除用户", "删除后不可恢复。", async (uid) => {
    if (isSelf(uid)) return;
    await deleteUser(uid);
  });
}

async function singlePromote(uid: string) {
  try {
    const target = users.value.find((item) => item.uid === uid);
    const nextAdmin = !Boolean(target?.isAdmin);
    if (!nextAdmin && isSelf(uid)) {
      notifyWarning("不能解除当前登录管理员自己的权限。");
      return;
    }
    if (nextAdmin) {
      await promoteUser(uid);
    } else {
      await updateUser(uid, { isAdmin: false });
    }
    notifySuccess(`${uid} 已${nextAdmin ? "提升为" : "解除"}管理员。`);
    await loadUsers();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

async function singleToggleBan(uid: string, banned: boolean) {
  try {
    if (banned && isSelf(uid)) {
      notifyWarning("不能封禁当前登录管理员。");
      return;
    }
    await banUser(uid, banned);
    notifySuccess(`${uid} 已${banned ? "封禁" : "解封"}。`);
    await loadUsers();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

onMounted(loadUsers);
</script>

<template>
  <div class="admin-page">
    <nav class="admin-anchor-nav">
      <a href="#users-table">用户列表</a>
      <a href="#user-edit">编辑用户</a>
    </nav>

    <section id="users-table" class="admin-card">
      <div class="admin-head">
        <h3>用户列表</h3>
        <button class="admin-btn" type="button" @click="loadUsers">刷新</button>
      </div>
      <div class="admin-toolbar">
        <button class="admin-btn" type="button" @click="toggleAll">{{ allSelected ? "取消全选" : "全选" }}</button>
        <button class="admin-btn" type="button" @click="batchPromote">批量提权</button>
        <button class="admin-btn" type="button" @click="batchDemote">批量解除提权</button>
        <button class="admin-btn" type="button" @click="batchBan(true)">批量封禁</button>
        <button class="admin-btn" type="button" @click="batchBan(false)">批量解封</button>
        <button class="admin-btn danger" type="button" @click="batchDelete">批量删除</button>
      </div>
      <p class="admin-hint">提示：管理员不会封禁/删除/降权自己。</p>

      <p v-if="loading">加载中...</p>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>选择</th>
            <th>UID</th>
            <th>显示名称</th>
            <th>邮箱</th>
            <th>管理员</th>
            <th>封禁</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in users" :key="item.uid">
            <td><input type="checkbox" :checked="selectedSet.has(item.uid)" @change="toggleOne(item.uid)" /></td>
            <td>{{ item.uid }}</td>
            <td>{{ item.username }}</td>
            <td>{{ item.email }}</td>
            <td>{{ item.isAdmin ? "是" : "否" }}</td>
            <td>{{ item.isBanned ? "是" : "否" }}</td>
            <td class="actions">
              <button class="admin-btn" type="button" @click="startEdit(item)">编辑</button>
              <button class="admin-btn" type="button" @click="singlePromote(item.uid)">{{ item.isAdmin ? "解除提权" : "提权" }}</button>
              <button class="admin-btn" type="button" @click="singleToggleBan(item.uid, !item.isBanned)">
                {{ item.isBanned ? "解封" : "封禁" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section id="user-edit" class="admin-card">
      <h3>编辑用户</h3>
      <p class="admin-hint">先在上面列表点击“编辑”自动带入。</p>
      <div class="admin-form-grid">
        <label>
          <span>UID</span>
          <input v-model.trim="editForm.uid" type="text" placeholder="可修改" />
        </label>
        <label>
          <span>显示名称</span>
          <input v-model.trim="editForm.username" type="text" placeholder="可修改" />
        </label>
        <label>
          <span>邮箱</span>
          <input v-model.trim="editForm.email" type="email" placeholder="可修改" />
        </label>
        <label>
          <span>新密码</span>
          <input v-model="editForm.password" type="password" placeholder="留空不改" />
        </label>
      </div>
      <div class="admin-actions">
        <button class="admin-btn primary" type="button" @click="submitEdit">保存修改</button>
      </div>
    </section>
  </div>
</template>
