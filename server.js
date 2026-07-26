// Import required modules
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from 'public' folder

// Path to our JSON database file
const DB_FILE = path.join(__dirname, 'database', 'data.json');

// Helper function to read todos from JSON file
const readTodos = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return an empty array
    return [];
  }
};

// Helper function to write todos to JSON file
const writeTodos = (todos) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(todos, null, 2), 'utf8');
};

// ---------- API ROUTES ----------

// GET all todos
app.get('/api/todos', (req, res) => {
  try {
    const todos = readTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Error reading todos', error: error.message });
  }
});

// POST a new todo
app.post('/api/todos', (req, res) => {
  try {
    const { title, completed = false } = req.body;
    // Validate: title is required
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }
    const todos = readTodos();
    // Create new todo with unique ID (timestamp + random)
    const newTodo = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      title: title.trim(),
      completed: completed,
      createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    writeTodos(todos);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error creating todo', error: error.message });
  }
});

// PUT (update) a todo by ID
app.put('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;
    const todos = readTodos();
    const index = todos.findIndex(todo => todo.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    // Update fields if provided
    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({ message: 'Title cannot be empty' });
      }
      todos[index].title = title.trim();
    }
    if (completed !== undefined) {
      todos[index].completed = completed;
    }
    writeTodos(todos);
    res.json(todos[index]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating todo', error: error.message });
  }
});

// DELETE a todo by ID
app.delete('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const todos = readTodos();
    const filtered = todos.filter(todo => todo.id !== id);
    if (filtered.length === todos.length) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    writeTodos(filtered);
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting todo', error: error.message });
  }
});

// PATCH to toggle complete status (optional, we also use PUT)
app.patch('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    if (completed === undefined) {
      return res.status(400).json({ message: 'Completed status is required' });
    }
    const todos = readTodos();
    const index = todos.findIndex(todo => todo.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    todos[index].completed = completed;
    writeTodos(todos);
    res.json(todos[index]);
  } catch (error) {
    res.status(500).json({ message: 'Error patching todo', error: error.message });
  }
});

// Catch-all route to serve index.html for any non-API routes (for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
