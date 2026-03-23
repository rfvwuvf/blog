<template>
  <div class="admin-tags">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>标签管理</span>
          <el-button type="primary" @click="openDialog()">新建标签</el-button>
        </div>
      </template>

      <el-table :data="tags" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="slug" label="Slug" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除?" @confirm="deleteTag(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑标签' : '新建标签'" width="500">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="标签名称" />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="form.slug" placeholder="URL友好标识" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTag" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const tags = ref([])
const loading = ref(true)
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const editId = ref(null)
const isEdit = ref(false)

const form = reactive({
  name: '',
  slug: ''
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入Slug', trigger: 'blur' }]
}

onMounted(() => {
  loadTags()
})

async function loadTags() {
  loading.value = true
  try {
    const res = await axios.get('/api/admin/tags', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    tags.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function openDialog(tag = null) {
  if (tag) {
    isEdit.value = true
    editId.value = tag.id
    form.name = tag.name
    form.slug = tag.slug
  } else {
    isEdit.value = false
    editId.value = null
    form.name = ''
    form.slug = ''
  }
  dialogVisible.value = true
}

async function saveTag() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const config = {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }
    if (isEdit.value) {
      await axios.put(`/api/admin/tags/${editId.value}`, form, config)
    } else {
      await axios.post('/api/admin/tags', form, config)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadTags()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteTag(id) {
  try {
    await axios.delete(`/api/admin/tags/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    ElMessage.success('删除成功')
    await loadTags()
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