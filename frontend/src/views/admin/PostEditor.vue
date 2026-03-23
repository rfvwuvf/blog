<template>
  <div class="post-editor">
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑文章' : '新建文章' }}</span>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="form.slug" placeholder="URL友好标识，如: my-first-post" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.excerpt" type="textarea" :rows="2" placeholder="文章摘要（可选）" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="15" placeholder="支持Markdown格式" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category_id" placeholder="选择分类" clearable>
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="form.tags" multiple placeholder="选择标签" clearable>
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="draft">草稿</el-radio>
            <el-radio value="published">发布</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="savePost" :loading="saving">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const saving = ref(false)
const categories = ref([])
const tags = ref([])

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  category_id: null,
  tags: [],
  status: 'draft'
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入Slug', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadTags()])
  if (isEdit.value) {
    await loadPost()
  }
})

async function loadCategories() {
  try {
    const res = await axios.get('/api/categories')
    categories.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadTags() {
  try {
    const res = await axios.get('/api/tags')
    tags.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadPost() {
  try {
    const res = await axios.get(`/api/admin/posts/${route.params.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const post = res.data
    form.title = post.title
    form.slug = post.slug
    form.content = post.content
    form.excerpt = post.excerpt
    form.category_id = post.category_id
    form.status = post.status
    // 加载文章标签
    const tagRes = await axios.get(`/api/admin/posts/${route.params.id}/tags`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    form.tags = tagRes.data.map(t => t.tag_id)
  } catch (e) {
    ElMessage.error('加载文章失败')
    router.back()
  }
}

async function savePost() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const config = {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }
    if (isEdit.value) {
      await axios.put(`/api/admin/posts/${route.params.id}`, form, config)
    } else {
      await axios.post('/api/admin/posts', form, config)
    }
    ElMessage.success('保存成功')
    router.push('/admin/posts')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.post-editor {
  max-width: 900px;
}
</style>