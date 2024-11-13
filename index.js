import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import mysql from "mysql2";
import fs from 'fs';
import studentRoutes from './routes/student.js'
import teacherRoutes from './routes/teacher.js';
import paperRoutes from './routes/paper.js';
import classRoutes from './routes/class.js';
import homeRoutes from './routes/home.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/student", studentRoutes);
app.use("/teacher", teacherRoutes);
app.use("/paper", paperRoutes);
app.use("/class", classRoutes);
app.use("/home", homeRoutes);
app.use("/admin", adminRoutes)

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on ${port}`)
});

app.get('/', (req, res) => {
    res.send("API working fine!!");
})

const sslCert = fs.readFileSync('./ca.pem');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        ca: sslCert                       
    }
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database', err.stack);
        return;
    }
    console.log('Connected to the database');
});

export default db;