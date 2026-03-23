<template>
  <div class="admin-categories">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>分类管理</span>
          <el-button type="primary" @click="openDialog()">新建分类</el-button>
        </div>
      </template>

      <el-table :data="categories" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="slug" label="Slug" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除?" @confirm="deleteCategory(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新建分类'" width="500">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="分类名称" />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="form.slug" placeholder="URL友好标识" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="分类描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const categories = ref([])
const loading = ref(true)
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const editId = ref(null)
const isEdit = ref(false)

const form = reactive({
  name: '',
  slug: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入Slug', trigger: 'blur' }]
}

onMounted(() => {
  loadCategories()
})

async function loadCategories() {
  loading.value = true
  try {
    const res = await axios.get('/api/admin/categories', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    categories.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function openDialog(category = null) {
  if (category) {
    isEdit.value = true
    editId.value = category.id
    form.name = category.name
    form.slug = category.slug
    form.description = category.description || ''
  } else {
    isEdit.value = false
    editId.value = null
    form.name = ''
    form.slug = ''
    form.description = ''
  }
  dialogVisible.value = true
}

async function saveCategory() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const config = {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }
    if (isEdit.value) {
      await axios.put(`/api/admin/categories/${editId.value}`, form, config)
    } else {
      await axios.post('/api/admin/categories', form, config)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadCategories()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteCategory(id) {
  try {
    await axios.delete(`/api/admin/categories/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    ElMessage.success('删除成功')
    await loadCategories()
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
</style>