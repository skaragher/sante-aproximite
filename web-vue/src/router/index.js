import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const LoginPage = () => import("../pages/LoginPage.vue");
const RegisterPage = () => import("../pages/RegisterPage.vue");
const DashboardPage = () => import("../pages/DashboardPage.vue");

const routes = [
  { path: "/login", component: LoginPage },
  { path: "/register", component: RegisterPage },
  { path: "/", component: DashboardPage, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const { state } = useAuthStore();
  if (to.meta.requiresAuth && !state.token) return "/login";
  if ((to.path === "/login" || to.path === "/register") && state.token) return "/";
  return true;
});

export default router;
