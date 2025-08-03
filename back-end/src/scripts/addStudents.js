const mongoose = require('mongoose');
const Student = require('../models/student');

mongoose.connect('mongodb://localhost:27017/meal_attendance');

const students = [
    {
        id: "10001",
        name: "Amanuel Kebede",
        department: "Information Technology",
        photoUrl: "/public/images/amanuel.jpg"
    },
    {
        id: "10002",
        name: "Sara Tesfaye",
        department: "Biology",
        photoUrl: "/public/images/sara.jpg"
    },
    {
        id: "10003",
        name: "Sifan Deresa",
        department: "chemistry",
        photoUrl: "/public/images/sifan.jpg"
    },
    {
        id: "RU1227/15",
        name: "Ketema Bogale",
        department: "Computer Science",
        photoUrl: "/public/images/ketema.jpg"
    },
    {
        id: "10007",
        name: "Birhanu Dadhi",
        department: "Information Science",
        photoUrl: "/public/images/birhanu.jpg"
    },
    {
        id: "RU0017/15",
        name: "Beka Gudeta",
        department: "Software Engineering",
        photoUrl: "/public/images/beka.jpg"
    }
    // Add more students here
];

async function addStudents() {
    for (const student of students) {
        await Student.create(student);
        console.log('Student added:', student.name);
    }
    mongoose.disconnect();
}

addStudents();