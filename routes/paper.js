import express from "express";
import db from "../index.js";
import { verifyAdmin } from "../verifyToken.js"

const router = express.Router();

router.post("/add", verifyAdmin, async (req, res) => {
    const paperInsertq = "INSERT INTO papers (paper_code, paper_name) VALUES(?);";
    const values = [req.body.code, req.body.name];
    db.query(paperInsertq, [values], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json({ msg: "Paper is added", statusmsg: "ok" })
        }
    })
});

router.get("/", verifyAdmin, async (req, res) => {
    const paperListq = "SELECT * FROM papers";
    db.query(paperListq, (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json(data)
        }
    })
});

router.put('/edit/:paperid', verifyAdmin, async (req, res) => {
    const paperid = req.params.paperid;
    const paperupdateq = `UPDATE papers SET paper_code = ?, paper_name = ? WHERE paper_id = ?`;
    db.query(paperupdateq, [req.body.code, req.body.name, paperid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json({ msg: "Paper is updated", statusmsg: "ok" })
        }
    })
})

router.delete('/:paperid', verifyAdmin, async (req, res) => {
    const paperid = req.params.paperid;
    const deletePaperq = `DELETE FROM papers WHERE paper_id = ?`

    db.query(deletePaperq, [paperid], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json({ msg: "Paper is deleted", statusmsg: "ok" })
        }
    })
});

export default router;