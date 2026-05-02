<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import TiLayout from "../layouts/TiLayout.vue";
import { clearAdminTokenSession, redeemCpoauthTicket, saveLocalUser } from "../api/auth";
import { BANNED_ROUTE_PATH, isBannedMessage } from "../utils/authRedirect";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const pending = ref(true);
const message = ref(t("auth.callbackProcessing"));
const error = ref("");

onMounted(async () => {
  const ticket = String(route.query.ticket ?? "").trim();
  const directError = String(route.query.error ?? "").trim();
  const fallbackReturnTo = String(route.query.returnTo ?? "/problemset");

  if (directError) {
    if (isBannedMessage(directError)) {
      await router.replace(BANNED_ROUTE_PATH);
      return;
    }
    pending.value = false;
    error.value = decodeURIComponent(directError);
    message.value = t("auth.callbackFailed");
    return;
  }

  if (!ticket) {
    pending.value = false;
    error.value = t("auth.callbackMissingTicket");
    message.value = t("auth.callbackFailed");
    return;
  }

  try {
    const { user, returnTo } = await redeemCpoauthTicket(ticket);
    clearAdminTokenSession();
    saveLocalUser(user);
    await router.replace(user.isBanned ? BANNED_ROUTE_PATH : (returnTo || fallbackReturnTo || "/problemset"));
  } catch (err) {
    pending.value = false;
    error.value = String((err as Error)?.message ?? err);
    message.value = t("auth.callbackFailed");
  }
});
</script>

<template>
  <TiLayout :subtitle="t('auth.callbackTitle')" :show-top-bar="false" :show-title="false" :use-panel="false">
    <section class="callback-wrap auth-callback-page">
      <div class="callback-card">
        <h2>{{ message }}</h2>
        <p v-if="pending">{{ t("auth.callbackPending") }}</p>
        <template v-else>
          <p class="error" v-if="error">{{ error }}</p>
          <router-link class="back" to="/auth/login">{{ t("auth.callbackBack") }}</router-link>
        </template>
      </div>
    </section>
  </TiLayout>
</template>
