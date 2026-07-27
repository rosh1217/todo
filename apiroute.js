const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

const IS_VERCEL = process.env.VERCEL === '1';
const ORIGINAL_DATA_FILE = path.join(__dirname, 'database', 'data.json');
const DATA_FILE = IS_VERCEL ? path.join('/tmp', 'data.json') : ORIGINAL_DATA_FILE;

// Memory cache for Vercel since /tmp might get wiped between invocations
let memoryTodos = null;

// Helper to read data safely
async function getTodos() {
  if (IS_VERCEL && memoryTodos !== null) {
    return memoryTodos;
  }
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (IS_VERCEL) memoryTodos = parsed;
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      if (IS_VERCEL) {
        try {
          const originalData = await fs.readFile(ORIGINAL_DATA_FILE, 'utf8');
          const parsed = JSON.parse(originalData);
          memoryTodos = parsed;
          return parsed;
        } catch (e) {
          // Fallback if original doesn't exist
        }
      }
      return [];
    }
    if (error instanceof SyntaxError) {
      console.error('Data file is corrupted. Returning empty array.');
      return [];
    }
    throw error;
  }
}

// Helper to write data safely
async function saveTodos(todos) {
  if (IS_VERCEL) {
    memoryTodos = todos;
  }
  try {
    const tempFile = `${DATA_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(todos, null, 2), 'utf8');
    await fs.rename(tempFile, DATA_FILE);
  } catch (error) {
    console.error('Failed to save data.json:', error.message);
    if (error.code !== 'EROFS') {
      throw error;
    }
  }
}

// GET /api/todos
router.get('/todos', async (req, res, next) => {
  try {
    const todos = await getTodos();
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

// POST /api/todos
router.post('/todos', async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required and must be a string' });
    }

    const todos = await getTodos();
    const newTodo = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    todos.unshift(newTodo);
    await saveTodos(todos);
    res.status(201).json(newTodo);
  } catch (error) {
    next(error);
  }
});

// PUT /api/todos/:id
router.put('/todos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;
    
    const todos = await getTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const updatedTodo = { ...todos[index] };
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
         return res.status(400).json({ message: 'Title must be a non-empty string' });
      }
      updatedTodo.title = title.trim();
    }
    if (completed !== undefined) {
      updatedTodo.completed = Boolean(completed);
    }

    todos[index] = updatedTodo;
    await saveTodos(todos);
    res.json(updatedTodo);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/todos/:id
router.delete('/todos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let todos = await getTodos();
    const initialLength = todos.length;
    
    todos = todos.filter(t => t.id !== id);
    
    if (todos.length === initialLength) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    await saveTodos(todos);
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
