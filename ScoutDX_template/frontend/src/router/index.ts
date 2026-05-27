import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import ScoutPage from '../components/ScoutPage.vue'
import ScoutDraftDetailPage from '../components/ScoutDraftDetailPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: ScoutPage,
  },
  {
    path: '/scout-drafts/:id',
    name: 'scoutDraftDetail',
    component: ScoutDraftDetailPage,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
