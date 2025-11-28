require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const exphbs = require('express-handlebars');
const hbs = require('hbs');
const cookieParser = require('cookie-parser');
const { requireAuth } = require('./src/middlewares/authMiddleware');
const chatRoutes = require('./src/routes/chatRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

console.log(`OpenAI API Key loaded: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);

// 1️⃣ Connect to MongoDB
connectDB();

// 2️⃣ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// 3️⃣ View engine (Handlebars)
const hbsEngine = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  },
  helpers: {
    getEmoji: (emotion) => {
      const map = { joy: '😄', sadness: '😢', anger: '😡', fear: '😨', neutral: '😐' };
      return map[emotion] || '🤖';
    },
    formatDate: (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    loop: (n, block) => {
      let accum = '';
      for (let i = 0; i < n; ++i) accum += block.fn(i);
      return accum;
    }
  }
});

app.engine('hbs', hbsEngine.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register partials and helpers for backward compatibility
hbs.registerPartials(path.join(__dirname, 'views/partials'));
hbs.registerHelper('getEmoji', (emotion) => {
  const map = { joy: '😄', sadness: '😢', anger: '😡', fear: '😨', neutral: '😐' };
  return map[emotion] || '🤖';
});
hbs.registerHelper('formatDate', (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});
hbs.registerHelper('loop', (n, block) => {
  let accum = '';
  for (let i = 0; i < n; ++i) accum += block.fn(i);
  return accum;
});

// 4️⃣ Routes
// API routes
app.use('/api/chatbot', require('./src/routes/chatbotRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/feedback', require('./src/routes/feedbackRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/chats', requireAuth, chatRoutes);

// Admin dashboard
app.use('/admin', require('./src/routes/adminRoutes'));

// UI ROUTES (public pages)
app.get('/', (req, res) => res.render('landing'));
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));
app.get('/feedback', (req, res) => res.render('feedback'));
app.use('/resources', require('./src/routes/resourcesRoutes'));

// Chat page route (pre-render messages)
const { getChatHistory } = require('./src/controllers/chatbotController');
app.get('/chat', requireAuth, getChatHistory);

// 5️⃣ Error handling middleware
const { errorHandler } = require('./src/middlewares/errorHandler');
app.use(errorHandler);

// 6️⃣ Start server
app.listen(PORT, () => {
  console.log(`🚀 MindHaven running at http://localhost:${PORT}`);
});
