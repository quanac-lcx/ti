<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import TiLayout from "../layouts/TiLayout.vue";
import { loadLocalUser, type AuthUser } from "../api/auth";
import {
  banUser,
  type CpoauthConfig,
  createQuestion,
  createUser,
  deleteUser,
  fetchCpoauthConfig,
  fetchAdminUsers,
  promoteUser,
  updateCpoauthConfig,
  updateUser
} from "../api/admin";

const currentUser = loadLocalUser();
const users = ref<AuthUser[]>([]);
const loading = ref(true);
const error = ref("");
const message = ref("");
const cpoauthLoading = ref(false);

const createForm = reactive({
  username: "",
  email: "",
  password: ""
});

const editForm = reactive({
  targetUid: "",
  uid: "",
  username: "",
  email: "",
  password: ""
});

const questionForm = reactive({
  problemsetId: 1002,
  stem: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  score: 1.5,
  answer: "A",
  analysis: ""
});

const cpoauthForm = reactive<CpoauthConfig>({
  clientId: "",
  clientSecret: "",
  callbackUrl: "",
  scope: "openid profile email"
});

const run = async (fn: () => Promise<void>) => {
  error.value = "";
  try {
    await fn();
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  }
};

const loadUsers = async () => {
  loading.value = true;
  error.value = "";
  try {
    users.value = await fetchAdminUsers();
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    loading.value = false;
  }
};

const loadCpoauthConfig = async () => {
  cpoauthLoading.value = true;
  try {
    const config = await fetchCpoauthConfig();
    cpoauthForm.clientId = config.clientId;
    cpoauthForm.clientSecret = config.clientSecret;
    cpoauthForm.callbackUrl = config.callbackUrl;
    cpoauthForm.scope = config.scope;
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    cpoauthLoading.value = false;
  }
};

const selectUser = (user: AuthUser) => {
  editForm.targetUid = user.uid;
  editForm.uid = user.uid;
  editForm.username = user.username;
  editForm.email = user.email;
  editForm.password = "";
};

const submitCreateUser = async () => {
  await run(async () => {
    message.value = "";
    await createUser(createForm);
    createForm.username = "";
    createForm.email = "";
    createForm.password = "";
    message.value = "用户创建成功";
    await loadUsers();
  });
};

const submitEditUser = async () => {
  if (!editForm.targetUid) return;
  await run(async () => {
    const updatedUser = await updateUser(editForm.targetUid, {
      uid: editForm.uid,
      username: editForm.username,
      email: editForm.email,
      ...(editForm.password ? { password: editForm.password } : {})
    });
    editForm.targetUid = updatedUser.uid;
    editForm.uid = updatedUser.uid;
    message.value = `用户 ${updatedUser.uid} 已更新`;
    await loadUsers();
  });
};

const handlePromote = async (uid: string) => {
  await run(async () => {
    await promoteUser(uid);
    message.value = `${uid} 已提升为管理员`;
    await loadUsers();
  });
};

const handleBan = async (uid: string, banned: boolean) => {
  await run(async () => {
    await banUser(uid, banned);
    message.value = banned ? `${uid} 已封禁` : `${uid} 已解除封禁`;
    await loadUsers();
  });
};

const handleDelete = async (uid: string) => {
  await run(async () => {
    await deleteUser(uid);
    message.value = `${uid} 已删除`;
    await loadUsers();
  });
};

const submitCreateQuestion = async () => {
  await run(async () => {
    await createQuestion(Number(questionForm.problemsetId), {
      stem: questionForm.stem,
      options: [
        { key: "A", text: questionForm.optionA },
        { key: "B", text: questionForm.optionB },
        { key: "C", text: questionForm.optionC },
        { key: "D", text: questionForm.optionD }
      ],
      score: Number(questionForm.score),
      answer: questionForm.answer.trim().toUpperCase(),
      analysis: questionForm.analysis
    });
    message.value = "题目新增成功";
    questionForm.stem = "";
    questionForm.optionA = "";
    questionForm.optionB = "";
    questionForm.optionC = "";
    questionForm.optionD = "";
    questionForm.analysis = "";
  });
};

const submitCpoauthConfig = async () => {
  await run(async () => {
    message.value = "";
    const config = await updateCpoauthConfig({
      clientId: cpoauthForm.clientId.trim(),
      clientSecret: cpoauthForm.clientSecret.trim(),
      callbackUrl: cpoauthForm.callbackUrl.trim(),
      scope: cpoauthForm.scope.trim() || "openid profile email"
    });
    cpoauthForm.clientId = config.clientId;
    cpoauthForm.clientSecret = config.clientSecret;
    cpoauthForm.callbackUrl = config.callbackUrl;
    cpoauthForm.scope = config.scope;
    message.value = "CPOAuth 配置已保存";
  });
};

onMounted(() => {
  if (currentUser?.isAdmin) {
    loadUsers();
    loadCpoauthConfig();
  } else {
    loading.value = false;
  }
});
</script>

<template>
  <TiLayout title="后台管理" subtitle="洛谷有题 / 管理后台">
    <section class="admin-wrap">
      <div v-if="!currentUser" class="card warning">
        <p>请先登录后访问后台管理。</p>
        <router-link to="/auth/login">去登录</router-link>
      </div>

      <div v-else-if="!currentUser.isAdmin" class="card warning">
        <p>当前账号不是管理员，无法访问后台管理。</p>
        <p>当前 UID：{{ currentUser.uid }}</p>
      </div>

      <template v-else>
        <div v-if="error" class="card error">{{ error }}</div>
        <div v-if="message" class="card success">{{ message }}</div>

        <div class="grid">
          <div class="card">
            <h3>用户管理</h3>
            <p v-if="loading">加载中...</p>
            <table v-else class="table">
              <thead>
                <tr>
                  <th>UID</th>
                  <th>显示名称</th>
                  <th>邮箱</th>
                  <th>管理员</th>
                  <th>封禁</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.uid">
                  <td>{{ user.uid }}</td>
                  <td>{{ user.username }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.isAdmin ? "是" : "否" }}</td>
                  <td>{{ user.isBanned ? "是" : "否" }}</td>
                  <td class="actions">
                    <button @click="selectUser(user)">编辑</button>
                    <button @click="handlePromote(user.uid)">提权</button>
                    <button @click="handleBan(user.uid, !user.isBanned)">{{ user.isBanned ? "解封" : "封禁" }}</button>
                    <button class="danger" @click="handleDelete(user.uid)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="card">
            <h3>手动创建用户</h3>
            <div class="form">
              <input v-model.trim="createForm.username" type="text" placeholder="用户名" />
              <input v-model.trim="createForm.email" type="email" placeholder="邮箱" />
              <input v-model="createForm.password" type="password" placeholder="密码（至少6位）" />
              <button @click="submitCreateUser">创建</button>
            </div>
          </div>

          <div class="card">
            <h3>修改用户信息</h3>
            <div class="form">
              <input v-model="editForm.targetUid" type="text" placeholder="先在列表点编辑自动填充" readonly />
              <input v-model.trim="editForm.uid" type="text" placeholder="UID（可修改）" />
              <input v-model.trim="editForm.username" type="text" placeholder="显示名称" />
              <input v-model.trim="editForm.email" type="email" placeholder="邮箱" />
              <input v-model="editForm.password" type="password" placeholder="新密码（可选）" />
              <button @click="submitEditUser">保存修改</button>
            </div>
          </div>

          <div class="card">
            <h3>CPOAuth 配置</h3>
            <div v-if="cpoauthLoading">加载配置中...</div>
            <div v-else class="form">
              <input v-model.trim="cpoauthForm.clientId" type="text" placeholder="Client ID" />
              <input v-model.trim="cpoauthForm.clientSecret" type="password" placeholder="Client Secret" />
              <input v-model.trim="cpoauthForm.callbackUrl" type="text" placeholder="回调地址（可留空使用默认）" />
              <input v-model.trim="cpoauthForm.scope" type="text" placeholder="Scope，例如 openid profile email" />
              <button @click="submitCpoauthConfig">保存 OAuth 配置</button>
              <p class="hint">
                请将上面的回调地址配置到 CP OAuth 平台。
              </p>
            </div>
          </div>

          <div class="card">
            <h3>增加题目</h3>
            <div class="form">
              <input v-model.number="questionForm.problemsetId" type="number" placeholder="试卷 ID，如 1002" />
              <textarea v-model="questionForm.stem" rows="3" placeholder="题干"></textarea>
              <input v-model="questionForm.optionA" type="text" placeholder="选项 A" />
              <input v-model="questionForm.optionB" type="text" placeholder="选项 B" />
              <input v-model="questionForm.optionC" type="text" placeholder="选项 C" />
              <input v-model="questionForm.optionD" type="text" placeholder="选项 D" />
              <input v-model.number="questionForm.score" type="number" step="0.5" placeholder="分值" />
              <input v-model="questionForm.answer" type="text" placeholder="答案，如 A" />
              <textarea v-model="questionForm.analysis" rows="3" placeholder="解析"></textarea>
              <button @click="submitCreateQuestion">新增题目</button>
            </div>
          </div>
        </div>
      </template>
    </section>
  </TiLayout>
</template>

<style scoped>
.admin-wrap {
  padding: 10px 14px;
}

.grid {
  display: grid;
  gap: 14px;
}

.card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  padding: 14px;
}

.card h3 {
  margin: 0 0 12px;
}

.warning {
  color: #8a6d3b;
}

.error {
  color: #d9534f;
}

.success {
  color: #2e8b57;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  border-top: 1px solid #efefef;
  padding: 8px;
  font-size: 13px;
  text-align: left;
}

.actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

button {
  height: 32px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  padding: 0 10px;
}

button.danger {
  border-color: #d9534f;
  color: #d9534f;
}

.form {
  display: grid;
  gap: 8px;
}

.form input,
.form textarea {
  width: 100%;
  border: 1px solid #d5d5d5;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 14px;
}

.hint {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}
</style>
