const Staff = require("../models/staff");

// In-memory store for login attempts (in production, use Redis or database)
const loginAttempts = new Map();

exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Basic input validation
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input." });
  }

  try {
    // Use default login attempt limits
    const loginAttemptLimit = 5;
    const lockoutDurationMinutes = 5;

    const clientIP = req.ip || req.connection.remoteAddress;
    const attemptKey = `${clientIP}:${username}`;
    const now = new Date();

    // Check if user is currently locked out
    const attemptData = loginAttempts.get(attemptKey);
    if (attemptData && attemptData.lockedUntil && now < attemptData.lockedUntil) {
      const remainingTime = Math.ceil((attemptData.lockedUntil - now) / 1000 / 60);
      return res.status(429).json({ 
        error: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
        lockedUntil: attemptData.lockedUntil
      });
    }

    const staff = await Staff.findOne({ username });
    if (staff && (await staff.comparePassword(password))) {
      // Successful login - clear any existing attempt data
      loginAttempts.delete(attemptKey);
      
      // Clear any existing session data and set new session
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: "Session error" });
        }
        
        // Set session for authenticated user
        req.session.user = {
          id: staff._id,
          username: staff.username,
          role: staff.role,
          loginTime: new Date(),
        };
        
        // Save session to ensure it's persisted
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: "Session save error" });
          }
          
          
          // Return user data including role for frontend routing
          res.json({ 
            success: true,
            user: {
              id: staff._id,
              username: staff.username,
              role: staff.role
            }
          });
        });
      });
    } else {
      // Failed login - track attempt
      const currentAttempts = attemptData ? attemptData.count : 0;
      const newAttemptCount = currentAttempts + 1;


      if (newAttemptCount >= loginAttemptLimit) {
        // Lock the account
        const lockoutUntil = new Date(now.getTime() + lockoutDurationMinutes * 60 * 1000);
        loginAttempts.set(attemptKey, {
          count: newAttemptCount,
          lockedUntil: lockoutUntil,
          lastAttempt: now
        });


        return res.status(429).json({ 
          error: `Too many failed login attempts. Account locked for ${lockoutDurationMinutes} minutes.`,
          lockedUntil: lockoutUntil
        });
      } else {
        // Update attempt count
        loginAttempts.set(attemptKey, {
          count: newAttemptCount,
          lockedUntil: null,
          lastAttempt: now
        });

        const remainingAttempts = loginAttemptLimit - newAttemptCount;
        res.status(401).json({ 
          error: `Invalid username or password. ${remainingAttempts} attempts remaining.`,
          attemptsRemaining: remainingAttempts
        });
      }
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: "System error." });
  }
};
