const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './config/.env' }); // สำหรับโหลด SECRETr


// 🔒 ลงทะเบียนผู้ใช้ (Register)
exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: '⚠️ กรุณากรอกอีเมลและรหัสผ่าน' });
        }

        const existingUser = await prisma.user.findFirst({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: '❌ อีเมลนี้ถูกใช้ไปแล้ว' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: "user",
                enabled: true
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

        if (!email || !password) {
            return res.status(400).json({ message: '⚠️ กรุณากรอกอีเมลและรหัสผ่าน' });
        }

        const user = await prisma.user.findFirst({ where: { email } });

        if (!user || !user.enabled) {
            return res.status(403).json({ message: '⛔ บัญชีนี้ถูกปิดใช้งานหรือไม่มีสิทธิ์เข้าใช้' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '❌ รหัสผ่านไม่ถูกต้อง' });
        }

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '10d' });

        res.json({ token, user });

    } catch (err) {
        console.error("🚨 Login Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 🔍 ดึงข้อมูลผู้ใช้ปัจจุบัน (Current User)
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
