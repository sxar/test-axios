const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const users = [
  { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', status: 'active', role: 'admin' },
  { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', status: 'active', role: 'user' },
  { id: 3, firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', status: 'inactive', role: 'user' }
];
let nextId = 4;

app.get('/api/users', (req, res) => {
  const { page = 1, limit = 10, search, role, status } = req.query;
  let filtered = [...users];

  if (search) {
    filtered = filtered.filter(u =>
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (role) {
    filtered = filtered.filter(u => u.role === role);
  }

  if (status) {
    filtered = filtered.filter(u => u.status === status);
  }

  const start = (page - 1) * parseInt(limit);
  const end = start + parseInt(limit);
  const paginatedUsers = filtered.slice(start, end);

  res.json({
    data: paginatedUsers,
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/users', (req, res) => {
  const user = { id: nextId++, ...req.body, status: 'active' };
  users.push(user);
  res.status(201).json(user);
});

app.put('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body, id: parseInt(req.params.id) };
    res.json(users[index]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.patch('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    res.json(users[index]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    users.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.head('/api/users', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.set('Content-Length', JSON.stringify(users).length.toString());
  res.status(200).send();
});

app.options('/api/users', (req, res) => {
  res.set('Allow', 'GET, POST, HEAD, OPTIONS');
  res.set('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).send();
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && (auth.startsWith('Bearer ') || auth.startsWith('Basic '))) return next();
  if (req.headers['x-api-key']) return next();
  res.status(401).json({ error: 'Authentication required' });
}

app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: 'Protected data', user: 'authenticated', timestamp: Date.now() });
});

app.get('/api/error/:code', (req, res) => {
  const code = parseInt(req.params.code);
  res.status(code).json({ error: `Simulated ${code} error`, code });
});

app.get('/api/slow', (req, res) => {
  const delay = parseInt(req.query.delay) || 5000;
  setTimeout(() => {
    res.json({ message: 'Slow response', delay });
  }, delay);
});

app.get('/api/text', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('Hello, World!');
});

app.get('/api/wrapped', (req, res) => {
  res.json({ success: true, data: { users: users.slice(0, 3) } });
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    id: Date.now(),
    filename: req.file.originalname,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    description: req.body.description || ''
  });
});

app.post('/api/upload/multiple', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const files = req.files.map(file => ({
    id: Date.now() + Math.random(),
    filename: file.originalname,
    size: file.size,
    url: `/uploads/${file.filename}`
  }));

  res.json({ files, count: files.length });
});

app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  res.set('Content-Type', 'application/octet-stream');

  const dummyData = Buffer.alloc(1024 * 100);
  res.send(dummyData);
});

app.get('/api/posts', (req, res) => {
  res.json({ data: [
    { id: 1, title: 'First Post', content: 'Content 1' },
    { id: 2, title: 'Second Post', content: 'Content 2' }
  ]});
});

app.get('/api/comments', (req, res) => {
  res.json({ data: [
    { id: 1, text: 'Great post!', userId: 1 },
    { id: 2, text: 'Thanks for sharing', userId: 2 }
  ]});
});

app.get('/api/stats', (req, res) => {
  res.json({ data: {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalPosts: 2,
    totalComments: 2
  }});
});

app.get('/api/activity', (req, res) => {
  res.json({ data: [
    { id: 1, action: 'User logged in', timestamp: Date.now() - 3600000 },
    { id: 2, action: 'New post created', timestamp: Date.now() - 1800000 }
  ]});
});

let flakyAttempts = 0;
app.get('/api/flaky', (req, res) => {
  flakyAttempts++;
  if (flakyAttempts < 3) {
    res.status(503).json({ error: 'Service temporarily unavailable', attempt: flakyAttempts });
  } else {
    flakyAttempts = 0;
    res.json({ message: 'Success after retries', data: { id: 1, value: 'test' } });
  }
});

app.listen(PORT, () => {
  console.log(`✓ API server running on http://localhost:${PORT}`);
  console.log(`  - GET    /api/users`);
  console.log(`  - POST   /api/users`);
  console.log(`  - PUT    /api/users/:id`);
  console.log(`  - PATCH  /api/users/:id`);
  console.log(`  - DELETE /api/users/:id`);
  console.log(`  - GET    /api/protected`);
  console.log(`  - GET    /api/error/:code`);
  console.log(`  - POST   /api/upload`);
  console.log(`  - GET    /api/download/:filename`);
});
