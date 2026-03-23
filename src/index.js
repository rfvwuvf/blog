/**
 * 博客后端 API - Cloudflare Workers + D1
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method
    const query = url.searchParams

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      let response

      // 公开 API
      if (path === '/api/posts' && method === 'GET') {
        response = await getPosts(env, query)
      } else if (path.match(/^\/api\/posts\/[^/]+$/) && method === 'GET') {
        const slug = path.split('/')[3]
        response = await getPostBySlug(env, slug)
      } else if (path === '/api/categories' && method === 'GET') {
        response = await getCategories(env)
      } else if (path === '/api/tags' && method === 'GET') {
        response = await getTags(env)
      } else if (path === '/api/settings' && method === 'GET') {
        response = await getSettings(env)
      } else if (path.match(/^\/api\/posts\/\d+\/tags$/) && method === 'GET') {
        const id = path.split('/')[3]
        response = await getPostTags(env, id)
      } else if (path === '/api/auth/login' && method === 'POST') {
        response = await login(request, env)
      }
      // 需要认证的 API
      else if (path.startsWith('/api/admin')) {
        const user = await verifyAuth(request, env)
        if (!user) {
          response = Response.json({ error: '未授权' }, { status: 401 })
        }
        // 文章管理
        else if (path === '/api/admin/posts' && method === 'GET') {
          response = await getAdminPosts(env, query)
        } else if (path === '/api/admin/posts' && method === 'POST') {
          response = await createPost(request, env)
        } else if (path.match(/^\/api\/admin\/posts\/\d+\/tags$/) && method === 'GET') {
          const id = path.split('/')[4]
          response = await getPostTags(env, id)
        } else if (path.match(/^\/api\/admin\/posts\/\d+$/) && method === 'GET') {
          const id = path.split('/')[4]
          response = await getPostById(env, id)
        } else if (path.match(/^\/api\/admin\/posts\/\d+$/) && method === 'PUT') {
          const id = path.split('/')[4]
          response = await updatePost(request, env, id)
        } else if (path.match(/^\/api\/admin\/posts\/\d+$/) && method === 'DELETE') {
          const id = path.split('/')[4]
          response = await deletePost(env, id)
        }
        // 分类管理
        else if (path === '/api/admin/categories' && method === 'GET') {
          response = await getCategories(env)
        } else if (path === '/api/admin/categories' && method === 'POST') {
          response = await createCategory(request, env)
        } else if (path.match(/^\/api\/admin\/categories\/\d+$/) && method === 'PUT') {
          const id = path.split('/')[4]
          response = await updateCategory(request, env, id)
        } else if (path.match(/^\/api\/admin\/categories\/\d+$/) && method === 'DELETE') {
          const id = path.split('/')[4]
          response = await deleteCategory(env, id)
        }
        // 标签管理
        else if (path === '/api/admin/tags' && method === 'GET') {
          response = await getTags(env)
        } else if (path === '/api/admin/tags' && method === 'POST') {
          response = await createTag(request, env)
        } else if (path.match(/^\/api\/admin\/tags\/\d+$/) && method === 'PUT') {
          const id = path.split('/')[4]
          response = await updateTag(request, env, id)
        } else if (path.match(/^\/api\/admin\/tags\/\d+$/) && method === 'DELETE') {
          const id = path.split('/')[4]
          response = await deleteTag(env, id)
        }
      }



      // 静态文件服务
      else if (path.startsWith('/assets/') || path === '/favicon.ico') {
        if (env.ASSETS && env.ASSETS.fetch) {
          response = await env.ASSETS.fetch(request)
        } else {
          response = new Response('ASSETS binding not found', { status: 500 })
        }
      }
      else if (!path.startsWith('/api')) {
        if (env.ASSETS && env.ASSETS.fetch) {
          // 所有非 API 请求都返回 index.html
          const indexUrl = new URL(request.url)
          indexUrl.pathname = '/index.html'
          response = await env.ASSETS.fetch(indexUrl)
        } else {
          response = new Response('前端未构建', { status: 404 })
        }
      }

      if (!response) {
        response = Response.json({ error: 'Not Found' }, { status: 404 })
      }




      const newHeaders = new Headers(response.headers)
      Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v))
      return new Response(response.body, { ...response, headers: newHeaders })

    } catch (error) {
      return Response.json({ error: error.message }, { status: 500, headers: corsHeaders })
    }
  }
}

// 获取公开文章列表（已发布）- 支持分页
async function getPosts(env, query) {
  const page = parseInt(query.get('page') || '1')
  const pageSize = parseInt(query.get('pageSize') || '10')
  const keyword = query.get('keyword') || ''
  const categoryId = query.get('categoryId') || ''
  const offset = (page - 1) * pageSize

  let countSql = 'SELECT COUNT(*) as total FROM posts WHERE status = ?'
  let sql = 'SELECT id, title, slug, excerpt, content, views, created_at FROM posts WHERE status = ?'
  const params = ['published']

  if (keyword) {
    countSql += ' AND (title LIKE ? OR content LIKE ?)'
    sql += ' AND (title LIKE ? OR content LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  if (categoryId) {
    countSql += ' AND category_id = ?'
    sql += ' AND category_id = ?'
    params.push(categoryId)
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'

  const countResult = await env.DB.prepare(countSql).bind(...params).first()
  const result = await env.DB.prepare(sql).bind(...params, pageSize, offset).all()

  return Response.json({
    data: result.results,
    total: countResult.total,
    page,
    pageSize,
    totalPages: Math.ceil(countResult.total / pageSize)
  })
}

// 根据 slug 获取文章
async function getPostBySlug(env, slug) {
  const post = await env.DB.prepare(
    'SELECT p.*, c.name as category_name FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND p.status = ?'
  ).bind(slug, 'published').first()

  if (!post) {
    return Response.json({ error: '文章不存在' }, { status: 404 })
  }

  await env.DB.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').bind(post.id).run()

  return Response.json(post)
}

// 获取文章的标签
async function getPostTags(env, id) {
  const result = await env.DB.prepare(
    'SELECT t.id, t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?'
  ).bind(id).all()
  return Response.json(result.results)
}

// 获取分类列表
async function getCategories(env) {
  const result = await env.DB.prepare('SELECT * FROM categories ORDER BY created_at DESC').all()
  return Response.json(result.results)
}

// 获取标签列表
async function getTags(env) {
  const result = await env.DB.prepare('SELECT * FROM tags ORDER BY created_at DESC').all()
  return Response.json(result.results)
}

// 登录
async function login(request, env) {
  const { username, password } = await request.json()

  const passwordHash = await sha256(password)

  const user = await env.DB.prepare(
    'SELECT id, username, password, role FROM users WHERE username = ?'
  ).bind(username).first()

  if (!user || user.password !== passwordHash) {
    return Response.json({ error: '用户名或密码错误' }, { status: 401 })
  }

  const token = await generateToken(user.id, env)

  return Response.json({ token, user: { id: user.id, username: user.username, role: user.role } })
}

// 验证认证
async function verifyAuth(request, env) {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null

  try {
    const token = auth.slice(7)
    const payload = await verifyToken(token, env)
    if (!payload) return null

    const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE id = ?').bind(payload.userId).first()
    return user
  } catch {
    return null
  }
}

// ========== 安全工具函数 ==========

async function sha256(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function getSecretKey(env) {
  const secret = env.JWT_SECRET || 'your-super-secret-key-change-in-production'
  const encoder = new TextEncoder()
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function generateToken(userId, env) {
  const exp = Date.now() + 86400000
  const payload = `${userId}.${exp}`
  const key = await getSecretKey(env)
  const encoder = new TextEncoder()
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const sigHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${payload}.${sigHex}`
}

async function verifyToken(token, env) {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [userIdStr, expStr, sigHex] = parts
  const payload = `${userIdStr}.${expStr}`
  const exp = parseInt(expStr)

  if (isNaN(exp) || exp < Date.now()) return null

  const key = await getSecretKey(env)
  const encoder = new TextEncoder()
  const sigBytes = new Uint8Array(sigHex.match(/.{2}/g).map(b => parseInt(b, 16)))

  const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload))
  if (!isValid) return null

  const userId = parseInt(userIdStr)
  if (isNaN(userId)) return null

  return { userId, exp }
}

// 获取所有文章（管理后台）- 支持搜索和分页
async function getAdminPosts(env, query) {
  const page = parseInt(query.get('page') || '1')
  const pageSize = parseInt(query.get('pageSize') || '10')
  const keyword = query.get('keyword') || ''
  const status = query.get('status') || ''
  const categoryId = query.get('categoryId') || ''
  const tagId = query.get('tagId') || ''

  const offset = (page - 1) * pageSize
  let whereClauses = []
  let params = []

  if (keyword) {
    whereClauses.push('(title LIKE ? OR content LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  if (status) {
    whereClauses.push('status = ?')
    params.push(status)
  }
  if (categoryId) {
    whereClauses.push('category_id = ?')
    params.push(categoryId)
  }
  if (tagId) {
    whereClauses.push('id IN (SELECT post_id FROM post_tags WHERE tag_id = ?)')
    params.push(tagId)
  }

  const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM posts ${whereSQL}`
  ).bind(...params).first()

  const result = await env.DB.prepare(
    `SELECT p.*, c.name as category_name FROM posts p LEFT JOIN categories c ON p.category_id = c.id ${whereSQL} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset).all()

  return Response.json({
    data: result.results,
    total: countResult.total,
    page,
    pageSize,
    totalPages: Math.ceil(countResult.total / pageSize)
  })
}

// 获取单篇文章（管理后台）
async function getPostById(env, id) {
  const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first()
  if (!post) {
    return Response.json({ error: '文章不存在' }, { status: 404 })
  }
  return Response.json(post)
}

// 创建文章
async function createPost(request, env) {
  const data = await request.json()

  const result = await env.DB.prepare(
    'INSERT INTO posts (title, slug, content, excerpt, status, category_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(data.title, data.slug, data.content, data.excerpt || null, data.status, data.category_id || null).run()

  const postId = result.meta.last_row_id

  // 处理标签
  if (data.tags && data.tags.length > 0) {
    for (const tagId of data.tags) {
      await env.DB.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)').bind(postId, tagId).run()
    }
  }

  return Response.json({ id: postId, message: '创建成功' })
}

// 更新文章
async function updatePost(request, env, id) {
  const data = await request.json()

  await env.DB.prepare(
    'UPDATE posts SET title = ?, slug = ?, content = ?, excerpt = ?, status = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(data.title, data.slug, data.content, data.excerpt || null, data.status, data.category_id || null, id).run()

  // 更新标签关联
  await env.DB.prepare('DELETE FROM post_tags WHERE post_id = ?').bind(id).run()
  if (data.tags && data.tags.length > 0) {
    for (const tagId of data.tags) {
      await env.DB.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)').bind(id, tagId).run()
    }
  }

  return Response.json({ message: '更新成功' })
}

// 删除文章
async function deletePost(env, id) {
  await env.DB.prepare('DELETE FROM post_tags WHERE post_id = ?').bind(id).run()
  await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()
  return Response.json({ message: '删除成功' })
}

// ========== 分类管理 ==========

async function createCategory(request, env) {
  const data = await request.json()
  const result = await env.DB.prepare(
    'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)'
  ).bind(data.name, data.slug, data.description || null).run()
  return Response.json({ id: result.meta.last_row_id, message: '创建成功' })
}

async function updateCategory(request, env, id) {
  const data = await request.json()
  await env.DB.prepare(
    'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?'
  ).bind(data.name, data.slug, data.description || null, id).run()
  return Response.json({ message: '更新成功' })
}

async function deleteCategory(env, id) {
  await env.DB.prepare('UPDATE posts SET category_id = NULL WHERE category_id = ?').bind(id).run()
  await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
  return Response.json({ message: '删除成功' })
}

// ========== 标签管理 ==========

async function createTag(request, env) {
  const data = await request.json()
  const result = await env.DB.prepare(
    'INSERT INTO tags (name, slug) VALUES (?, ?)'
  ).bind(data.name, data.slug).run()
  return Response.json({ id: result.meta.last_row_id, message: '创建成功' })
}

async function updateTag(request, env, id) {
  const data = await request.json()
  await env.DB.prepare(
    'UPDATE tags SET name = ?, slug = ? WHERE id = ?'
  ).bind(data.name, data.slug, id).run()
  return Response.json({ message: '更新成功' })
}

async function deleteTag(env, id) {
  await env.DB.prepare('DELETE FROM post_tags WHERE tag_id = ?').bind(id).run()
  await env.DB.prepare('DELETE FROM tags WHERE id = ?').bind(id).run()
  return Response.json({ message: '删除成功' })
}

// ========== 网站设置 ==========

async function getSettings(env) {
  const result = await env.DB.prepare('SELECT key, value FROM settings').all()
  const settings = {}
  for (const row of result.results) {
    settings[row.key] = row.value
  }
  return Response.json(settings)
}