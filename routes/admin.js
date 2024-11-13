import express from "express";
import bcrypt from "bcryptjs";
import db from "../index.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { getInitialsAndTitle, getFirstName } from '../utils.js';
import dotenv from "dotenv";
import { verifyAdmin } from '../verifyToken.js'

const router = express.Router();
dotenv.config();

router.post("/signin", async (req, res) => {
    const signinq = "SELECT * FROM admins WHERE admin_email = ?";
    db.query(signinq, [req.body.email], async (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.length === 0) return res.status(400).json({ msg: "Admin not found", statusmsg: "donotexist" });

        const checkpassword = await bcrypt.compare(req.body.password, data[0].admin_password)
        if (!checkpassword) return res.status(400).json({ msg: "Incorrect Password", statusmsg: "wrongpass" });

        const token = jwt.sign({ id: data[0].admin_id }, process.env.TOKEN_SECRET);

        const { admin_password, ...others } = data[0];

        res.header("admin-token", token).json({ status: "user exist", token: token, admin: others });
    })
});

router.post("/register", async (req, res) => {
    const studentInsertq = "INSERT INTO admins (admin_email, admin_password, admin_name) VALUES(?);";
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(req.body.password, salt);
    const values = [req.body.email, hashed, req.body.name];
    db.query(studentInsertq, [values], (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json({ msg: "Admin is added", statusmsg: "ok" })
        }
    })
});

router.get("/:adminid", verifyAdmin, async (req, res) => {
    const adminid = req.params.adminid;
    const admininfoq = "SELECT admin_email, admin_name FROM admins WHERE admin_id = ?";
    db.query(admininfoq, [adminid], async (err, data) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.status(200).json(data);
        }
    })
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'attendeasy24skb@gmail.com',
        pass: 'ytpgxlmmxxfdaklg'
    }
});

router.get('/email/send-attendance-emails', verifyAdmin, (req, res) => {
    const query = `SELECT s.student_id, s.student_email, s.student_name, t.teacher_name, t.teacher_gender, p.paper_code, p.paper_name, c.class_date, c.class_mode, r.status FROM students s JOIN records r ON s.student_id = r.student_id JOIN classes c ON r.class_id = c.class_id JOIN teachers t ON c.teacher_id = t.teacher_id JOIN papers p ON c.paper_id = p.paper_id WHERE c.class_date = CURDATE();`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error: ', err);
            return res.status(500).send('Error fetching attendance data');
        }

        if (results.length === 0) {
            return res.status(404).json({ msg: "No classes held today!!", statusmsg: "noclasses" })
        }
        const studentData = {};
        results.forEach(record => {
            const { student_email, student_name, teacher_name, teacher_gender, paper_code, paper_name, class_mode, status } = record;
            if (!studentData[student_email]) {
                studentData[student_email] = {
                    student_name,
                    classes: []
                };
            }
            studentData[student_email].classes.push({
                teacher_name,
                teacher_gender,
                paper_code,
                paper_name,
                class_mode,
                status
            });
        });

        const emailPromises = Object.keys(studentData).map(student_email => {
            const { student_name, classes } = studentData[student_email];

            const emailBody = `
                <h2>Hi ${getFirstName(student_name)},</h2>
                <p>Here is the report of your classes held today:</p>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Classes</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Mode</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Teacher</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${classes.map(cls => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px;">
                                  <strong style="font-size: 14px;">${cls.paper_name}</strong><br>
                                  <span style="font-size: 11px;">${cls.paper_code}</span>
                                </td>
                                <td style="border: 1px solid #ddd; padding: 8px;">
                                  <span style="font-size: 12px;">${cls.class_mode}</span>
                                </td>
                                <td style="border: 1px solid #ddd; padding: 8px;">
                                  ${getInitialsAndTitle(cls.teacher_name, cls.teacher_gender)}
                                </td>
                                <td style="border: 1px solid #ddd; padding: 8px; color: ${cls.status === "present" ? "green" : "red"};">
                                  ${cls.status === "present" ? "Present" : "Absent"}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p>Best regards,<br><span style="font-weight:bold;">AttendEasy</span></p>
            `;

            const mailOptions = {
                from: 'attendeasy24skb@gmail.com',
                to: student_email,
                subject: 'Attendance Report for Today',
                html: emailBody,
            };

            return transporter.sendMail(mailOptions);
        });

        Promise.all(emailPromises)
            .then(() => res.status(200).json({ msg: "Attendance Email Sent", statusmsg: "ok" }))
            .catch(err => {
                console.error('Error sending emails: ', err);
                res.status(500).send('Error sending emails');
            });
    });
});


router.post("/email/send-custom-emails", verifyAdmin, (req, res) => {
    const { subject, content } = req.body;

    if (!subject || !content) {
        return res.status(400).send('Subject and content are required');
    }

    const query = 'SELECT student_name, student_email FROM students';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error: ', err);
            return res.status(500).send('Error fetching students');
        }

        const emailPromises = results.map(student => {
            const { student_name, student_email } = student;

            const personalizedContent = `
              <h2>Hi ${getFirstName(student_name)},</h2>
              <p>${content}</p>
              <p>Best regards,<br><span style="font-weight:bold;">AttendEasy</span></p>
            `;

            const mailOptions = {
                from: 'attendeasy24skb@gmail.com',
                to: student_email,
                subject: subject,
                html: personalizedContent
            };

            return transporter.sendMail(mailOptions);
        });

        Promise.all(emailPromises)
            .then(() => res.json({ msg: "Email Sent", statusmsg: "ok" }))
            .catch(err => {
                console.error('Error sending emails: ', err);
                res.status(500).send('Error sending emails');
            });
    });
});


export default router;