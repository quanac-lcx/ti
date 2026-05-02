<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import TiLayout from "../layouts/TiLayout.vue";
import { buildCpoauthAuthorizeUrl, loginWithAdminToken, saveLocalUser } from "../api/auth";
import { loadPublicSiteContentCached, type PublicSiteContent } from "../api/siteContent";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";
import { BANNED_ROUTE_PATH } from "../utils/authRedirect";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const cpoauthEntryUrl = buildCpoauthAuthorizeUrl(String(route.query.redirect ?? "/problemset"));
const adminToken = ref("");
const adminPending = ref(false);
const adminError = ref("");
const publicSiteContent = ref<PublicSiteContent | null>(null);

const agreementLink = computed(() => {
  const slug = publicSiteContent.value?.userAgreementPage?.slug;
  return slug ? `/system/${slug}` : "";
});

const privacyLink = computed(() => {
  const slug = publicSiteContent.value?.privacyPolicyPage?.slug;
  return slug ? `/system/${slug}` : "";
});

const loginNoticeHtml = computed(() =>
  renderLuoguMarkdown(publicSiteContent.value?.loginNoticeMarkdown ?? "")
);

async function submitAdminToken() {
  adminError.value = "";
  const token = adminToken.value.trim();
  if (!/^[A-Za-z0-9]{32}$/.test(token)) {
    adminError.value = t("auth.adminTokenInvalid");
    return;
  }
  adminPending.value = true;
  try {
    const user = await loginWithAdminToken(token);
    saveLocalUser(user);
    await router.push(user.isBanned ? BANNED_ROUTE_PATH : "/admin");
  } catch (err) {
    adminError.value = String((err as Error)?.message ?? err);
  } finally {
    adminPending.value = false;
  }
}

onMounted(async () => {
  try {
    publicSiteContent.value = await loadPublicSiteContentCached();
  } catch {
    publicSiteContent.value = null;
  }
});
</script>

<template>
  <TiLayout :subtitle="t('auth.loginSubtitle')" :show-top-bar="false" :show-title="false" :use-panel="false">
    <section class="auth-wrap auth-login-page">
      <div class="auth-card">
        <span class="brand-logo-icon" role="img" :aria-label="t('common.appName')">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M16.5595 0L16.2797 1.9926L16.2788 2.00192L13.3661 21.0724L32 29.8647L31.2365 31.5774L31.0491 32H0L0.275114 30.0093L0.27696 29.999L4.8679 0H16.5595ZM12.0976 29.3917H24.9043L12.9571 23.7544L12.0976 29.3917ZM2.96071 29.3917H9.5062L10.5402 22.6135L4.43321 19.7338L2.96071 29.3917ZM4.84311 17.0527L10.9501 19.9325L13.5951 2.60828H7.04864L4.84311 17.0527Z"
              fill="currentColor"
            ></path>
          </svg>
        </span>
        <h2 class="auth-title">{{ t("auth.loginTitle") }}</h2>
        <p class="auth-tip">
          {{ t("auth.loginTipPrefix") }}
          <a href="//www.cpoauth.com" target="_blank" rel="noopener noreferrer">CP OAuth</a>
          {{ t("auth.loginTipSuffix") }}<br>{{ t("auth.loginPolicyTip") }}
        </p>

        <div v-if="agreementLink || privacyLink" class="auth-policy-links">
          <RouterLink v-if="agreementLink" :to="agreementLink" class="auth-policy-link">
            {{ t("auth.userAgreement") }}
          </RouterLink>
          <RouterLink v-if="privacyLink" :to="privacyLink" class="auth-policy-link">
            {{ t("auth.privacyPolicy") }}
          </RouterLink>
        </div>

        <div v-if="loginNoticeHtml" class="auth-login-notice luogu-markdown" v-html="loginNoticeHtml"></div>

        <a :href="cpoauthEntryUrl" class="btn btn-cpoauth">
          <i class="fa-solid fa-right-to-bracket"></i>
          {{ t("auth.continueWithCpoauth") }}
        </a>

        <div class="admin-token-box">
          <p class="admin-token-title">{{ t("auth.adminToken") }}</p>
          <input
            v-model="adminToken"
            class="admin-token-input"
            type="text"
            maxlength="32"
          />
          <button class="btn btn-admin-token" type="button" :disabled="adminPending" @click="submitAdminToken">
            <i class="fa-solid fa-shield-halved"></i>
            {{ adminPending ? t("auth.loggingIn") : t("auth.loginWithAdminToken") }}
          </button>
          <p v-if="adminError" class="admin-token-error">{{ adminError }}</p>
        </div>
      </div>
    </section>
  </TiLayout>
</template>
