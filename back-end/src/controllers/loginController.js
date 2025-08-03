const Staff = require("../models/staff");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Basic input validation
  if (typeof username !== "string" || typeof password !== "string") {
    return res.json({ status: "fail", message: "Invalid input." });
  }

  try {
    const staff = await Staff.findOne({ username });
    if (staff && (await staff.comparePassword(password))) {
      // Set session for authenticated user
      req.session.user = {
        id: staff._id,
        username: staff.username,
        loginTime: new Date(),
      };
      res.json({ status: "success" });
    } else {
      res.json({ status: "fail", message: "Invalid username or password." });
    }
  } catch (err) {
    res.json({ status: "error", message: "System error." });
  }
};
