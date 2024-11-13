import express from "express";
import bcrypt from "bcryptjs";
import db from "../index.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {verifyStudent} from '../verifyToken.js'

const router = express.Router();
dotenv.config();

router.post("/signin", async (req, res) => {
    const signinq = "SELECT * FROM students WHERE student_email = ?";
    db.query(signinq, [req.body.email], async (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.length === 0) return res.status(404).json({ msg: "Student not found", statusmsg: "donotexist" });

        const checkpassword = await bcrypt.compare(req.body.password, data[0].student_password)
        if (!checkpassword) return res.status(400).json({ msg: "Incorrect Password", statusmsg: "wrongpass" });

        const token = jwt.sign({ id: data[0].student_id }, process.env.TOKEN_SECRET, { expiresIn: '2d' });

        const { student_password, ...others } = data[0];

        res.header("auth-token", token).json({ status: "user exist", token: token, student: others });
    })
});

router.get("/:studentid", verifyStudent, async (req, res) => {
    const studentid = req.params.studentid;
    const studentListq = "SELECT student_id, student_name, student_email, student_semester FROM students WHERE student_id = ?";
    db.query(studentListq, [studentid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json(data)
        }
    })
});

router.get("/view/:studentid", verifyStudent, async (req, res) => {
    const studentid = req.params.studentid;

    const attendanceQuery = `SELECT p.paper_id, p.paper_code, p.paper_name, t.teacher_name, t.teacher_gender, COUNT(c.class_id) * 2 AS total_class_hours, 
    COALESCE(SUM(CASE WHEN r.status = 'present' THEN 1 ELSE 0 END), 0) * 2 AS attended_class_hours FROM classes c JOIN papers p ON c.paper_id = p.paper_id JOIN teachers t ON c.teacher_id = t.teacher_id JOIN records r ON c.class_id = r.class_id WHERE r.student_id = ? GROUP BY p.paper_id, p.paper_name, p.paper_code, t.teacher_name, t.teacher_gender;`;

    db.query(attendanceQuery, [studentid], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching attendance data' });
        }

        let alltotal_class_hours = 0;
        let allattended_class_hours = 0;

        const paperwiseData = results.map(row => {
            alltotal_class_hours += row.total_class_hours;
            allattended_class_hours += Number(row.attended_class_hours) || 0;

            return {
                paper_id: row.paper_id,
                paper_name: row.paper_name,
                paper_code: row.paper_code,
                teacher_name: row.teacher_name,
                teacher_gender: row.teacher_gender,
                total_class_hours: row.total_class_hours,
                attended_class_hours: row.attended_class_hours
            };
        });

        const response = {
            alltotal_class_hours: alltotal_class_hours,
            allattended_class_hours: allattended_class_hours,
            paperwise: paperwiseData
        };

        res.json(response);
    })
});

router.get("/latest/:studentid", verifyStudent, async (req, res) => {
    const studentid = req.params.studentid;

    const latest5classesq = `SELECT p.paper_code, p.paper_name, c.class_date, t.teacher_name, t.teacher_gender, r.status FROM records r JOIN classes c ON r.class_id = c.class_id JOIN papers p ON c.paper_id = p.paper_id JOIN teachers t ON c.teacher_id = t.teacher_id WHERE r.student_id = ? ORDER BY c.class_date DESC LIMIT 5;`

    db.query(latest5classesq, [studentid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json(data);
        }
    })
});

router.get('/:studentid/:papercode/:teachername', verifyStudent, async (req, res) => {
    const studentid = req.params.studentid;
    const papercode = req.params.papercode;
    const teachername = req.params.teachername;

    const datewiseclassesq = `SELECT c.class_date, r.status FROM records r JOIN classes c ON r.class_id = c.class_id JOIN papers p ON c.paper_id = p.paper_id JOIN teachers t ON c.teacher_id = t.teacher_id WHERE r.student_id = ? AND p.paper_code = ? AND t.teacher_name = ? ORDER BY c.class_date DESC;`

    db.query(datewiseclassesq, [studentid, papercode, teachername], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json(data);
        }
    })
});

router.get('/updatetime/records/row/getLastModified', verifyStudent, (req, res) => {
    const lastmodifiedq = `SELECT MAX(last_modified) AS last_modified FROM records;`;
    db.query(lastmodifiedq, (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json(data[0]);
        }
    })
});

export default router;