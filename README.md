MindHaven

### *AI-Powered Mental Health Companion & Emotional Analytics Platform*

MindHaven is a full-stack web application that combines an AI chatbot with an intelligent journaling system to support student mental wellness. The platform enables users to express thoughts, receive context-aware responses, and gain data-driven insights into their emotional patterns over time.

This project demonstrates practical skills in **full-stack development, API design, data analysis, and secure system design**.


# Key Impact

* Designed and built a **scalable mental health support system** for students
* Implemented **real-time emotion detection** for both chat and journal data
* Developed **data visualization features** to track emotional trends
* Applied **security best practices** (authentication, encryption, input validation)
* Delivered a system capable of handling **multiple concurrent users**


# Core Features

## AI Chatbot

* Real-time conversational interface
* Emotion-aware responses based on user input
* Contextual resource recommendations (e.g., counseling, hotlines)

## Intelligent Journaling System

* “Save & Analyze” functionality for journal entries
* Extracts:

  * Dominant emotion
  * Multiple emotion scores
  * Topics
  * Keywords

## Emotional Analytics

* **Mood Timeline:** Tracks emotional trends over time
* **Mood Board:** Calendar-based emotional visualization
* **Insights Dashboard:**

  * Journaling streaks
  * Most frequent emotions
  * Topic distribution
  * Writing patterns

## Security & Reliability

* Password hashing using bcrypt
* JWT-based authentication system
* Login attempt restriction (brute-force prevention)
* Input validation to prevent injection attacks



# System Architecture

MindHaven follows a **three-tier architecture**:

* **Frontend:** User interface and data visualization
* **Backend:** RESTful API, business logic, and AI processing
* **Database:** Secure storage of user data, chats, and analytics

This modular design improves **scalability, maintainability, and performance**.


# 🛠️ Tech Stack

* **Frontend:** Handlebars, JavaScript
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas
* **Authentication:** JWT
* **Security:** bcrypt, input validation
* **Version Control:** Git & GitHub



# API Design

The application exposes RESTful endpoints to support modular interaction:

* Authentication (register/login)
* Chat processing
* Journal storage & analysis
* Insights and analytics retrieval

This structure enables **clear separation of concerns** and easy scalability.


# Setup Instructions

```bash
git clone https://github.com/your-username/mindhaven.git
cd mindhaven
npm install
npm start
```

Create a `.env` file:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```


# 🧪 Testing & Performance

* Chatbot response time: **0.8–1.5 seconds**
* Journal analysis processing: **< 2 seconds**
* Emotion detection accuracy: **~75%**


# 📈 What This Project Demonstrates

* Full-stack web development
* API design and integration
* Data processing and analytics
* Secure authentication systems
* Problem-solving in real-world applications
* User-centered design for sensitive domains


# Future Improvements

* Advanced NLP models (BERT / transformer-based models)
* Voice journaling with tone analysis
* Crisis detection and escalation system
* Mobile application (Android/iOS)
* Integration with professional counseling services


# Authors

* **Lisa Adisa Magada**
* Vincent Kiarie Githaiga



# Note

This project was developed as part of an academic program and demonstrates the application of software engineering principles in building real-world solutions.


If you want next, I can:

✅ Add **GitHub badges (very recruiter-friendly)**
✅ Add a **"Live Demo" section**
✅ Add **screenshots placeholders (VERY important)**
✅ Or tailor this specifically for **Deloitte / internships**

Just say the word 😌
