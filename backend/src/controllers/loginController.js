const Staff = require("../models/staff");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Basic input validation
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input." });
  }

  try {
    const staff = await Staff.findOne({ username });
    if (staff && (await staff.comparePassword(password))) {
      // Set session for authenticated user
      req.session.user = {
        id: staff._id,
        username: staff.username,
        role: staff.role,
        loginTime: new Date(),
      };
      
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
      res.status(401).json({ error: "Invalid username or password." });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: "System error." });
  }
};
