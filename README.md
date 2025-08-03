# 🍽️ Meal Attendance System

> A modern full-stack web application for tracking meal attendance with automated scheduling and real-time management.

## 📋 Overview

This **Meal Attendance System** is designed to streamline meal tracking and attendance management. Built with React frontend and Express.js backend, it features automated meal scheduling, database management, and an intuitive user interface.

## ✨ Features

🔐 **User Authentication** - Secure login and session management  
📊 **Real-time Attendance Tracking** - Live meal attendance monitoring  
⏰ **Automated Scheduling** - Smart meal scheduling for East Africa Time (EAT)  
🗄️ **Dual Database Support** - MongoDB and MySQL integration  
📱 **Responsive Design** - Works seamlessly on all devices  
🔄 **Auto-reset Functionality** - Daily attendance reset at 2:00 PM EAT  

## 🛠️ Tech Stack

### Frontend
- **React** 19.1.1 - Modern UI framework
- **React Scripts** 5.0.1 - Build tools and development server
- **Testing Library** - Comprehensive testing suite

### Backend  
- **Node.js** - Runtime environment
- **Express.js** 4.18.2 - Web application framework
- **MongoDB** - Primary database (via Mongoose 7.5.0)
- **MySQL** - Secondary database (via MySQL2 3.6.0)
- **bcrypt** 5.1.0 - Password hashing
- **node-cron** 3.0.2 - Task scheduling

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- MySQL
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Intern
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp backend/.env.example backend/.env
   
   # Configure your database connections and settings
   ```

### 🏃‍♂️ Running the Application

**Start Frontend (Port 3000)**
```bash
npm start
```

**Start Backend (Port 3001)**  
```bash
cd backend
npm run dev
```

**Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📁 Project Structure

```
Intern/
├── 📂 src/                    # React frontend source
├── 📂 public/                 # Static assets
├── 📂 backend/
│   ├── 📂 src/               # Express backend source
│   └── 📄 .env.example       # Environment template
├── 📄 package.json           # Frontend dependencies
└── 📄 README.md             # You are here!
```

## 🕐 Automated Features

- **Daily Reset**: Attendance automatically resets at 2:00 PM EAT
- **Timezone Handling**: Configured for East Africa Time (UTC+3)
- **Database Sync**: Automatic synchronization between MongoDB and MySQL
- **Session Management**: Secure user sessions with Express-session

## 🧪 Development

### Available Scripts

**Frontend**
- `npm start` - Development server
- `npm run build` - Production build
- `npm test` - Run tests

**Backend**  
- `npm start` - Production server
- `npm run dev` - Development server with nodemon

### 🔧 Configuration

The application uses environment variables for configuration. See `backend/.env.example` for required settings:
- Database connections
- Session secrets
- Port configurations
- Timezone settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙋‍♂️ Support

For support and questions, please open an issue in the repository.

---

**Made with ❤️ for efficient meal attendance management**
