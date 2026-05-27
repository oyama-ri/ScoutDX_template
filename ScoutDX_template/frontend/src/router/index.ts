import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import ScoutPage from '../components/ScoutPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: ScoutPage,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
