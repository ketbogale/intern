const Staff = require("../models/staff");
const Settings = require("../models/Settings");
const { trackFailedLogin } = require("./securityController");

// In-memory store for login attempts (in production, use Redis or database)
const loginAttempts = new Map();

exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Basic input validation
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input." });
  }

  try {
    // Get settings for login attempt limits
    const settings = await Settings.findOne();
    const loginAttemptLimit = settings?.loginAttemptLimit || 5;
    const lockoutDurationMinutes = settings?.lockoutDurationMinutes || 5;

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
      
      // Set session for authenticated user
      req.session.user = {
        id: staff._id,
        username: staff.username,
        role: staff.role,
        loginTime: new Date(),
      };
      
      console.log(`Successful login for user: ${username} from IP: ${clientIP}`);
      
      // Return user data including role for frontend routing
      res.json({ 
        success: true,
        user: {
          id: staff._id,
          username: staff.username,
          role: staff.role
        }
      });
    } else {
      // Failed login - track attempt
      const currentAttempts = attemptData ? attemptData.count : 0;
      const newAttemptCount = currentAttempts + 1;

      console.log(`Failed login attempt ${newAttemptCount}/${loginAttemptLimit} for user: ${username} from IP: ${clientIP}`);

      if (newAttemptCount >= loginAttemptLimit) {
        // Lock the account
        const lockoutUntil = new Date(now.getTime() + lockoutDurationMinutes * 60 * 1000);
        loginAttempts.set(attemptKey, {
          count: newAttemptCount,
          lockedUntil: lockoutUntil,
          lastAttempt: now
        });

        console.log(`Account locked for user: ${username} from IP: ${clientIP} until ${lockoutUntil}`);

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
