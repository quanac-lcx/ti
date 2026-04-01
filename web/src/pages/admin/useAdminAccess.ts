import { computed } from "vue";
import { loadLocalUser } from "../../api/auth";

export function useAdminAccess() {
  const user = loadLocalUser();
  const isAdmin = computed(() => Boolean(user?.isAdmin));
  return {
    user,
    isAdmin
  };
}
