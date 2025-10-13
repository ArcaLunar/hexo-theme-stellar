/**
 * notebooks.js v1
 */

'use strict'

class NotePage {
  constructor(page) {
    this.id = page._id
    this.notebook = page.notebook
    this.title = page.title
    this.tags = page.tags
    this.path = page.path
    this.path_key = page.path.replace('.html', '')
    this.layout = page.layout
    this.date = page.date
    this.updated = page.updated || page.date

    const pin = page.pin ?? page.sticky ?? 0
    if (pin === true) {
      this.pin = 1
    } else if (pin === false) {
      this.pin = 0
    } else {
      this.pin = pin
    }
  }
}

function splitTag(tag) {
  return tag.split('/').filter(t => t.length > 0)
}

function slugifyTagId(name) {
  const base = name.toLowerCase().trim()
  const slug = base
    .replace(/[\s/_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (slug.length > 0) {
    return slug
  }
  return Buffer.from(name).toString('hex')
}

function normalizeNotebookTags(rawTags) {
  if (!rawTags) {
    return []
  }
  const tags = Array.isArray(rawTags) ? rawTags : [rawTags]
  return tags
    .map(tag => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean)
    .map(name => ({ id: slugifyTagId(name), name }))
}

function buildGlobalTagPath(ctx, tagId) {
  const baseDir = ctx.theme.config.site_tree.notebooks.base_dir || 'notebooks'
  const normalized = baseDir.replace(/^\//, '').replace(/\/$/, '')
  const prefix = normalized.length > 0 ? `${normalized}/` : ''
  return `${prefix}tags/${tagId}/index.html`
}

function prepareNotebook(id, info, ctx) {
  const notebook = info
  notebook.id = id

  if (notebook.base_dir) {
    if (notebook.base_dir.startsWith('/')) {
      notebook.base_dir = notebook.base_dir.substring(1)
    }
    if (notebook.base_dir.endsWith('/')) {
      notebook.base_dir = notebook.base_dir.substring(0, notebook.base_dir.length - 1)
    }
  } else {
    const notebooksBaseDir = ctx.theme.config.site_tree.notebooks.base_dir
    notebook.base_dir = notebooksBaseDir ? `${notebooksBaseDir}/${id}` : id
  }

  notebook.sort ||= 0
  notebook.auto_excerpt ||= ctx.theme.config.notebook.auto_excerpt || 0
  notebook.per_page ??= ctx.theme.config.notebook.per_page ?? ctx.config.per_page ?? 10
  notebook.order_by ||= ctx.theme.config.notebook.order_by || '-updated'
  notebook.menu_id ??= ctx.theme.config.site_tree.notes.menu_id
  notebook.license ??= ctx.theme.config.notebook.license
  notebook.share ??= ctx.theme.config.notebook.share

  notebook.leftbar ??= ctx.theme.config.site_tree.notes.leftbar
  notebook.rightbar ??= ctx.theme.config.site_tree.notes.rightbar
  notebook.note_leftbar ??= ctx.theme.config.site_tree.note.leftbar
  notebook.note_rightbar ??= ctx.theme.config.site_tree.note.rightbar

  const tagMap = new Map() // tagId: tagInfo
  notebook.tagTree = tagMap
  const notebookTags = normalizeNotebookTags(notebook.tags)
  notebook.tagsMeta = notebookTags
  notebook.tagIds = notebookTags.map(tag => tag.id)
  notebook.tagNames = notebookTags.map(tag => tag.name)
  notebook.tags = notebook.tagNames

  const rootTag = {
    id: '',
    name: '',
    part: '',
    path: notebook.base_dir,
    parent: null, // parent tag id
    childSet: new Set(), // child tag ids
    noteSet: new Set(), // note ids
  }
  tagMap.set(rootTag.id, rootTag)

  // Iterate through all notes in the notebook, build the tag tree.
  const allPages = ctx.locals.get('pages')
  const pages = allPages.filter(p => p.notebook === notebook.id)
  for (const page of pages.data) {
    rootTag.noteSet.add(page._id)

    if (!page.tags) {
      continue
    }

    for (const hierarchyTag of page.tags) {
      const parts = splitTag(hierarchyTag)
      let parent = rootTag
      for (const part of parts) {
        const tagName = parent.name ? `${parent.name}/${part}` : part
        const tagId = tagName.toLowerCase()
        let tag = tagMap.get(tagId)
        if (tag == null) {
          tag = {
            id: tagId,
            name: tagName,
            part: part,
            path: `${notebook.base_dir}/tags/${tagId}`,
            parent: parent.id,
            childSet: new Set(),
            noteSet: new Set(),
          }
          tagMap.set(tagId, tag)
          parent.childSet.add(tagId)
        }

        tag.noteSet.add(page._id)
        parent = tag
      }
    }
  }

  notebook.noteMap = pages.map(p => new NotePage(p)).reduce((map, note) => {
    map.set(note.id, note)
    return map
  }, new Map())

  // Sort child tags for each tag.
  for (const [_, tag] of tagMap) {
    tag.children = Array.from(tag.childSet)
    tag.children.sort()
  }

  return notebook
}

function getNotebooksObject(ctx) {
  const notebooks = {
    tree: {},
  }

  const data = ctx.locals.get('data')
  const list = []
  for (const [key, info] of Object.entries(data)) {
    if (!key.startsWith('notebooks/') || key.endsWith('.DS_Store')) {
      continue
    }
    const id = key.substring(10)
    list.push(prepareNotebook(id, info, ctx))
  }
  list.sort((a, b) => a.sort - b.sort)

  const globalTagMap = new Map()

  for (const info of list) {
    notebooks.tree[info.id] = info

    for (const tagMeta of info.tagsMeta) {
      const tagId = tagMeta.id
      let aggregated = globalTagMap.get(tagId)
      if (!aggregated) {
        aggregated = {
          id: tagId,
          name: tagMeta.name,
          path: buildGlobalTagPath(ctx, tagId),
          notebooks: []
        }
        globalTagMap.set(tagId, aggregated)
      }
      if (!aggregated.notebooks.includes(info.id)) {
        aggregated.notebooks.push(info.id)
      }
    }
  }

  const allTags = {}
  Array.from(globalTagMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(tag => {
      tag.notebooks.sort((a, b) => a.localeCompare(b))
      allTags[tag.id] = tag
    })

  notebooks.all_tags = allTags

  return notebooks
}

module.exports = ctx => {
  const notebooks = getNotebooksObject(ctx)
  ctx.theme.config.notebooks = notebooks
}
