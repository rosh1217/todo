// ============================================================
// Todo Master - Frontend JavaScript
// ============================================================

// --- DOM References ---
const todoList = document.getElementById('todoList');
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const pendingTasksSpan = document.getElementById('pendingTasks');
const emptyState = document.getElementById('emptyState');
const loadingSpinner = document.getElementById('loadingSpinner');
const themeToggle = document.getElementById('themeToggle');
const toastContainer = document.getElementById('toastContainer');
const confirmModal = document.getElementById('confirmModal');
const modalConfirmBtn = document.getElementById('modalConfirm');
const modalCancelBtn = document.getElementById('modalCancel');
const modalTodoTitle = document.getElementById('modalTodoTitle');

// --- State ---
let todos = [];
let currentFilter = 'all';
let currentSearch = '';
let deleteTargetId = null; // For modal confirmation

// --- API Base URL (relative to origin) ---
const API_BASE = '/api/todos';

// --- Theme Handling ---
// Check local storage for theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
} else {
  themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// --- Toast System ---
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const iconMap = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  };
  toast.innerHTML = `<i class="fas ${iconMap[type] || 'fa-info-circle'}"></i> ${message}`;
  toastContainer.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- API Calls ---
async function fetchTodos() {
  showLoading(true);
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) throw new Error('Failed to fetch todos');
    todos = await response.json();
    renderTodos();
  } catch (error) {
    showToast('Error loading todos: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function addTodo(title) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add todo');
    }
    const newTodo = await response.json();
    todos.unshift(newTodo); // Add to top
    renderTodos();
    showToast('Todo added successfully!', 'success');
    return newTodo;
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
    throw error;
  }
}

async function updateTodo(id, updates) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update todo');
    }
    const updated = await response.json();
    // Update in local array
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) todos[index] = updated;
    renderTodos();
    showToast('Todo updated!', 'success');
    return updated;
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
    throw error;
  }
}

async function deleteTodo(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete todo');
    }
    // Remove from local array
    todos = todos.filter(t => t.id !== id);
    renderTodos();
    showToast('Todo deleted.', 'info');
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
    throw error;
  }
}

// --- Loading Spinner ---
function showLoading(show) {
  loadingSpinner.style.display = show ? 'flex' : 'none';
}

// --- Render Todos ---
function renderTodos() {
  // Apply search and filter
  let filtered = todos;

  // Search
  if (currentSearch.trim() !== '') {
    const searchLower = currentSearch.toLowerCase().trim();
    filtered = filtered.filter(todo =>
      todo.title.toLowerCase().includes(searchLower)
    );
  }

  // Filter
  if (currentFilter === 'completed') {
    filtered = filtered.filter(todo => todo.completed === true);
  } else if (currentFilter === 'pending') {
    filtered = filtered.filter(todo => todo.completed === false);
  }

  // Update stats
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const pending = total - completed;
  totalTasksSpan.textContent = total;
  completedTasksSpan.textContent = completed;
  pendingTasksSpan.textContent = pending;

  // Show/hide empty state
  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    todoList.innerHTML = '';
    return;
  } else {
    emptyState.style.display = 'none';
  }

  // Build list
  let html = '';
  filtered.forEach(todo => {
    const isCompleted = todo.completed;
    const checkedClass = isCompleted ? 'completed' : '';
    const titleClass = isCompleted ? 'completed-text' : '';
    const checkIcon = isCompleted ? '<i class="fas fa-check"></i>' : '';

    // Format date (createdAt)
    const date = new Date(todo.createdAt);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    html += `
      <li class="todo-item" data-id="${todo.id}">
        <button class="todo-check ${checkedClass}" data-action="toggle" data-id="${todo.id}">
          ${checkIcon}
        </button>
        <div class="todo-content">
          <span class="todo-title ${titleClass}" data-action="edit" data-id="${todo.id}">${escapeHTML(todo.title)}</span>
          <div class="todo-meta">
            <span><i class="far fa-calendar-alt"></i> ${dateStr}</span>
            <span>${isCompleted ? '✅ Completed' : '⏳ Pending'}</span>
          </div>
        </div>
        <div class="todo-actions">
          <button class="edit-btn" data-action="edit" data-id="${todo.id}" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="delete-btn" data-action="delete" data-id="${todo.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
      </li>
    `;
  });
  todoList.innerHTML = html;
}

// Simple escape to prevent XSS
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Event Delegation for Todo Actions ---
todoList.addEventListener('click', async (e) => {
  const target = e.target.closest('button');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!id) return;

  if (action === 'toggle') {
    // Toggle completion
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    try {
      await updateTodo(id, { completed: !todo.completed });
    } catch (error) {
      // error already handled
    }
  } else if (action === 'delete') {
    // Show confirmation modal
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    deleteTargetId = id;
    modalTodoTitle.textContent = `"${todo.title}"`;
    confirmModal.classList.add('active');
  } else if (action === 'edit') {
    // Initiate inline edit
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    // Find the todo-item and replace title with input
    const item = target.closest('.todo-item');
    const titleSpan = item.querySelector('.todo-title');
    const currentTitle = todo.title;
    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = currentTitle;
    // Replace span with input
    titleSpan.replaceWith(input);
    input.focus();
    input.select();

    // Handle blur and keypress to save
    const saveEdit = async () => {
      const newTitle = input.value.trim();
      if (newTitle === '') {
        showToast('Title cannot be empty', 'error');
        // revert
        input.replaceWith(titleSpan);
        return;
      }
      if (newTitle !== currentTitle) {
        try {
          await updateTodo(id, { title: newTitle });
        } catch (error) {
          // revert on error
          input.replaceWith(titleSpan);
        }
      } else {
        // no change, revert
        input.replaceWith(titleSpan);
      }
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
      if (e.key === 'Escape') {
        input.replaceWith(titleSpan);
      }
    });
  }
});

// --- Modal Confirm/Cancel ---
modalConfirmBtn.addEventListener('click', async () => {
  if (deleteTargetId) {
    await deleteTodo(deleteTargetId);
    deleteTargetId = null;
    confirmModal.classList.remove('active');
  }
});

modalCancelBtn.addEventListener('click', () => {
  deleteTargetId = null;
  confirmModal.classList.remove('active');
});

// Close modal on overlay click
confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    deleteTargetId = null;
    confirmModal.classList.remove('active');
  }
});

// --- Add Todo Form ---
todoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = todoInput.value.trim();
  if (!title) {
    showToast('Please enter a todo title', 'error');
    return;
  }
  // Disable button during request
  addBtn.disabled = true;
  addBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Adding...';
  try {
    await addTodo(title);
    todoInput.value = '';
    todoInput.focus();
  } catch (error) {
    // error already shown
  } finally {
    addBtn.disabled = false;
    addBtn.innerHTML = '<i class="fas fa-plus"></i> Add';
  }
});

// --- Search Input ---
searchInput.addEventListener('input', (e) => {
  currentSearch = e.target.value;
  renderTodos();
});

// --- Filter Select ---
filterSelect.addEventListener('change', (e) => {
  currentFilter = e.target.value;
  renderTodos();
});

// --- Initial Load ---
fetchTodos();

// --- Keyboard shortcut: Ctrl+ / Cmd+ to focus search ---
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    searchInput.focus();
  }
});

// --- Auto-focus input on load ---
todoInput.focus();
