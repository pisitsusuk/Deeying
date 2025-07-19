const express = require('express');
const router = express.Router();
const { authCheck, adminCheck } = require('../middlewares/authCheck');
const { create, list, remove } = require('../controllers/category');

// @Endpoint: http://localhost:5000/api/category

// สร้างหมวดหมู่ (Admin เท่านั้น)
router.post('/category', authCheck, adminCheck, create);

// ดึงรายการหมวดหมู่ทั้งหมด (ทุกคนสามารถดูได้)
router.get('/category', list);

// ลบหมวดหมู่ (Admin เท่านั้น)
router.delete('/category/:id', authCheck, adminCheck, remove);

module.exports = router;
