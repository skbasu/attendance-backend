import express from "express";
import db from "../index.js";
import { verifyAdmin } from "../verifyToken.js"

const router = express.Router();

router.post("/add", verifyAdmin, async (req, res) => {
    const teacherInsertq = "INSERT INTO teachers (teacher_name, teacher_gender) VALUES(?);";
    const values = [req.body.name, req.body.gender];
    db.query(teacherInsertq, [values], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json({ msg: "Teacher is added", statusmsg: "ok" })
        }
    })
})

router.get("/", verifyAdmin, async (req, res) => {
    const teacherListq = "SELECT * FROM teachers";
    db.query(teacherListq, (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json(data)
        }
    })
});

router.put("/edit/:teacherid", verifyAdmin, async (req, res) => {
    const teacherid = req.params.teacherid;
    const teacherupdateq = `UPDATE teachers SET teacher_name = ?, teacher_gender = ? WHERE teacher_id = ?`;
    db.query(teacherupdateq, [req.body.name, req.body.gender, teacherid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json({ msg: "Teacher is updated", statusmsg: "ok" })
        }
    })
})

router.delete('/:teacherid', verifyAdmin, async (req, res) => {
    const teacherid = req.params.teacherid;
    const deleteTeacherq = `DELETE FROM teachers WHERE teacher_id = ?`

    db.query(deleteTeacherq, [teacherid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json({ msg: "Teacher is deleted", statusmsg: "ok" })
        }
    })
});

export default router;