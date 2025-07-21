const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// ตรวจสอบว่า SECRET มีค่าหรือไม่
if (!process.env.SECRET) {
    throw new Error("⚠️ กรุณาตั้งค่า SECRET ในไฟล์ .env");
}

// Middleware ตรวจสอบสิทธิ์ (User Authentication)
exports.authCheck = async (req, res, next) => {
    try {
        // ดึง Token จาก Header
        const headerToken = req.headers.authorization;
        if (!headerToken) {
            return res.status(401).json({ message: "🚫 ไม่พบ Token ใน Header (Unauthorized)" });
        }

        // แยก Token ออกจาก "Bearer <TOKEN>"
        const token = headerToken.split(" ")[1];

        // ตรวจสอบและถอดรหัส Token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET);
        } catch (error) {
            return res.status(401).json({ message: "❌ Token ไม่ถูกต้อง หรือหมดอายุ" });
        }

        req.user = decoded;

        // ตรวจสอบว่าผู้ใช้ยังคงเปิดใช้งานอยู่ในระบบ
        const user = await prisma.user.findFirst({
            where: { email: req.user.email }
        });

        if (!user || !user.enabled) {
            return res.status(403).json({ message: "⛔ บัญชีนี้ถูกปิดใช้งานหรือไม่มีสิทธิ์เข้าถึง" });
        }

        next(); // อนุญาตให้เข้าถึง API ถัดไป
    } catch (err) {
        console.error("🔥 Authentication Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบยืนยันตัวตน" });
    }
};

// Middleware ตรวจสอบสิทธิ์ Admin (Admin Authentication)
exports.adminCheck = async (req, res, next) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(403).json({ message: "❌ ไม่สามารถตรวจสอบสิทธิ์ Admin ได้" });
        }

        // ค้นหาผู้ใช้ในฐานข้อมูล
        const adminUser = await prisma.user.findFirst({
            where: { email: req.user.email }
        });

        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({ message: "⛔ สิทธิ์ถูกปฏิเสธ: ต้องเป็น Admin เท่านั้น" });
        }

        next(); // อนุญาตให้เข้าถึง API ถัดไป
    } catch (err) {
        console.error("🚨 Admin Authentication Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบตรวจสอบสิทธิ์ Admin" });
    }
};
