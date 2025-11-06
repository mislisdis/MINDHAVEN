require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const exphbs = require('express-handlebars');
const hbs = require('hbs');

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
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register partials (reusable UI components)
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// 4️⃣ Routes
// API routes
app.use('/api/chatbot', require('./src/routes/chatbotRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/feedback', require('./src/routes/feedbackRoutes'));

// UI route
app.get('/', (req, res) => res.render('index', { title: 'MindHaven Chatbot' }));

// 5️⃣ Error handling middleware
const { errorHandler } = require('./src/middlewares/errorHandler');
app.use(errorHandler);

// 6️⃣ Start server
app.listen(PORT, () => {
  console.log(`🚀 MindHaven running at http://localhost:${PORT}`);
});
