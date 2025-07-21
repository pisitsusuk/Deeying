const prisma = require("../config/prisma");

// ➕ เพิ่มหมวดหมู่ใหม่
exports.create = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "⚠️ กรุณาระบุชื่อหมวดหมู่" });
        }

        // ตรวจสอบว่าหมวดหมู่มีอยู่แล้วหรือไม่
        const existingCategory = await prisma.category.findFirst({ where: { name } });

        if (existingCategory) {
            return res.status(400).json({ message: "❌ หมวดหมู่นี้มีอยู่แล้ว" });
        }

        // สร้างหมวดหมู่ใหม่
        const category = await prisma.category.create({
            data: { name }
        });

        res.status(201).json(category);

    } catch (err) {
        console.error("🚨 Create Category Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 📜 ดึงรายการหมวดหมู่ทั้งหมด
exports.list = async (req, res) => {
    try {
        const categories = await prisma.category.findMany();

        if (categories.length === 0) {
            return res.status(404).json({ message: "⚠️ ไม่มีหมวดหมู่ในระบบ" });
        }

        res.json(categories);

    } catch (err) {
        console.error("🚨 List Categories Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// ❌ ลบหมวดหมู่
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "⚠️ ต้องระบุ ID ของหมวดหมู่" });
        }

        // ตรวจสอบว่าหมวดหมู่มีอยู่จริงหรือไม่
        const category = await prisma.category.findUnique({ where: { id: Number(id) } });

        if (!category) {
            return res.status(404).json({ message: "❌ ไม่พบหมวดหมู่ที่ต้องการลบ" });
        }

        // ลบหมวดหมู่
        await prisma.category.delete({ where: { id: Number(id) } });

        res.json({ message: "✅ ลบหมวดหมู่สำเร็จ" });

    } catch (err) {
        console.error("🚨 Remove Category Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};
