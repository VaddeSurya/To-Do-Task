import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'grantify-kanban-tasks-v1'

const STATUSES = [
  { id: 'todo', label: 'To Do', accent: 'accent-todo' },
  { id: 'in-progress', label: 'In Progress', accent: 'accent-inprogress' },
  { id: 'done', label: 'Done', accent: 'accent-done' },
]

const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
]

const createDemoTasks = () => [
  {
    id: 't1',
    title: 'Set up Kanban board',
    description: 'Create columns, localStorage, and base layout.',
    status: 'todo',
    priority: 'high',
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: 't2',
    title: 'Polish UI',
    description: 'Add gradients, hover effects, and smooth transitions.',
    status: 'in-progress',
    priority: 'medium',
    createdAt: Date.now() - 1000 * 60 * 40,
  },
  {
    id: 't3',
    title: 'Write deployment notes',
    description: 'Add instructions for Vercel deployment.',
    status: 'done',
    priority: 'low',
    createdAt: Date.now() - 1000 * 60 * 10,
  },
]

const loadInitialTasks = () => {
  if (typeof window === 'undefined') return createDemoTasks()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDemoTasks()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return createDemoTasks()
    return parsed
  } catch (e) {
    console.error('Failed to parse tasks from localStorage, using demo tasks', e)
    return createDemoTasks()
  }
}

const App = () => {
  const [tasks, setTasks] = useState(loadInitialTasks)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [draggedId, setDraggedId] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e)
    }
  }, [tasks])

  const openCreateForm = () => {
    setEditingTask(null)
    setIsFormOpen(true)
  }

  const openEditForm = (task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingTask(null)
  }

  const handleSubmitTask = (payload) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? { ...t, ...payload }
            : t,
        ),
      )
    } else {
      const newTask = {
        id: `t_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: Date.now(),
        ...payload,
      }
      setTasks((prev) => [newTask, ...prev])
    }
    closeForm()
  }

  const handleDelete = (id) => {
    if (!window.confirm('Delete this task?')) return
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const handleDragStart = (id) => {
    setDraggedId(id)
  }

  const handleDropOnColumn = (status) => {
    if (!draggedId) return
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggedId ? { ...t, status } : t,
      ),
    )
    setDraggedId(null)
  }

  const filteredTasks = tasks.filter((task) => {
    if (!search.trim()) return true
    const haystack = (task.title + ' ' + (task.description || '')).toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  return (
    <div className="app-root">
      <div className="app-gradient" />
      <header className="app-header">
        <div>
          <h1 className="app-title">Grantify Kanban</h1>
          <p className="app-subtitle">
            Lightweight, fast, and persistent Kanban board for your daily flow.
          </p>
        </div>
        <div className="header-actions">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="input search-input"
          />
          <button className="btn primary" onClick={openCreateForm}>
            + New Task
          </button>
        </div>
      </header>

      <main className="board">
        {STATUSES.map((column) => (
          <section
            key={column.id}
            className={`column ${column.accent}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDropOnColumn(column.id)}
          >
            <header className="column-header">
              <h2>{column.label}</h2>
              <span className="badge">
                {filteredTasks.filter((t) => t.status === column.id).length}
              </span>
            </header>
            <div className="column-body">
              {filteredTasks
                .filter((task) => task.status === column.id)
                .sort((a, b) => a.createdAt - b.createdAt)
                .map((task) => (
                  <article
                    key={task.id}
                    className="task-card"
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                  >
                    <header className="task-header">
                      <h3 className="task-title">{task.title}</h3>
                      <span className={`pill pill-${task.priority}`}>
                        {task.priority}
                      </span>
                    </header>
                    {task.description && (
                      <p className="task-desc">{task.description}</p>
                    )}
                    <footer className="task-footer">
                      <div className="task-actions">
                        <button
                          className="icon-btn"
                          onClick={() => openEditForm(task)}
                        >
                          ✏️
                        </button>
                        <button
                          className="icon-btn danger"
                          onClick={() => handleDelete(task.id)}
                        >
                          🗑
                        </button>
                      </div>
                      <select
                        className="status-select"
                        value={task.status}
                        onChange={(e) =>
                          setTasks((prev) =>
                            prev.map((t) =>
                              t.id === task.id
                                ? { ...t, status: e.target.value }
                                : t,
                            ),
                          )
                        }
                      >
                        {STATUSES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </footer>
                  </article>
                ))}
              {filteredTasks.filter((t) => t.status === column.id).length === 0 && (
                <p className="column-empty">Drop a task here or create a new one.</p>
              )}
            </div>
          </section>
        ))}
      </main>

      <footer className="app-footer">
        <span>Local-first • Auto-saved to your browser • Optimized for Vercel</span>
      </footer>

      {isFormOpen && (
        <TaskFormModal
          onClose={closeForm}
          onSubmit={handleSubmitTask}
          initial={editingTask}
        />
      )}
    </div>
  )
}

const TaskFormModal = ({ onClose, onSubmit, initial }) => {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priority, setPriority] = useState(initial?.priority ?? 'medium')
  const [status, setStatus] = useState(initial?.status ?? 'todo')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{initial ? 'Edit Task' : 'New Task'}</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </header>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="field">
            <span>Title</span>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Prepare product demo"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done?"
              rows={3}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Priority</span>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Status</span>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn subtle"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary">
              {initial ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App
