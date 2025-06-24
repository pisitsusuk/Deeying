const express = require('express');
const router = express.Router();
const { authCheck, adminCheck } = require('../middlewares/authCheck');
const { create, list, read, update, remove, listby, searchFilters } = require('../controllers/product');

// @Endpoint: http://localhost:5000/api/product

// สร้างสินค้า (Admin เท่านั้น)
router.post('/product', authCheck, adminCheck, create);

// ดึงรายการสินค้า (ผู้ใช้ทั่วไปเข้าถึงได้)
router.get('/products/:count', list);

// ดึงข้อมูลสินค้าแบบเจาะจง (ผู้ใช้ทั่วไปเข้าถึงได้)
router.get('/product/:id', read);

// อัปเดตสินค้า (Admin เท่านั้น)
router.put('/product/:id', authCheck, adminCheck, update);

// ลบสินค้า (Admin เท่านั้น)
router.delete('/product/:id', authCheck, adminCheck, remove);

// ดึงสินค้าตามเงื่อนไข (ผู้ใช้ทั่วไปเข้าถึงได้)
router.post('/productby', listby);

// ค้นหาสินค้าแบบฟิลเตอร์ (ผู้ใช้ทั่วไปเข้าถึงได้)
router.post('/search/filters', searchFilters);

module.exports = router;
