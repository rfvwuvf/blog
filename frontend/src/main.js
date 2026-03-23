import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'

const routes = [
  { path: '/', component: () => import('./views/Home.vue') },
  { path: '/post/:slug', component: () => import('./views/Post.vue') },
  { path: '/login', component: () => import('./views/Login.vue') },
  {
    path: '/admin',
    component: () => import('./views/admin/Layout.vue'),
    children: [
      { path: '', redirect: '/admin/posts' },
      { path: 'posts', component: () => import('./views/admin/Posts.vue') },
      { path: 'posts/new', component: () => import('./views/admin/PostEditor.vue') },
      { path: 'posts/edit/:id', component: () => import('./views/admin/PostEditor.vue') },
      { path: 'categories', component: () => import('./views/admin/Categories.vue') },
      { path: 'tags', component: () => import('./views/admin/Tags.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isValidToken = token && token !== 'undefined' && token !== 'null'
  if (to.path.startsWith('/admin') && !isValidToken) {
    next('/login')
  } else {
    next()
  }
})

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.mount('#app')