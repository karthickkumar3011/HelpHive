# HelpHive Environment Setup 🔧

## 📋 Overview
HelpHive requires environment variables for both **client** (React) and **server** (Node).

**Never commit .env files** - protected by `.gitignore`.

## 1. Server Environment (server/.env)
Create `server/.env`:

```env
# MongoDB (REQUIRED)
MONGO_URI=mongodb+srv://username:password@cluster0.xxx.mongodb.net/helpHive?retryWrites=true&w=majority

# JWT (REQUIRED)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Server (Optional)
PORT=5000

# CORS Origins (Development)
CLIENT_URL=http://localhost:3000
```

## 2. Client Environment (client/.env)
Create `client/.env`:

```env
# API & Socket (REQUIRED)
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# App Config (Optional)
REACT_APP_APP_NAME=HelpHive
REACT_APP_ENVIRONMENT=development
```

## 🛠️ Production Setup
### Server Production (.env)
```env
MONGO_URI=your_production_mongo_uri
JWT_SECRET=your_production_jwt_secret
PORT=5000
CLIENT_URL=https://yourdomain.com
```

### Client Production (.env or Platform vars)
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_SOCKET_URL=https://api.yourdomain.com
```

## 🔑 Generating Secure Values
```bash
# JWT_SECRET (64 chars recommended)
node -e "console.log('JWT_SECRET='+require('crypto').randomBytes(64).toString('hex'))"

# Or use online generators (openssl rand -hex 32)
```

## 🧪 MongoDB Atlas Setup
1. [MongoDB Atlas](https://cloud.mongodb.com) → New Cluster (free M0)
2. **Database Access** → Add New Database User (readWriteAnyDatabase)
3. **Network Access** → Add IP (0.0.0.0/0 for dev, whitelist prod)
4. Get connection string → Replace `<username>` & `<password>`

## 🚀 Verification
```bash
# Server loads .env automatically (dotenv)
cd server && npm run dev
# Should log: Server running on http://localhost:5000

# Client reads REACT_APP_* vars
cd client && npm start
```

## ⚠️ Security Notes
- ✅ `.gitignore` blocks `.env*`
- ✅ Use unique secrets per environment
- ✅ Rotate JWT_SECRET if compromised
- ❌ Never log or console.log(process.env)

## 💻 Platform Deployment Examples
| Platform | Server Vars | Client Vars |
|----------|-------------|-------------|
| Railway | Dashboard | Build-time |
| Vercel | Serverless | Project Settings |
| Render | Environment | Environment |

**Happy coding!** Questions? Open issue.
