import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { i18n, initializeLocale } from "./i18n";
import { initializeThemeMode } from "./theme/useTheme";

initializeThemeMode();
initializeLocale();

createApp(App).use(i18n).use(router).mount("#app");
