const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 🔒 ลงทะเบียนผู้ใช้ (Register)
exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 📌 ตรวจสอบข้อมูลที่รับเข้ามา
        if (!email || !password) {
            return res.status(400).json({ message: '⚠️ กรุณากรอกอีเมลและรหัสผ่าน' });
        }

        // 🔎 ตรวจสอบว่าอีเมลนี้มีอยู่แล้วหรือไม่
        const existingUser = await prisma.user.findFirst({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ message: '❌ อีเมลนี้ถูกใช้ไปแล้ว' });
        }

        // 🔒 เข้ารหัสรหัสผ่านก่อนบันทึก
        const hashedPassword = await bcrypt.hash(password, 10);

        // 📌 สร้างบัญชีใหม่
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: "user", // ค่าเริ่มต้นเป็น "user"
                enabled: true // เปิดใช้งานโดยเริ่มต้น
            }
        });

        res.status(201).json({ message: '✅ ลงทะเบียนสำเร็จ' });

    } catch (err) {
        console.error("🚨 Register Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 🔑 เข้าสู่ระบบ (Login)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 📌 ตรวจสอบว่ามีข้อมูลครบหรือไม่
        if (!email || !password) {
            return res.status(400).json({ message: '⚠️ กรุณากรอกอีเมลและรหัสผ่าน' });
        }

        // 🔎 ค้นหาผู้ใช้ในฐานข้อมูล
        const user = await prisma.user.findFirst({
            where: { email }
        });

        if (!user || !user.enabled) {
            return res.status(403).json({ message: '⛔ บัญชีนี้ถูกปิดใช้งานหรือไม่มีสิทธิ์เข้าใช้' });
        }

        // 🔑 ตรวจสอบรหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '❌ รหัสผ่านไม่ถูกต้อง' });
        }

        // 🏷️ สร้าง Payload สำหรับ Token
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        // 🎫 สร้าง Token
        const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '10d' });

        res.json({ token, user });

    } catch (err) {
        console.error("🚨 Login Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 🔎 ตรวจสอบผู้ใช้ปัจจุบัน (Current User)
exports.currentUser = async (req, res) => {
    try {
        const user = await prisma.user.findFirst({
            where: { email: req.user.email }
        });

        if (!user) {
            return res.status(404).json({ message: '⚠️ ไม่พบข้อมูลผู้ใช้' });
        }

        res.json(user);

    } catch (err) {
        console.error("🚨 Current User Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};
