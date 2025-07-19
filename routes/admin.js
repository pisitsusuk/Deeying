const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require('../middlewares/authCheck');
const { getOrderAdmin, changeOrderStatus } = require('../controllers/admin');

// เปลี่ยนสถานะคำสั่งซื้อ (Admin เท่านั้น)
router.put("/admin/order-status", authCheck, adminCheck, changeOrderStatus);

// ดึงรายการคำสั่งซื้อทั้งหมด (Admin เท่านั้น)
router.get("/admin/orders", authCheck, adminCheck, getOrderAdmin);

module.exports = router;
