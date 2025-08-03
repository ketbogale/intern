const mongoose = require("mongoose");
const Staff = require("../models/staff");
const staffUsers = require("./staffUsers.json");

mongoose.connect("mongodb://localhost:27017/meal_attendance");

async function addStaff(username, password) {
  try {
    const staff = new Staff({ username, password });
    await staff.save();
    console.log("Staff added:", username);
  } catch (err) {
    console.error(`Error adding ${username}:`, err.message);
  }
}

async function main() {
  for (const user of staffUsers) {
    await addStaff(user.username, user.password);
  }
  mongoose.disconnect();
}

main();
