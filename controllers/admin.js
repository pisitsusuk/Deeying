const prisma = require("../config/prisma");

// 🔄 เปลี่ยนสถานะคำสั่งซื้อ
exports.changeOrderStatus = async (req, res) => {
    try {
        const { orderId, orderStatus } = req.body;

        if (!orderId || !orderStatus) {
            return res.status(400).json({ message: "⚠️ กรุณาระบุ Order ID และสถานะที่ต้องการเปลี่ยน" });
        }

        // ตรวจสอบว่าคำสั่งซื้อนี้มีอยู่จริงหรือไม่
        const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });

        if (!order) {
            return res.status(404).json({ message: "❌ ไม่พบคำสั่งซื้อ" });
        }

        // อัปเดตสถานะคำสั่งซื้อ
        const updatedOrder = await prisma.order.update({
            where: { id: Number(orderId) },
            data: { orderStatus }
        });

        res.json({ message: "✅ อัปเดตสถานะคำสั่งซื้อสำเร็จ", updatedOrder });

    } catch (err) {
        console.error("🚨 Change Order Status Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 📦 ดึงคำสั่งซื้อทั้งหมด (Admin)
exports.getOrderAdmin = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                products: {
                    include: {
                        product: true
                    }
                },
                orderedBy: {
                    select: {
                        id: true,
                        email: true,
                        address: true
                    }
                }
            }
        });

        if (orders.length === 0) {
            return res.status(404).json({ message: "⚠️ ไม่มีคำสั่งซื้อในระบบ" });
        }

        res.json(orders);

    } catch (err) {
        console.error("🚨 Get Orders Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};
