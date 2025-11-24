require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const exphbs = require('express-handlebars');
const hbs = require('hbs');
const { requireAuth } = require('./src/middlewares/authMiddleware');
const chatRoutes = require('./src/routes/chatRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;


// 1️⃣ Connect to MongoDB
connectDB();

// 2️⃣ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 3️⃣ View engine (Handlebars)
app.engine('hbs', exphbs.engine({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register partials (reusable UI components)
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// 3a️⃣ Register Handlebars helper for emotion emojis
hbs.registerHelper('getEmoji', (emotion) => {
  const map = {
    joy: '😄',
    sadness: '😢',
    anger: '😡',
    fear: '😨',
    neutral: '😐'
  };
  return map[emotion] || '🤖';
});


const cookieParser = require('cookie-parser');
app.use(cookieParser());

// 4️⃣ Routes
// API routes
app.use('/api/chatbot', require('./src/routes/chatbotRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/feedback', require('./src/routes/feedbackRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/chats', requireAuth, chatRoutes);

// UI ROUTES (public pages)
app.get('/', (req, res) => {
  res.render('landing');  // landing.hbs
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/feedback', (req, res) => {
  res.render('feedback');
});

// 5️⃣ Error handling middleware
const { errorHandler } = require('./src/middlewares/errorHandler');
app.use(errorHandler);

// Chat page route (pre-render messages)
const { getChatHistory } = require('./src/controllers/chatbotController');
app.get('/chat', requireAuth, getChatHistory);



// 6️⃣ Start server
app.listen(PORT, () => {
  console.log(`🚀 MindHaven running at http://localhost:${PORT}`);
});

