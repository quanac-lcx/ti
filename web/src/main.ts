import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { initializeThemeMode } from "./theme/useTheme";

initializeThemeMode();

createApp(App).use(router).mount("#app");
