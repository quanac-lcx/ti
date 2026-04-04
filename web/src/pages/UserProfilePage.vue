<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getUserByUid, loadLocalUser, type AuthUser } from "../api/auth";
import { problemsetApi, type ProblemsetSummary } from "../api/problemset";
import { fetchActiveExam, fetchUserSubmissions, type SubmissionRecord } from "../api/submission";
import TiLayout from "../layouts/TiLayout.vue";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";

const route = useRoute();
const router = useRouter();

const currentUser = ref<AuthUser | null>(null);
const profile = ref<AuthUser | null>(null);
const activeExam = ref<SubmissionRecord | null>(null);
const submissions = ref<SubmissionRecord[]>([]);
const userProblemsets = ref<ProblemsetSummary[]>([]);
const problemsetTab = ref<"all" | "official_public" | "personal_featured" | "personal_public" | "personal_private">("all");
const topTab = ref<"records" | "problemsets">("records");

const loading = ref(true);
const recordsLoading = ref(true);
const error = ref("");
const recordsError = ref("");

const profileUid = computed(() => String(route.params.uid ?? "").trim());

const canViewPrivateProblemsets = computed(() => {
  const current = currentUser.value;
  if (!current || !profileUid.value) return false;
  return current.uid === profileUid.value || current.isAdmin;
});

const canViewRecords = computed(() => {
  if (profile.value?.recordsPublic) return true;
  const current = currentUser.value;
  if (!current || !profileUid.value) return false;
  return current.uid === profileUid.value || current.isAdmin;
});

const canViewActiveExam = computed(() => canViewPrivateProblemsets.value);

const coverStyle = computed(() => {
  const url = String(profile.value?.profileCoverUrl ?? "").trim();
  if (!url) return {};
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center"
  };
});

const bioHtml = computed(() => renderLuoguMarkdown(String(profile.value?.bio ?? "").trim()));

const filteredProblemsets = computed(() => {
  if (problemsetTab.value === "all") return userProblemsets.value;
  return userProblemsets.value.filter((item) => item.problemsetType === problemsetTab.value);
});

function switchTopTab(tab: "records" | "problemsets") {
  topTab.value = tab;
}

function problemsetTypeLabel(type: ProblemsetSummary["problemsetType"]) {
  if (type === "official_public") return "官方公开";
  if (type === "personal_featured") return "个人精选";
  if (type === "personal_public") return "个人公开";
  return "个人私有";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function openSubmission(record: SubmissionRecord) {
  router.push(`/problemset/${record.problemsetId}?submission=${record.id}`);
}

function resumeExam() {
  if (!activeExam.value) return;
  router.push(`/problemset/${activeExam.value.problemsetId}/exam?resume=${activeExam.value.id}`);
}

function modeText(mode: SubmissionRecord["mode"]) {
  return mode === "exam" ? "限时训练" : "练习";
}

async function loadPage() {
  loading.value = true;
  recordsLoading.value = true;
  error.value = "";
  recordsError.value = "";
  submissions.value = [];
  userProblemsets.value = [];
  activeExam.value = null;
  currentUser.value = loadLocalUser();

  const uid = profileUid.value;
  if (!uid) {
    error.value = "无效用户。";
    loading.value = false;
    recordsLoading.value = false;
    return;
  }

  try {
    profile.value = await getUserByUid(uid);
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
    loading.value = false;
    recordsLoading.value = false;
    return;
  } finally {
    loading.value = false;
  }

  try {
    userProblemsets.value = await problemsetApi.listUserProblemsets(uid);
  } catch {
    userProblemsets.value = [];
  }

  if (!canViewRecords.value) {
    recordsLoading.value = false;
    return;
  }

  try {
    const activeExamPromise = canViewActiveExam.value ? fetchActiveExam(uid) : Promise.resolve(null);
    const [active, records] = await Promise.all([activeExamPromise, fetchUserSubmissions(uid)]);
    activeExam.value = active;
    submissions.value = records;
  } catch (err) {
    recordsError.value = String((err as Error)?.message ?? err);
  } finally {
    recordsLoading.value = false;
  }
}

onMounted(loadPage);
watch(() => route.params.uid, loadPage);
</script>

<template>
  <TiLayout
    :title="`有题个人中心 - ${profile?.uid ?? profileUid}`"
    subtitle="保存站有题 / 用户中心"
    :use-panel="false"
  >
    <div class="profile-root">
      <div class="left-col">
        <section class="card tab-card">
          <button
            class="tab"
            :class="{ active: topTab === 'records' }"
            type="button"
            @click="switchTopTab('records')"
          >
            <i class="fa-solid fa-clock-rotate-left"></i>
            做题记录
          </button>
          <button
            class="tab"
            :class="{ active: topTab === 'problemsets' }"
            type="button"
            @click="switchTopTab('problemsets')"
          >
            <i class="fa-solid fa-book"></i>
            TA 的题目
          </button>
        </section>

        <section v-if="loading" class="card">加载用户信息中...</section>
        <section v-else-if="error" class="card error">{{ error }}</section>

        <section v-else-if="topTab === 'records' && canViewRecords && activeExam" class="card active-exam">
          <p class="active-title">正在进行中：</p>
          <button class="link-btn" type="button" @click="resumeExam">
            <i class="fa-solid fa-play"></i>
            {{ activeExam.problemsetId }} - {{ activeExam.problemsetTitle || "继续本场考试" }}
          </button>
        </section>

        <section v-if="!loading && topTab === 'records' && canViewRecords" class="card records-card">
          <div v-if="recordsLoading" class="records-loading">加载记录中...</div>
          <div v-else-if="recordsError" class="records-error">{{ recordsError }}</div>
          <div v-else-if="submissions.length === 0" class="records-empty">暂无历史答卷。</div>
          <article
            v-else
            v-for="record in submissions"
            :key="record.id"
            class="record-item"
          >
            <div class="record-head">
              <button class="record-title" type="button" @click="openSubmission(record)">
                {{ record.problemsetTitle || `试卷 ${record.problemsetId}` }}
              </button>
              <span class="record-mode">{{ modeText(record.mode) }}</span>
              <strong class="record-score">{{ record.score }} 分</strong>
              <span class="record-date">{{ formatDate(record.submittedAt || record.updatedAt) }}</span>
            </div>
            <div class="record-actions">
              <button class="view-paper" type="button" @click="openSubmission(record)">
                <i class="fa-regular fa-file-lines"></i>
                查看历史答卷
              </button>
            </div>
          </article>
        </section>

        <section v-if="!loading && topTab === 'problemsets'" class="card records-card">
          <div class="problemset-header">
            <h3>TA 的题目</h3>
            <div class="problemset-tabs">
              <button class="problemset-tab" :class="{ active: problemsetTab === 'all' }" @click="problemsetTab = 'all'">全部</button>
              <button class="problemset-tab" :class="{ active: problemsetTab === 'official_public' }" @click="problemsetTab = 'official_public'">官方公开</button>
              <button class="problemset-tab" :class="{ active: problemsetTab === 'personal_featured' }" @click="problemsetTab = 'personal_featured'">个人精选</button>
              <button class="problemset-tab" :class="{ active: problemsetTab === 'personal_public' }" @click="problemsetTab = 'personal_public'">个人公开</button>
              <button
                v-if="canViewPrivateProblemsets"
                class="problemset-tab"
                :class="{ active: problemsetTab === 'personal_private' }"
                @click="problemsetTab = 'personal_private'"
              >
                个人私有
              </button>
            </div>
          </div>

          <div v-if="filteredProblemsets.length === 0" class="records-empty">当前分栏下暂无题目。</div>
          <article v-else v-for="item in filteredProblemsets" :key="item.id" class="record-item">
            <div class="record-head">
              <button class="record-title" type="button" @click="router.push(`/problemset/${item.id}`)">
                {{ item.title }}
              </button>
              <span class="record-mode">{{ problemsetTypeLabel(item.problemsetType) }}</span>
              <strong class="record-score">{{ item.questionCount }} 题</strong>
              <span class="record-date">ID {{ item.id }}</span>
            </div>
          </article>
        </section>

        <section v-if="!loading && topTab === 'records' && !canViewRecords" class="card records-empty-state">
          <div class="empty-icon"><i class="fa-solid fa-user-secret"></i></div>
          <p class="empty-main">该用户设置了隐私保护，无法查看练习记录。</p>
        </section>
      </div>

      <aside v-if="profile" class="right-col">
        <section class="profile-card">
          <div class="cover" :style="coverStyle"></div>
          <div class="profile-body">
            <img :src="profile.avatarUrl" alt="avatar" />
            <div class="meta">
              <p class="name">{{ profile.username }}</p>
              <p class="uid">@{{ profile.uid }}</p>
            </div>
          </div>
        </section>

        <section class="profile-card profile-bio-card">
          <div class="profile-bio-header">
            <i class="fa-solid fa-signature"></i>
            <span>TA 的个人简介</span>
          </div>
          <div v-if="!String(profile.bio ?? '').trim()" class="profile-bio-empty">TA 还没有填写简介。</div>
          <div v-else class="bio-content luogu-markdown" v-html="bioHtml"></div>
        </section>
      </aside>
    </div>
  </TiLayout>
</template>
