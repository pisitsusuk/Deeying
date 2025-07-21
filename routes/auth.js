const express = require('express');
const router = express.Router();
const { authCheck, adminCheck } = require('../middlewares/authCheck');
const { register, login, currentUser } = require('../controllers/auth');

// ลงทะเบียนผู้ใช้ใหม่ (ทุกคนเข้าถึงได้)
router.post('/register', register);

// เข้าสู่ระบบ (ทุกคนเข้าถึงได้)
router.post('/login', login);

// ตรวจสอบผู้ใช้ปัจจุบัน (ต้องล็อกอินก่อน)
router.post('/current-user', authCheck, currentUser);

// ตรวจสอบผู้ใช้ปัจจุบัน (สำหรับ Admin เท่านั้น)
router.post('/current-admin', authCheck, adminCheck, currentUser);

module.exports = router;
