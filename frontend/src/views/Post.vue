<template>
  <div class="post-page">
    <header class="header">
      <div class="header-inner">
        <h1 class="logo">小张の日记</h1>
        <nav>
          <router-link to="/">首页</router-link>
        </nav>
      </div>
    </header>
    
    <main class="main">
      <div class="content-wrapper">
        <!-- 左侧 -->
        <div class="content-left">
          <div class="sidebar-card">
            <div class="back-btn" @click="$router.push('/')">
              ← 返回首页
            </div>
          </div>
          
          <div class="sidebar-card">
            <h3 class="card-title">文章分类</h3>
            <div class="category-tag" v-if="post && post.category_name">{{ post.category_name }}</div>
            <div class="empty-text" v-else>暂无分类</div>
          </div>
          
          <div class="sidebar-card" v-if="postTags.length > 0">
            <h3 class="card-title">文章标签</h3>
            <div class="tags-list">
              <span v-for="tag in postTags" :key="tag.id" class="tag-item">{{ tag.name }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧文章内容 -->
        <div class="content-right">
          <el-skeleton v-if="loading" :rows="10" animated />
          <el-card v-else-if="post" class="post-card">
            <h1 class="title">{{ post.title }}</h1>
            <div class="meta">
              <span>{{ formatDate(post.created_at) }}</span>
              <span>{{ post.views || 0 }} 阅读</span>
            </div>
            <div class="content" v-html="renderedContent"></div>
          </el-card>
          <el-empty v-else description="文章不存在" />
        </div>
      </div>
    </main>

    <!-- 返回顶部按钮 -->
    <div v-show="showBackTop" class="back-top" @click="scrollToTop">
      ↑
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { marked } from 'marked'

const route = useRoute()
const post = ref(null)
const postTags = ref([])
const loading = ref(true)
const showBackTop = ref(false)

const renderedContent = computed(() => {
  if (!post.value) return ''
  return marked(post.value.content)
})

onMounted(async () => {
  window.addEventListener('scroll', handleScroll)
  await loadPost()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

function handleScroll() {
  showBackTop.value = window.scrollY > 300
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function loadPost() {
  try {
    const res = await axios.get(`/api/posts/${route.params.slug}`)
    post.value = res.data
    if (res.data.id) {
      await loadPostTags(res.data.id)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadPostTags(postId) {
  try {
    const res = await axios.get(`/api/posts/${postId}/tags`)
    postTags.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.post-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1000px;
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
  top: 80px;
  height: fit-content;
}

.content-right {
  flex: 1;
  min-width: 0;
}

.sidebar-card {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.card-title {
  margin: 0 0 16px;
  font-size: 16px;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.back-btn {
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #e74c3c;
}

.category-tag {
  display: inline-block;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
}

.empty-text {
  color: #999;
  font-size: 14px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-block;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 13px;
}

.post-card {
  background: #f8f8f8;
  border-radius: 8px;
  border: none;
}

.title {
  margin: 0 0 16px;
  font-size: 28px;
  color: #333;
}

.meta {
  color: #999;
  font-size: 14px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.meta span {
  margin-right: 20px;
}

.content {
  line-height: 1.8;
  color: #333;
}

.content :deep(h1), .content :deep(h2), .content :deep(h3) {
  margin: 24px 0 12px;
  color: #333;
}

.content :deep(p) {
  margin: 16px 0;
}

.content :deep(code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
}

.content :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.content :deep(pre code) {
  background: none;
  padding: 0;
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

@media (max-width: 768px) {
  .content-left {
    display: none;
  }
}
</style>