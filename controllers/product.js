const prisma = require('../config/prisma');
const cloudinary = require('cloudinary').v2; // รองรับการลบรูปภาพจาก Cloudinary

// ➕ เพิ่มสินค้าใหม่
exports.create = async (req, res) => {
    try {
        const { title, description, price, quantity, categoryId, images } = req.body;

        if (!title || !description || !price || !quantity || !categoryId) {
            return res.status(400).json({ message: "⚠️ กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        // ตรวจสอบว่า `categoryId` มีอยู่จริง
        const categoryExists = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
        if (!categoryExists) {
            return res.status(400).json({ message: "❌ หมวดหมู่สินค้าที่เลือกไม่มีอยู่จริง" });
        }

        // ตรวจสอบว่า images สามารถเป็นค่าว่างได้
        const imagesData = images && images.length > 0 ? 
            images.map((item) => ({
                asset_id: item.asset_id,
                public_id: item.public_id,
                url: item.url,
                secure_url: item.secure_url
            })) : [];

        // สร้างสินค้าใหม่
        const product = await prisma.product.create({
            data: {
                title,
                description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: Number(categoryId),
                images: {
                    create: imagesData
                }
            }
        });

        res.status(201).json(product);

    } catch (err) {
        console.error("🚨 Create Product Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};


// 📜 ดึงสินค้าทั้งหมด (กำหนดจำนวนได้)
exports.list = async (req, res) => {
    try {
        const { count } = req.params;

        const products = await prisma.product.findMany({
            take: parseInt(count),
            orderBy: { createdAt: "desc" },
            include: {
                category: true,
                images: true
            }
        });

        res.json(products);

    } catch (err) {
        console.error("🚨 List Products Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 🔍 ดึงข้อมูลสินค้าตาม id
exports.read = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                category: true,
                images: true
            }
        });

        if (!product) {
            return res.status(404).json({ message: "❌ ไม่พบสินค้า" });
        }

        res.json(product);

    } catch (err) {
        console.error("🚨 Read Product Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 🔄 อัปเดตสินค้า
exports.update = async (req, res) => {
    try {
        const { title, description, price, quantity, categoryId, images } = req.body;
        const { id } = req.params;

        const productExists = await prisma.product.findUnique({ where: { id: Number(id) } });
        if (!productExists) {
            return res.status(404).json({ message: "❌ ไม่พบสินค้า" });
        }

        await prisma.image.deleteMany({
            where: { productId: Number(id) }
        });

        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                title,
                description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: Number(categoryId),
                images: {
                    create: images.map((item) => ({
                        asset_id: item.asset_id,
                        public_id: item.public_id,
                        url: item.url,
                        secure_url: item.secure_url
                    }))
                }
            }
        });

        res.json(updatedProduct);

    } catch (err) {
        console.error("🚨 Update Product Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// ❌ ลบสินค้า
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;

        // ตรวจสอบว่าสินค้าจะถูกลบมีอยู่จริงหรือไม่
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: { images: true }
        });

        if (!product) {
            return res.status(404).json({ message: "❌ ไม่พบสินค้า" });
        }

        // 🔥 ลบข้อมูลที่เชื่อมโยงกับสินค้า
        await prisma.productOnOrder.deleteMany({
            where: { productId: Number(id) }
        }).catch(() => console.log("✅ ไม่มีข้อมูลใน ProductOnOrder"));

        await prisma.productOnCart.deleteMany({
            where: { productId: Number(id) }
        }).catch(() => console.log("✅ ไม่มีข้อมูลใน ProductOnCart"));

        await prisma.image.deleteMany({
            where: { productId: Number(id) }
        }).catch(() => console.log("✅ ไม่มีข้อมูลใน Image"));

        // ลบรูปภาพจาก Cloudinary
        const deleteImagePromises = product.images.map((image) =>
            cloudinary.uploader.destroy(image.public_id).catch((err) => {
                console.error(`⚠️ Error deleting image ${image.public_id}:`, err);
                return null;
            })
        );

        await Promise.all(deleteImagePromises);

        // 🔥 สุดท้ายลบสินค้า
        await prisma.product.delete({ where: { id: Number(id) } });

        res.json({ message: "✅ ลบสินค้าสำเร็จ" });

    } catch (err) {
        console.error("🚨 Remove Product Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 📋 ดึงสินค้าตามเงื่อนไข
exports.listby = async (req, res) => {
    try {
        const { sort, order, limit } = req.body;

        const products = await prisma.product.findMany({
            take: limit,
            orderBy: { [sort]: order },
            include: {
                category: true,
                images: true
            }
        });

        res.json(products);
    } catch (err) {
        console.error("🚨 List By Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 🔎 ค้นหาสินค้าแบบฟิลเตอร์
exports.searchFilters = async (req, res) => {
    try {
        const { query, category, price } = req.body;
        let filter = {};

        if (query) {
            filter.title = { contains: query };
        }

        if (category && category.length > 0) {
            filter.categoryId = { in: category.map(Number) };
        }

        if (price && price.length === 2) {
            filter.price = { gte: price[0], lte: price[1] };
        }

        const products = await prisma.product.findMany({
            where: filter,
            include: {
                category: true,
                images: true
            }
        });

        res.json(products);
    } catch (err) {
        console.error("🚨 Search Filters Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};
