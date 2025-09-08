# 🔌 API Documentation - Meal Attendance System

## 📡 Base URL
- **Development**: `http://localhost:3001/api`
- **Production**: `https://yourdomain.com/api`

---

## 🔐 Authentication

### **Session-Based Authentication**
All protected endpoints require a valid session cookie obtained through login.

```javascript
// Login Response
{
  "success": true,
  "user": {
    "id": "user_id",
    "username": "staff_user",
    "role": "admin" | "scanner"
  }
}
```

---

## 📋 API Endpoints

### **🔓 Public Endpoints**

#### **Staff Login**
```http
POST /api/login
Content-Type: application/json

{
  "username": "staff_username",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "scanner1",
    "role": "scanner"
  }
}
```

#### **Check Attendance** ⚠️ VULNERABLE - NO AUTH
```http
POST /api/attendance
Content-Type: application/json

{
  "studentId": "STU001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance recorded successfully",
  "student": {
    "id": "STU001",
    "name": "John Doe",
    "department": "Computer Science"
  },
  "mealType": "lunch"
}
```

#### **Get Meal Windows**
```http
GET /api/meal-windows
```

**Response:**
```json
{
  "success": true,
  "mealWindows": {
    "breakfast": { "start": 420, "end": 600 },
    "lunch": { "start": 720, "end": 900 },
    "dinner": { "start": 1080, "end": 1260 }
  }
}
```

---

### **🔒 Protected Endpoints (Require Authentication)**

#### **Student Management**

##### **Add Single Student**
```http
POST /api/students/add
Authorization: Session Cookie Required
Content-Type: application/json

{
  "id": "STU002",
  "name": "Jane Smith",
  "department": "Engineering",
  "photoUrl": "https://example.com/photo.jpg"
}
```

##### **Add Multiple Students**
```http
POST /api/students/add-multiple
Authorization: Session Cookie Required
Content-Type: application/json

{
  "students": [
    {
      "id": "STU003",
      "name": "Bob Johnson",
      "department": "Business"
    },
    {
      "id": "STU004", 
      "name": "Alice Brown",
      "department": "Arts"
    }
  ]
}
```

##### **Get All Students**
```http
GET /api/students/list
Authorization: Session Cookie Required
```

**Response:**
```json
{
  "message": "Students retrieved successfully",
  "count": 150,
  "students": [
    {
      "id": "STU001",
      "name": "John Doe",
      "department": "Computer Science",
      "photoUrl": "",
      "mealUsed": false
    }
  ]
}
```

##### **Search Students**
```http
GET /api/students/search?q=john
Authorization: Session Cookie Required
```

##### **Get Student by ID**
```http
GET /api/students/STU001
Authorization: Session Cookie Required
```

##### **Update Student**
```http
PUT /api/students/64f8a1b2c3d4e5f6a7b8c9d0
Authorization: Session Cookie Required
Content-Type: application/json

{
  "name": "John Updated",
  "studentId": "STU001",
  "department": "Computer Science",
  "photoUrl": "new-photo-url"
}
```

##### **Delete Student**
```http
DELETE /api/students/STU001
Authorization: Session Cookie Required
```

---

#### **Admin Operations** 🔒 Admin Role Required

##### **Admin 2FA Login Flow**
```http
# Step 1: Check credentials
POST /api/admin/check-credentials
{
  "username": "admin",
  "password": "password"
}

# Step 2: Send OTP
POST /api/admin/send-otp
{
  "email": "admin@example.com"
}

# Step 3: Verify OTP
POST /api/admin/verify-otp
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

##### **Get Admin Profile**
```http
GET /api/admin/profile
Authorization: Session Cookie Required
```

##### **Update Admin Credentials**
```http
PATCH /api/admin/credentials
Authorization: Session Cookie Required + Admin Role
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password",
  "email": "new_email@example.com"
}
```

---

#### **Dashboard & Reports**

##### **Get Dashboard Statistics**
```http
GET /api/dashboard/stats
Authorization: Session Cookie Required
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalStudents": 150,
    "todayAttendance": 89,
    "attendanceRate": 59.33,
    "mealWindows": {
      "breakfast": { "start": "07:00", "end": "10:00" },
      "lunch": { "start": "12:00", "end": "15:00" },
      "dinner": { "start": "18:00", "end": "21:00" }
    }
  }
}
```

##### **Reset Meal Database**
```http
POST /api/dashboard/reset-meals
Authorization: Session Cookie Required + Admin Role
```

---

## 🚨 Rate Limiting (Currently Disabled)

When enabled:
- **Global**: 100 requests per 15 minutes per IP
- **Sensitive Operations**: 20 requests per 15 minutes per IP

**Rate Limit Headers:**
```http
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1640995200
```

---

## ❌ Error Responses

### **Standard Error Format**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error (development only)"
}
```

### **Common HTTP Status Codes**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### **Authentication Errors**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### **Validation Errors**
```json
{
  "success": false,
  "error": "Student ID and name are required"
}
```

### **Rate Limiting Errors**
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```

---

## 🔧 Integration Examples

### **JavaScript/Fetch**
```javascript
// Login
const login = async (username, password) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for session cookies
    body: JSON.stringify({ username, password })
  });
  return response.json();
};

// Add Student (requires authentication)
const addStudent = async (studentData) => {
  const response = await fetch('/api/students/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(studentData)
  });
  return response.json();
};
```

### **cURL Examples**
```bash
# Login
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt

# Add Student (using saved cookies)
curl -X POST http://localhost:3001/api/students/add \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"id":"STU005","name":"Test Student","department":"IT"}'
```

---

## 🔒 Security Considerations

### **CSRF Protection**
- Session-based authentication with sameSite cookies
- No additional CSRF tokens currently implemented

### **Input Validation**
- Student ID: Required, string
- Name: Required, string, sanitized
- Email: Format validation for admin operations
- Regex patterns: Escaped to prevent NoSQL injection

### **Data Exposure**
- Passwords: Always hashed with bcrypt
- Error messages: Generic in production
- Session data: httpOnly cookies only

---

## 📱 Frontend Integration

The React frontend uses relative URLs with proxy configuration:

```json
// package.json
{
  "proxy": "http://localhost:3001"
}
```

All API calls use relative paths:
```javascript
fetch('/api/students/list')  // Proxied to http://localhost:3001/api/students/list
```
