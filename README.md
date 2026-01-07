# Chirp 🐦

Chirp is a social media–style web application inspired by platforms like Twitter.  
It allows users to share short posts, interact with others, and manage personal profiles.

---

## ✨ Features

- User authentication with JWT
- Create, edit, and delete posts
- Comment on posts
- Like and bookmark posts
- Follow and unfollow users
- User profiles with bio and profile picture
- Image uploads via Cloudinary
- Responsive frontend
- Unit tests for frontend components

---

## 🛠 Tech Stack

### Frontend

- Angular
- TypeScript
- SCSS
- Vitest (testing)

### Backend

- Node.js
- Express
- MongoDB (Mongoose)
- Cloudinary (image uploads)

---

## 📁 Project Structure

```
chirp/
├── client/ # Angular frontend
└── server/ # Node.js / Express backend
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account

---

## 🔧 Environment Variables

The backend requires a `.env` file inside the `server` folder.
This file is **ignored by Git** and must be created manually.

### `server/.env`

```
PORT=3000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## ▶️ Running the Application

### Backend

```
cd server
npm install
npm run dev
```

Backend runs on:
👉 http://localhost:3000

---

### Frontend

```
cd client
npm install
npm start
```

Frontend runs on:
👉 http://localhost:4200

---

## 🧪 Running Tests

Frontend tests are executed from the `client` folder:

```
npm run test
```

---

## 🔐 Security Considerations

A dedicated threat model was created to systematically assess security risks within the application.

The analysis follows the STRIDE framework and documents identified threats, implemented mitigations, known limitations, and potential future improvements.

📄 Detailed analysis:  
[THREAT_MODEL.md](./THREAT_MODEL.md)

---

## 🎓 Project Context

This application was built as a **university project** to learn about:

- Modern web technologies
- NoSQL databases (MongoDB)
- Clean code and modular Angular components
- Testing and maintainability
- Identifying and mitigating common web application security threats
