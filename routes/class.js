import express from "express";
import db from "../index.js";
import { verifyAdmin } from '../verifyToken.js'

const router = express.Router();

router.post("/add", verifyAdmin, async (req, res) => {
    const classInsertq = "INSERT INTO classes (class_date, teacher_id, paper_id, class_mode) VALUES(?);";
    const values = [req.body.date, req.body.teacher_id, req.body.paper_id, req.body.mode];
    db.query(classInsertq, [values], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json({ msg: "Class is added", statusmsg: "ok" })
        }
    })
})

router.get("/info/:classid", verifyAdmin, async (req, res) => {
    const classid = req.params.classid;
    const classinfoq = `SELECT classes.class_date, teachers.teacher_name, teachers.teacher_gender, papers.paper_code, papers.paper_name FROM classes JOIN teachers ON classes.teacher_id = teachers.teacher_id JOIN papers ON classes.paper_id = papers.paper_id WHERE classes.class_id = ?;`

    db.query(classinfoq, [classid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            res.status(200).json(data);
        }
    })
});

router.delete("/:classid", verifyAdmin, async (req, res) => {
    const classid = req.params.classid;
    const deleteclassq = `DELETE FROM classes WHERE class_id = ?`;
    db.query(deleteclassq, [classid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            res.status(200).json({ msg: "Class is deleted", statusmsg: "ok" });
        }
    })
});

router.put("/:classid", verifyAdmin, async (req, res) => {
    const classid = req.params.classid;
    const updateclassq = `UPDATE classes SET class_date = ?, teacher_id = ?, paper_id = ?, class_mode = ? WHERE class_id = ?;`;
    const values = [req.body.date, req.body.teacher_id, req.body.paper_id, req.body.mode, classid];

    db.query(updateclassq, [values], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            res.status(200).json({ msg: "Class is updated", statusmsg: "ok" });
        }
    })
});

router.post("/records/:class_id", verifyAdmin, async (req, res) => {
    const class_id = req.params.class_id;
    const { student_ids, status } = req.body;
    const values = student_ids.map(student_id => [class_id, student_id, status]);
    const placeholders = values.map(() => '(?, ?, ?)').join(', ');

    const recordInsertq = `INSERT INTO records (class_id, student_id, status) VALUES ${placeholders}`;

    const flattenedValues = values.flat();

    db.query(recordInsertq, flattenedValues, (error, data) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        } else {
            res.status(200).json({statusmsg: "ok", message: 'Records inserted successfully!', data });
        }
    });
})

router.get("/:paperid", verifyAdmin, async (req, res) => {
    const paperid = req.params.paperid;
    const classesbypaperq = `SELECT classes.class_id, classes.class_date,  teachers.teacher_name, teachers.teacher_gender, papers.paper_code, papers.paper_name, classes.class_mode FROM classes JOIN teachers ON classes.teacher_id = teachers.teacher_id JOIN papers ON classes.paper_id = papers.paper_id WHERE papers.paper_id = ? ORDER BY classes.class_date DESC;`;

    db.query(classesbypaperq, [paperid], (error, data) => {
        if (error) {
            return res.status(500).json(error);
        } else {
            res.status(200).json(data);
        }
    })
});

router.get("/classes/:classdate", verifyAdmin, async (req, res) => {
    const classdate = req.params.classdate;
    const classesbydateq = `SELECT classes.class_id, classes.class_date,  teachers.teacher_name, teachers.teacher_gender, papers.paper_code, papers.paper_name, classes.class_mode FROM classes JOIN teachers ON classes.teacher_id = teachers.teacher_id JOIN papers ON classes.paper_id = papers.paper_id WHERE classes.class_date = ? ORDER BY classes.class_date DESC;`;

    db.query(classesbydateq, [classdate], (error, data) => {
        if (error) {
            return res.status(500).json(error);
        } else {
            res.status(200).json(data);
        }
    })
});

router.get("/attendance/:classid", verifyAdmin, async (req, res) => {
    const classid = req.params.classid;
    const query = `SELECT students.student_id, students.student_name, records.status FROM 
                students JOIN records ON students.student_id = records.student_id JOIN classes ON 
                records.class_id = classes.class_id WHERE classes.class_id = ? ORDER BY students.student_id`
                
    db.query(query, [classid], (error, data) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        } else {
            res.status(200).json(data);
        }
    })
});

router.put('/attendance/:classid/:studentid', verifyAdmin, async (req, res) => {
    const classid = req.params.classid;
    const studentid = req.params.studentid;

    const updateStudentstatusq = `UPDATE records SET status = ? WHERE class_id = ? AND student_id = ?`
    db.query(updateStudentstatusq, [req.body.status, classid, studentid], (error, data) => {
        if (error) {
            return res.status(500).json(error);
        } else {
            res.status(200).json({ message: 'Status is updated successfully!', statusmsg: "ok", });
        }
    });
})

router.delete('/attendance/:classid/:studentid', verifyAdmin, async (req, res) => {
    const classid = req.params.classid;
    const studentid = req.params.studentid;

    const deleteStudentfromclassq = `DELETE FROM records WHERE class_id = ? AND student_id = ?;`
    db.query(deleteStudentfromclassq, [classid, studentid], (error, data) => {
        if (error) {
            return res.status(500).json(error);
        } else {
            res.status(200).json({ message: 'Student deleted from a class successfully!', statusmsg: "ok", });
        }
    });
});

export default router;