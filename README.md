# 🍽️ Salale University Meal Attendance System

<div align="center">

![Salale University Logo](public/images/salale_university_logo.png)

**A comprehensive digital solution for streamlined meal attendance management**

[![React](https://img.shields.io/badge/React-19.1.1-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb)](https://mongodb.com/)
[![Security](https://img.shields.io/badge/Security-2FA%20%7C%20HTTPS-red?logo=shield)](https://github.com)

</div>

---

## 🎯 Project Overview

The **Salale University Meal Attendance System** is an enterprise-grade web application designed to modernize and automate meal attendance tracking for educational institutions. Built with cutting-edge technologies, it provides real-time monitoring, automated scheduling, and comprehensive administrative controls.

### 🏛️ Institution Integration
- **University**: Salale University
- **Purpose**: Digital transformation of meal attendance management
- **Scope**: Campus-wide meal tracking and student management
- **Timezone**: East Africa Time (UTC+3) optimized

---

## 🚀 Key Features

### 🔐 **Enterprise Security**
- **Two-Factor Authentication (2FA)** - Multi-layer admin security
- **HTTPS Enforcement** - Production-grade SSL/TLS encryption
- **Session Management** - Secure user authentication with automatic timeouts
- **Input Validation** - Comprehensive data sanitization and protection

### 📊 **Real-Time Management**
- **Live Attendance Tracking** - Instant meal attendance monitoring
- **Dynamic Meal Windows** - Configurable time-based access control
- **Student Database** - Complete student information management
- **Attendance Analytics** - Comprehensive reporting and statistics

### ⚙️ **Administrative Controls**
- **General Settings** - System-wide configuration management
- **Meal Window Configuration** - Flexible scheduling for breakfast, lunch, dinner
- **Database Management** - Dual MongoDB/MySQL support with seamless switching
- **Email Notifications** - Automated alerts and verification systems

### 🎨 **Modern User Experience**
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Bootstrap Integration** - Professional UI with consistent styling
- **Audio Feedback** - Success/error sound notifications
- **Real-Time Validation** - Instant feedback for user interactions

---

## 🛠️ Technology Stack

### **Frontend Architecture**
```
React 19.1.1          → Modern component-based UI framework
Bootstrap 5.3.0       → Professional responsive design system
React Router          → Single-page application routing
Axios                 → HTTP client for API communication
```

### **Backend Infrastructure**
```
Node.js + Express.js  → High-performance web server
MongoDB (Mongoose)    → Primary NoSQL database with ODM
MySQL2                → Secondary relational database support
bcrypt                → Industry-standard password hashing
node-cron             → Automated task scheduling
```

### **Security & DevOps**
```
Helmet.js             → Security headers and protection
Express-session       → Secure session management
Rate Limiting         → DDoS and brute-force protection
Environment Variables → Secure configuration management
```

---

## 🚀 Quick Start Guide

### 📋 Prerequisites
```bash
Node.js v14+          # JavaScript runtime
MongoDB 4.4+          # Primary database
MySQL 8.0+            # Secondary database (optional)
npm/yarn              # Package manager
```

### ⚡ Installation & Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/salale-meal-attendance.git
   cd salale-meal-attendance
   ```

2. **Install Dependencies**
   ```bash
   # Frontend dependencies (root level)
   npm install
   
   # Backend dependencies
   cd backend && npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp backend/.env.example backend/.env
   
   # Configure your settings (see Configuration section)
   nano backend/.env
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   sudo systemctl start mongod
   
   # Optional: Start MySQL service
   sudo systemctl start mysql
   ```

### 🏃‍♂️ Running the Application

**Development Mode**
```bash
# Terminal 1: Start Backend (Port 3001)
cd backend && npm run dev

# Terminal 2: Start Frontend (Port 3000)
npm start
```

**Production Mode**
```bash
# Build frontend
npm run build

# Start production server
cd backend && npm start
```

**Access Points**
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **Backend API**: http://localhost:3001
- 📊 **Admin Dashboard**: http://localhost:3000/dashboard

---

## 📁 Project Architecture

```
salale-meal-attendance/
├── 📂 src/                          # React Frontend
│   ├── 📂 components/               # Reusable UI components
│   │   ├── AddStudent.js           # Student registration
│   │   ├── AttendancePage.js       # Meal attendance tracking
│   │   ├── Dashboard.js            # Admin control panel
│   │   ├── LoginPage.js            # Authentication
│   │   └── VerificationCodeInput.js # 2FA component
│   ├── App.js                      # Main application
│   └── index.js                    # Application entry point
├── 📂 public/                       # Static Assets
│   ├── 📂 images/                  # University logos & assets
│   ├── 📂 sounds/                  # Audio feedback files
│   └── index.html                  # HTML template
├── 📂 backend/                      # Express Backend
│   ├── 📂 src/
│   │   ├── 📂 controllers/         # Business logic
│   │   ├── 📂 models/              # Database schemas
│   │   ├── 📂 routes/              # API endpoints
│   │   └── server.js               # Express server
│   ├── .env                        # Environment variables
│   └── package.json                # Backend dependencies
├── 📄 API_DOCUMENTATION.md          # Complete API reference
├── 📄 DEPLOYMENT_GUIDE.md           # Production deployment
├── 📄 SSL_SETUP_GUIDE.md            # HTTPS configuration
└── 📄 SECURITY_SETUP.md             # Security implementation
```

---

## ⚙️ Configuration

### Environment Variables (`backend/.env`)
```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/meal_attendance
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=meal_attendance

# Server Configuration
PORT=3001
NODE_ENV=development
SESSION_SECRET=your-super-secure-session-secret

# Email Configuration (for 2FA)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Security Settings
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=3600000
```

### Admin Credentials
```bash
Username: username
Password: jidfFDhgg45HVf@%$jkvh657465j,Ahyhj
2FA Email: ket1boggood@gmail.com
```

---

## 🔧 Development

### Available Scripts

| Command | Description | Environment |
|---------|-------------|-------------|
| `npm start` | Development server with hot reload | Frontend |
| `npm run build` | Production build optimization | Frontend |
| `npm test` | Run test suite | Frontend |
| `cd backend && npm run dev` | Backend with nodemon auto-restart | Backend |
| `cd backend && npm start` | Production backend server | Backend |

### 🧪 Testing
```bash
# Frontend tests
npm test

# Backend API tests (if implemented)
cd backend && npm test
```

---

## 🚀 Deployment

### Production Deployment
See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for comprehensive deployment instructions including:
- Cloud platform setup (AWS, DigitalOcean, Heroku)
- Docker containerization
- CI/CD pipeline configuration
- Environment-specific configurations

### SSL/HTTPS Setup
See **[SSL_SETUP_GUIDE.md](SSL_SETUP_GUIDE.md)** for:
- Let's Encrypt certificate installation
- Nginx reverse proxy configuration
- Automatic HTTPS redirection
- Security headers implementation

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** | Complete REST API reference |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Production deployment guide |
| **[SSL_SETUP_GUIDE.md](SSL_SETUP_GUIDE.md)** | HTTPS security configuration |
| **[SECURITY_SETUP.md](SECURITY_SETUP.md)** | Security implementation details |

---

## 🔒 Security Features

- ✅ **Two-Factor Authentication** - Admin login protection
- ✅ **HTTPS Enforcement** - Production SSL/TLS encryption
- ✅ **Session Security** - Secure cookie configuration
- ✅ **Input Validation** - Comprehensive data sanitization
- ✅ **Rate Limiting** - DDoS and brute-force protection
- ✅ **Security Headers** - Helmet.js implementation

---

## 🤝 Contributing

We welcome contributions to improve the Salale University Meal Attendance System!

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### Code Standards
- Follow ESLint configuration
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the **ISC License** - see the LICENSE file for details.

---

## 🆘 Support & Contact

- 📧 **Technical Support**: [support@salaleuniversity.edu.et](mailto:support@salaleuniversity.edu.et)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-org/salale-meal-attendance/issues)
- 💬 **Feature Requests**: [GitHub Discussions](https://github.com/your-org/salale-meal-attendance/discussions)
- 📖 **Documentation**: [Project Wiki](https://github.com/your-org/salale-meal-attendance/wiki)

---

<div align="center">

**🏛️ Built for Salale University | 🍽️ Streamlining Meal Management | 🚀 Powered by Modern Web Technologies**

*Made with ❤️ by the Development Team*

</div>
