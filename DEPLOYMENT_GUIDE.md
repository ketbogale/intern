# 🚀 Meal Attendance System - Deployment & Access Guide

## 📋 System Overview

### **Architecture**
- **Frontend**: React.js application (Port 3000)
- **Backend**: Node.js/Express API server (Port 3001)
- **Database**: MongoDB (Port 27017)
- **Authentication**: Session-based with 2FA for admin
- **Security**: Rate limiting, input validation, secure sessions

### **Key Components**
- **Attendance Scanner**: Barcode/manual student ID input
- **Admin Dashboard**: Student management, meal windows, reports
- **Real-time Meal Windows**: Dynamic meal time management
- **Email Notifications**: 2FA verification system

---

## 🌐 Deployment Options

### **1. Local Development**
```bash
# Backend
cd backend
npm install
npm start  # Port 3001

# Frontend  
cd ../
npm install
npm start  # Port 3000
```

### **2. Production Deployment**

#### **Environment Setup**
```bash
# Backend .env file
NODE_ENV=production
SESSION_SECRET=your-super-secure-64-char-random-string
MONGO_URI=mongodb://localhost:27017/meal_attendance
PORT=3001
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
TIMEZONE=Africa/Addis_Ababa
```

#### **Build for Production**
```bash
# Frontend build
npm run build

# Backend with PM2
npm install -g pm2
pm2 start src/server.js --name "meal-attendance-api"
```

#### **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Frontend
    location / {
        root /path/to/build;
        try_files $uri $uri/ /index.html;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 🔐 Access Control & Security

### **User Roles**
1. **Scanner Staff**: Can only scan student attendance
2. **Admin**: Full system access, student management, reports

### **Authentication Flow**
```
1. Staff Login → Session-based authentication
2. Admin Login → Username/Password + Email 2FA
3. Session expires after 24 hours
4. Rate limiting: 100 req/15min (general), 20 req/15min (sensitive)
```

### **API Endpoints Security**

#### **🔒 Protected Endpoints (Require Authentication)**
```
POST   /api/students/add           - Add student
GET    /api/students/list          - List all students  
PUT    /api/students/:id           - Update student
DELETE /api/students/:studentId    - Delete student
GET    /api/dashboard/stats        - Dashboard statistics
POST   /api/admin/*               - All admin operations
```

#### **🔓 Public Endpoints**
```
POST   /api/login                 - Staff login
POST   /api/attendance            - ⚠️ VULNERABILITY: Unprotected!
GET    /api/meal-windows          - Get meal windows
```

---

## ⚠️ Critical Security Issues

### **🚨 IMMEDIATE FIXES NEEDED**

#### **1. Unprotected Attendance Endpoint**
```javascript
// CURRENT (VULNERABLE)
router.post("/attendance", checkAttendance);

// SHOULD BE
router.post("/attendance", requireAuth, checkAttendance);
```

#### **2. Missing Input Validation**
- Student ID length limits
- Name sanitization
- Email format validation

#### **3. Production Hardening**
```bash
# Enable HTTPS
NODE_ENV=production

# Secure headers
npm install helmet
app.use(helmet());

# Rate limiting (currently disabled)
# Re-enable after fixing trust proxy issues
```

---

## 🌍 Production Deployment Checklist

### **Pre-Deployment**
- [ ] Fix unprotected attendance endpoint
- [ ] Enable rate limiting with proper proxy config
- [ ] Set strong SESSION_SECRET (64+ characters)
- [ ] Configure GMAIL_APP_PASSWORD for 2FA
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL certificates

### **Server Requirements**
- **OS**: Ubuntu 20.04+ / Windows Server 2019+
- **Node.js**: v16+ 
- **MongoDB**: v4.4+
- **Memory**: 2GB+ RAM
- **Storage**: 10GB+ SSD

### **Domain & SSL**
```bash
# Let's Encrypt SSL
sudo certbot --nginx -d yourdomain.com
```

### **Monitoring**
```bash
# PM2 monitoring
pm2 monit

# Logs
pm2 logs meal-attendance-api
```

---

## 📊 System Metadata

### **Database Schema**
```javascript
// Students Collection
{
  id: String,           // Student ID (unique)
  name: String,         // Full name
  department: String,   // Academic department
  photoUrl: String,     // Profile photo URL
  mealUsed: Boolean,    // Today's meal status
  createdAt: Date       // Registration date
}

// Staff Collection  
{
  username: String,     // Login username
  password: String,     // Hashed password
  role: String,         // 'admin' | 'scanner'
  email: String         // Email (required for admin)
}

// Meal Windows Collection
{
  breakfast: { start: Number, end: Number },
  lunch: { start: Number, end: Number },
  dinner: { start: Number, end: Number }
}
```

### **Session Management**
- **Storage**: In-memory (development) / Redis (production recommended)
- **Duration**: 24 hours
- **Security**: httpOnly, sameSite: 'lax'

### **File Structure**
```
meal-attendance-system/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── models/         # Database schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Email, scheduler
│   │   └── utils/          # Error handling
│   └── .env               # Environment variables
├── src/
│   ├── components/        # React components
│   └── App.js            # Main application
└── public/               # Static assets
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **MongoDB Connection Failed**
```bash
# Start MongoDB service
sudo systemctl start mongod
# or
mongod --dbpath "C:\data\db"
```

#### **Rate Limiting Errors**
```javascript
// Add to server.js
app.set('trust proxy', 1);
```

#### **Session Issues**
```bash
# Clear browser cookies
# Check SESSION_SECRET is set
# Verify MongoDB is running
```

### **Performance Optimization**
- Enable MongoDB indexing on student.id
- Implement Redis for session storage
- Use CDN for static assets
- Enable gzip compression

---

## 📞 Support & Maintenance

### **Regular Tasks**
- [ ] Weekly database backups
- [ ] Monthly security updates
- [ ] Quarterly password rotation
- [ ] Monitor error logs daily

### **Backup Strategy**
```bash
# MongoDB backup
mongodump --db meal_attendance --out /backup/$(date +%Y%m%d)

# Automated backup script
0 2 * * * /usr/local/bin/backup-meal-db.sh
```

This system is production-ready after fixing the critical security vulnerabilities outlined above.
