const express = require('express');
const router = express.Router();
const { authCheck, adminCheck } = require('../middlewares/authCheck');
const { 
    listUsers, changeStatus, changeRole, 
    userCart, getUserCart, emptyCart, 
    saveOrder, saveAddress, getOrder 
} = require('../controllers/user');

// @Endpoint: http://localhost:5000/api/user

// 🔐 เส้นทางสำหรับ Admin เท่านั้น
router.get('/users', authCheck, adminCheck, listUsers); // ดึงรายชื่อผู้ใช้ทั้งหมด
router.post('/change-status', authCheck, adminCheck, changeStatus); // เปลี่ยนสถานะผู้ใช้
router.post('/change-role', authCheck, adminCheck, changeRole); // เปลี่ยน Role ผู้ใช้

// 🛒 เส้นทางสำหรับผู้ใช้ทั่วไป (ต้องล็อกอิน)
router.post('/user/cart', authCheck, userCart); // เพิ่มสินค้าลงตะกร้า
router.get('/user/cart', authCheck, getUserCart); // ดูสินค้าตะกร้าของผู้ใช้
router.delete('/user/cart', authCheck, emptyCart); // ล้างตะกร้าสินค้า

router.post('/user/address', authCheck, saveAddress); // บันทึกที่อยู่

router.post('/user/order', authCheck, saveOrder); // สร้างคำสั่งซื้อ
router.get('/user/order', authCheck, getOrder); // ดูคำสั่งซื้อของผู้ใช้

module.exports = router;
