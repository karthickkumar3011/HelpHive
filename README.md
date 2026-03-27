# HelpHive 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)
[![Node](https://img.shields.io/badge/Node-20-green.svg)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://mongodb.com)

## 🌐 Overview
HelpHive is a full-stack social platform for posting help requests, joining communities (Hives), real-time chat, notifications, and collaborative problem-solving.

**Live Demo**: [Coming Soon](https://helphive.app)

## ✨ Features
- 🔐 JWT Authentication (Register/Login)
- 📝 Post Help Requests with tags & file uploads
- 🐝 Hives - Topic-based communities (Explore, Details, Join)
- 💬 Real-time Chat (Socket.io)
- 🔔 Instant Notifications
- 👥 User Profiles & Private Messaging
- 📱 Responsive Tailwind CSS + React Router
- 🗃️ MongoDB with Mongoose (Posts, Users, Hives, Messages)
- 🚀 Upload handling (Multer)

## 🏗️ Tech Stack
| Client | Server |
|--------|--------|
| React 18 | Node.js / Express |
| Tailwind CSS | MongoDB Atlas |
| React Router | Socket.io |
| Lucide Icons | Multer |
| Recharts | JWT / bcrypt |
| Axios | Nodemon (dev) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### 1. Clone & Install
```bash
git clone https://github.com/karthickkumar3011/HelpHive.git
cd HelpHive
```

### 2. Environment Setup
See [ENV_SETUP.md](./ENV_SETUP.md)

### 3. Run Development
```bash
# Terminal 1 - Server
cd server
npm install
npm run dev

# Terminal 2 - Client  
cd client
npm install
npm start
```

**App running:**
- Client: http://localhost:3000
- Server: http://localhost:5000

## 📁 Project Structure
```
HelpHive/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # Navbar, PostCard, Chat, etc.
│   │   ├── pages/       # Home, Hives, Profile, Notifications
│   │   └── context/     # AuthContext
│   ├── public/
│   └── tailwind.config.js
├── server/           # Node/Express backend
│   ├── controllers/  # Auth, Posts, Users, Notifications
│   ├── models/       # User, Post, Hive, Message (Mongoose)
│   ├── routes/
│   ├── middleware/   # Auth, Uploads
│   └── server.js     # Socket.io + Routes
├── .gitignore        # Protects .env, uploads/, node_modules/
└── README.md
```

## 🔧 Environment Variables
Required for both client/server - see [ENV_SETUP.md](./ENV_SETUP.md)

## 🌍 Deployment
### Client (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy dist/
```

### Server (Railway/Render/Heroku)
```bash
cd server
npm start
MONGO_URI, JWT_SECRET required
```

### MongoDB Atlas
1. Create cluster
2. Database Access → New user
3. Network → Allow all IPs (0.0.0.0/0) for dev

## 🤝 Contributing
1. Fork repo
2. Create feature branch
3. PR to `main`

## 📄 License
MIT - See [LICENSE](LICENSE) (create if needed)

## 👥 Contact
**Karthick Kumar** - [@karthickkumar3011](https://github.com/karthickkumar3011)

---

⭐ Star if useful! Contributions welcome.
