require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect DB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine (Handlebars)
const exphbs = require('express-handlebars');
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Partials (if using hbs partial files)
const hbs = require('hbs');
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Routes
app.use('/api/chatbot', require('./src/routes/chatbotRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/feedback', require('./src/routes/feedbackRoutes'));

// Simple UI route
app.get('/', (req, res) => res.render('index'));

// Error handler (after routes)
const { errorHandler } = require('./src/middlewares/errorHandler');
app.use(errorHandler);

// Start
app.listen(PORT, () => {
  console.log(`🚀 MindHaven running at http://localhost:${PORT}`);
});
