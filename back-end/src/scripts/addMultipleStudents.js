const mongoose = require("mongoose");
const Student = require("../models/student");

// MongoDB connection
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/meal_attendance";

// Students data to add
const studentsData = [
  {
    id: "10002",
    name: "Sara Tesfaye",
    department: "Biology",
    photoUrl: "/public/images/sara.jpg",
  },
  {
    id: "10003",
    name: "Amanuel Kebede",
    department: "Information Technology",
    photoUrl: "/public/images/amanuel.jpg",
  },
  {
    id: "10004",
    name: "Hanan Mohammed",
    department: "Computer Science",
    photoUrl: "/public/images/hanan.jpg",
  },
];

async function addMultipleStudents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
    console.log("📊 Adding students to database...\n");

    let addedCount = 0;
    let skippedCount = 0;

    for (const studentData of studentsData) {
      try {
        // Check if student already exists
        const existingStudent = await Student.findOne({ id: studentData.id });

        if (existingStudent) {
          console.log(
            `⚠️  Student ${studentData.id} (${studentData.name}) already exists - SKIPPED`,
          );
          skippedCount++;
          continue;
        }

        // Create new student
        const newStudent = new Student(studentData);
        const savedStudent = await newStudent.save();

        console.log(
          `✅ Added: ${savedStudent.id} - ${savedStudent.name} (${savedStudent.department})`,
        );
        addedCount++;
      } catch (error) {
        console.error(
          `❌ Error adding student ${studentData.id}:`,
          error.message,
        );
      }
    }

    console.log("\n📈 Summary:");
    console.log(`✅ Students added: ${addedCount}`);
    console.log(`⚠️  Students skipped: ${skippedCount}`);
    console.log(`📊 Total processed: ${addedCount + skippedCount}`);

    // Display all students in database
    console.log("\n👥 All students in database:");
    const allStudents = await Student.find({}).select(
      "id name department photoUrl",
    );
    allStudents.forEach((student) => {
      console.log(`   ${student.id} - ${student.name} (${student.department})`);
    });
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the script
addMultipleStudents();
