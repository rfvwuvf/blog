<template>
  <div class="home">
    <header class="header">
      <div class="header-inner">
        <h1 class="logo">小张の日记</h1>
        <nav>
          <router-link to="/">首页</router-link>
          <router-link to="/login">管理</router-link>
        </nav>
      </div>
    </header>
    
    <main class="main">
      <div class="content-wrapper">
        <!-- 左侧 -->
        <div class="content-left">
          <!-- 最新文章 -->
          <div class="sidebar-card">
            <h3 class="card-title">最新文章</h3>
            <div class="latest-posts-list">
              <div 
                v-for="(post, index) in latestPosts" 
                :key="post.id" 
                class="latest-post-item"
                @click="goToPost(post.slug)"
              >
                <span class="post-index">{{ index + 1 }}</span>
                <span class="post-title-text">{{ post.title }}</span>
              </div>
              <div v-if="latestPosts.length === 0" class="empty-text">暂无文章</div>
            </div>
          </div>

          <!-- 文章分类 -->
          <div class="sidebar-card">
            <h3 class="card-title">文章分类</h3>
            <div class="categories-list">
              <div 
                class="category-item"
                :class="{ active: !selectedCategory }"
                @click="selectCategory(null)"
              >
                <span class="category-name">全部</span>
              </div>
              <div 
                v-for="cat in categories" 
                :key="cat.id" 
                class="category-item"
                :class="{ active: selectedCategory === cat.id }"
                @click="selectCategory(cat.id)"
              >
                <span class="category-name">{{ cat.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间文章列表 -->
        <div class="content-center">
          <div class="search-box">
            <input 
              v-model="keyword" 
              type="text" 
              placeholder="搜索文章..." 
              @keyup.enter="handleSearch"
            />
            <button @click="handleSearch">搜索</button>
          </div>

          <el-skeleton v-if="loading" :rows="5" animated />
          <div v-else class="post-list">
            <div v-if="posts.length === 0" class="empty">
              暂无文章
            </div>
            <article v-for="post in posts" :key="post.id" class="post-item" @click="goToPost(post.slug)">
              <h2 class="post-title">{{ post.title }}</h2>
              <p class="post-excerpt">{{ post.excerpt || post.content?.substring(0, 150) }}</p>
              <div class="post-meta">
                <span class="date">{{ formatDate(post.created_at) }}</span>
                <span class="views">{{ post.views || 0 }} 阅读</span>
              </div>
            </article>
          </div>

          <div v-if="!loading && posts.length > 0" class="pagination">
            <button class="page-btn" :disabled="page === 1" @click="prevPage">‹</button>
            <span class="page-info">第 {{ page }} 页</span>
            <button class="page-btn" :disabled="page >= totalPages" @click="nextPage">›</button>
          </div>
        </div>

        <!-- 右侧个人信息 -->
        <div class="content-right">
          <div class="profile-card">
            <div class="avatar">
              <img v-if="settings.avatar" :src="settings.avatar" alt="头像" />
              <div v-else class="avatar-placeholder"></div>
            </div>
            <h2 class="nickname">{{ settings.nickname }}</h2>
            <p class="email" v-if="settings.email">Email:&nbsp;&nbsp;{{ settings.email }}</p>
            <p class="bio">{{ settings.bio }}</p>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>© 2026 小张的日记 · 记录生活点滴</p>
    </footer>

    <!-- 返回顶部按钮 -->
    <div v-show="showBackTop" class="back-top" @click="scrollToTop">
      ↑
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const posts = ref([])
const categories = ref([])
const loading = ref(true)
const keyword = ref('')
const page = ref(1)
const pageSize = ref(8)
const settings = ref({})
const showBackTop = ref(false)
const selectedCategory = ref(null)
const totalPosts = ref(0)
const totalPages = ref(0)
const latestPosts = ref([])

onMounted(async () => {
  window.addEventListener('scroll', handleScroll)
  await Promise.all([loadSettings(), loadCategories(), loadPosts()])
})

function handleScroll() {
  showBackTop.value = window.scrollY > 300
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function loadSettings() {
  try {
    const res = await axios.get('/api/settings')
    settings.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadCategories() {
  try {
    const res = await axios.get('/api/categories')
    categories.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function selectCategory(categoryId) {
  selectedCategory.value = categoryId
  page.value = 1
  loadPosts()
}

async function loadPosts() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)
    if (keyword.value) {
      params.append('keyword', keyword.value)
    }
    if (selectedCategory.value) {
      params.append('categoryId', selectedCategory.value)
    }
    const res = await axios.get(`/api/posts?${params}`)
    posts.value = res.data.data || res.data
    totalPosts.value = res.data.total || posts.value.length
    totalPages.value = res.data.totalPages || Math.ceil(totalPosts.value / pageSize.value)
    if (page.value === 1) {
      latestPosts.value = posts.value.slice(0, 1)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadPosts()
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadPosts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function nextPage() {
  page.value++
  loadPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goToPost(slug) {
  router.push('/post/' + slug)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-image: url('/bg.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
}

.header {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(238, 238, 238, 0.5);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

.header nav a {
  margin-left: 24px;
  text-decoration: none;
  color: #666;
  font-size: 15px;
  transition: color 0.3s;
}

.header nav a:hover {
  color: #e74c3c;
}

.main {
  flex: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 24px;
  width: 100%;
  box-sizing: border-box;
}

.content-wrapper {
  display: flex;
  gap: 24px;
}

.content-left {
  width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 90px;
  height: fit-content;
}

.content-center {
  flex: 1;
  min-width: 0;
}

.content-right {
  width: 280px;
  flex-shrink: 0;
}

.categories-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  padding: 20px;
  backdrop-filter: blur(5px);
  position: sticky;
  top: 90px;
}

.card-title {
  margin: 0 0 16px;
  font-size: 16px;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(238, 238, 238, 0.5);
}

.profile-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  backdrop-filter: blur(5px);
  text-align: center;
  position: sticky;
  top: 90px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 16px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
}

.nickname {
  margin: 0 0 12px;
  font-size: 20px;
  color: #333;
}

.bio {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.categories-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  padding: 20px;
  backdrop-filter: blur(5px);
  position: sticky;
  top: 90px;
}

.card-title {
  margin: 0 0 16px;
  font-size: 16px;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(238, 238, 238, 0.5);
}

.sidebar-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  padding: 20px;
  backdrop-filter: blur(5px);
  margin-bottom: 24px;
}

.latest-posts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.latest-post-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px 0;
}

.latest-post-item:hover {
  transform: translateX(4px);
}

.post-index {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.post-title-text {
  color: #333;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.latest-post-item:hover .post-title-text {
  color: #e74c3c;
}

.empty-text {
  color: #999;
  font-size: 14px;
  text-align: center;
  padding: 10px 0;
}

.categories-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  padding: 20px;
  backdrop-filter: blur(5px);
  position: sticky;
  top: 90px;
  margin-bottom: 24px;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover {
  background: rgba(231, 76, 60, 0.1);
}

.category-item.active {
  background: rgba(231, 76, 60, 0.15);
}

.category-item.active .category-name {
  color: #e74c3c;
  font-weight: 600;
}

.category-name {
  color: #333;
  font-size: 14px;
}

.category-count {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.search-box input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid rgba(221, 221, 221, 0.5);
  border-radius: 4px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.6);
  outline: none;
  transition: border-color 0.3s;
}

.search-box input:focus {
  border-color: #e74c3c;
}

.search-box button {
  padding: 10px 20px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.search-box button:hover {
  background: #c0392b;
}

.post-list {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  backdrop-filter: blur(5px);
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-item {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(5px);
}

.post-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-title {
  margin: 0 0 8px;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.post-title:hover {
  color: #e74c3c;
}

.post-excerpt {
  color: #666;
  margin: 0 0 12px;
  line-height: 1.6;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  gap: 16px;
  color: #999;
  font-size: 13px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  backdrop-filter: blur(5px);
}

.page-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(221, 221, 221, 0.5);
  border-radius: 4px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.page-btn:hover:not(:disabled) {
  border-color: #e74c3c;
  color: #e74c3c;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.footer {
  text-align: center;
  padding: 24px;
  color: #666;
  font-size: 13px;
  border-top: 1px solid rgba(238, 238, 238, 0.5);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.back-top {
  position: fixed;
  right: 30px;
  bottom: 30px;
  width: 50px;
  height: 50px;
  background: rgba(231, 76, 60, 0.9);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
  transition: all 0.3s;
  z-index: 1000;
}

.back-top:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
  background: rgba(231, 76, 60, 1);
}

@media (max-width: 900px) {
  .content-left {
    display: none;
  }
  
  .content-right {
    display: none;
  }
}

@media (max-width: 1200px) {
  .content-left {
    width: 180px;
  }
  
  .content-right {
    width: 240px;
  }
}
</style>