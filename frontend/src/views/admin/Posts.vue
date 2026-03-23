<template>
  <div class="admin-posts">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文章列表</span>
          <el-button type="primary" @click="$router.push('/admin/posts/new')">新建文章</el-button>
        </div>
      </template>
      
      <!-- 搜索筛选 -->
      <el-form :inline="true" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="搜索标题/内容" clearable @keyup.enter="handleSearch" style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.status" placeholder="状态" clearable @change="handleSearch" style="width: 120px">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.categoryId" placeholder="分类" clearable @change="handleSearch" style="width: 150px">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.tagId" placeholder="标签" clearable @change="handleSearch" style="width: 150px">
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="posts" v-loading="loading">
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="views" label="阅读量" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="editPost(row.id)">编辑</el-button>
            <el-popconfirm title="确定删除?" @confirm="deletePost(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadPosts"
        @current-change="loadPosts"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const posts = ref([])
const categories = ref([])
const tags = ref([])
const loading = ref(true)

const searchForm = reactive({
  keyword: '',
  status: '',
  categoryId: '',
  tagId: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

onMounted(async () => {
  await Promise.all([loadCategories(), loadTags(), loadPosts()])
})

async function loadCategories() {
  try {
    const res = await axios.get('/api/categories')
    categories.value = res.data
  } catch (e) {}
}

async function loadTags() {
  try {
    const res = await axios.get('/api/tags')
    tags.value = res.data
  } catch (e) {}
}

async function loadPosts() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', pagination.page)
    params.append('pageSize', pagination.pageSize)
    if (searchForm.keyword) params.append('keyword', searchForm.keyword)
    if (searchForm.status) params.append('status', searchForm.status)
    if (searchForm.categoryId) params.append('categoryId', searchForm.categoryId)
    if (searchForm.tagId) params.append('tagId', searchForm.tagId)

    const res = await axios.get(`/api/admin/posts?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    posts.value = res.data.data
    pagination.total = res.data.total
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadPosts()
}

function resetSearch() {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.categoryId = ''
  searchForm.tagId = ''
  pagination.page = 1
  loadPosts()
}

function editPost(id) {
  router.push(`/admin/posts/edit/${id}`)
}

async function deletePost(id) {
  try {
    await axios.delete(`/api/admin/posts/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    ElMessage.success('删除成功')
    await loadPosts()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-form {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>