import express from "express";
import bcrypt from "bcryptjs"; 
import db from "../index.js";
import { verifyAdmin } from "../verifyToken.js"

const router = express.Router();

router.post("/add", verifyAdmin, async (req, res) => {
    const studentInsertq = "INSERT INTO students (student_id, student_email, student_password, student_name, student_semester) VALUES(?);";
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(req.body.password, salt);
    const values = [req.body.id, req.body.email, hashed, req.body.name, req.body.semester];
    db.query(studentInsertq, [values], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json({ msg: "Student is added", statusmsg: "ok"})
        }
    })
});

router.get("/", verifyAdmin, async (req, res) => {
    const studentListq = "SELECT student_id, student_email, student_name, student_semester FROM students";
    db.query(studentListq, (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json(data);
        }
    }) 
});

router.get("/:studentid", verifyAdmin, async (req, res) => {
    const studentid = req.params.studentid;
    const studentListq = "SELECT * FROM students WHERE student_id = ?";
    db.query(studentListq, [studentid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json(data)
        }
    })
});

router.put("/edit/:studentid", verifyAdmin, async (req, res) => {
    const studentid = req.params.studentid;
    const studentupdateq = `UPDATE students SET student_name = ?, student_email = ?, student_semester = ? WHERE student_id = ?`;
    db.query(studentupdateq, [req.body.name, req.body.email, req.body.semester, studentid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json({ msg: "Student is updated", statusmsg: "ok" })
        }
    })
})

router.delete('/:studentid', verifyAdmin, async (req, res) => {
    const studentid = req.params.studentid;
    const deleteStudentq = `DELETE FROM students WHERE student_id = ?`

    db.query(deleteStudentq, [studentid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json({ msg: "Student is deleted", statusmsg: "ok" })
        }
    })
});


router.get("/view/:studentid", verifyAdmin, async (req, res) => {
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

router.get("/latest/:studentid", verifyAdmin, async (req, res) => {
    const studentid = req.params.studentid;

    const latest5classesq = `SELECT p.paper_code, p.paper_name, c.class_date, t.teacher_name, t.teacher_gender, r.status FROM records r JOIN classes c ON r.class_id = c.class_id JOIN papers p ON c.paper_id = p.paper_id JOIN teachers t ON c.teacher_id = t.teacher_id WHERE r.student_id = ? ORDER BY c.class_date DESC LIMIT 10;`

    db.query(latest5classesq, [studentid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json(data);
        }
    })
});

router.get('/:studentid/:papercode/:teachername', verifyAdmin, async (req, res) => {
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


export default router;