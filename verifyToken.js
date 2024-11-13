import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyStudent = (req, res, next) => {
    const token = req.header("auth-token");
    if (!token) return res.status(401).json({ msg: "Access Denied", statusmsg: "noauth" });;
    
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ msg: "Invalid Token", statusmsg: "invalidtoken" });
    }
}

export const verifyAdmin = (req, res, next) => {
    const token = req.header("admin-token");
    if (!token) return res.status(401).json({ msg: "Access Denied", statusmsg: "noauth" });;

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ msg: "Invalid Token", statusmsg: "invalidtoken" });
    }
}