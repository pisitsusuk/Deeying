const prisma = require("../config/prisma");

// 🔎 ดึงรายชื่อผู้ใช้ทั้งหมด (Admin Only)
exports.listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                enabled: true,
                address: true
            }
        });
        res.json(users);
    } catch (err) {
        console.error("🚨 List Users Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 🔄 เปลี่ยนสถานะการใช้งานของผู้ใช้
exports.changeStatus = async (req, res) => {
    try {
        const { id, enabled } = req.body;

        if (!id) {
            return res.status(400).json({ message: "⚠️ ต้องระบุ ID ของผู้ใช้" });
        }

        await prisma.user.update({
            where: { id: Number(id) },
            data: { enabled }
        });

        res.json({ message: "✅ อัปเดตสถานะสำเร็จ" });

    } catch (err) {
        console.error("🚨 Change Status Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 🔄 เปลี่ยน Role ของผู้ใช้
exports.changeRole = async (req, res) => {
    try {
        const { id, role } = req.body;

        if (!id || !role) {
            return res.status(400).json({ message: "⚠️ ต้องระบุ ID และ Role" });
        }

        await prisma.user.update({
            where: { id: Number(id) },
            data: { role }
        });

        res.json({ message: "✅ เปลี่ยน Role สำเร็จ" });

    } catch (err) {
        console.error("🚨 Change Role Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 🛒 บันทึกตะกร้าสินค้า (Cart)
exports.userCart = async (req, res) => {
    try {
        const { cart } = req.body;

        if (!cart || cart.length === 0) {
            return res.status(400).json({ message: "⚠️ ตะกร้าสินค้าต้องมีสินค้าอย่างน้อย 1 รายการ" });
        }

        const user = await prisma.user.findFirst({ where: { id: Number(req.user.id) } });

        if (!user) {
            return res.status(404).json({ message: "❌ ไม่พบผู้ใช้" });
        }

        await prisma.cart.deleteMany({ where: { orderedById: user.id } });

        let cartTotal = cart.reduce((sum, item) => sum + item.price * item.count, 0);

        await prisma.cart.create({
            data: {
                products: {
                    create: cart.map(item => ({
                        productId: item.id,
                        count: item.count,
                        price: item.price
                    }))
                },
                cartTotal,
                orderedById: user.id
            }
        });

        res.json({ message: "✅ เพิ่มสินค้าเข้าตะกร้าสำเร็จ" });

    } catch (err) {
        console.error("🚨 User Cart Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 🔍 ดึงข้อมูลตะกร้าสินค้าของผู้ใช้
exports.getUserCart = async (req, res) => {
    try {
        const cart = await prisma.cart.findFirst({
            where: {
                orderedById: Number(req.user.id)
            },
            include: {
                products: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!cart) {
            return res.status(404).json({ message: "⚠️ ไม่พบตะกร้าสินค้า" });
        }

        res.json({
            products: cart.products,
            cartTotal: cart.cartTotal
        });

    } catch (err) {
        console.error("🚨 Get User Cart Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 📦 สร้างคำสั่งซื้อ (Order)
exports.saveOrder = async (req, res) => {
    try {
        const userCart = await prisma.cart.findFirst({
            where: { orderedById: Number(req.user.id) },
            include: { products: true }
        });

        if (!userCart || userCart.products.length === 0) {
            return res.status(400).json({ message: "⚠️ ตะกร้าสินค้าของคุณว่างเปล่า" });
        }

        for (const item of userCart.products) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });

            if (!product || item.count > product.quantity) {
                return res.status(400).json({ message: `❌ สินค้า ${product?.title || 'product'} หมดสต็อก` });
            }
        }

        const order = await prisma.order.create({
            data: {
                products: {
                    create: userCart.products.map(item => ({
                        productId: item.productId,
                        count: item.count,
                        price: item.price
                    }))
                },
                orderedById: req.user.id,
                cartTotal: userCart.cartTotal,
                status: "Pending",
                currency: "THB"
            }
        });

        await Promise.all(userCart.products.map(item =>
            prisma.product.update({
                where: { id: item.productId },
                data: {
                    quantity: { decrement: item.count },
                    sold: { increment: item.count }
                }
            })
        ));

        await prisma.cart.deleteMany({ where: { orderedById: req.user.id } });

        res.json({ message: "✅ สร้างคำสั่งซื้อสำเร็จ", order });

    } catch (err) {
        console.error("🚨 Save Order Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 🗑️ ลบตะกร้าสินค้า
exports.emptyCart = async (req, res) => {
    try {
        await prisma.cart.deleteMany({ where: { orderedById: Number(req.user.id) } });
        res.json({ message: "✅ ล้างตะกร้าสำเร็จ" });

    } catch (err) {
        console.error("🚨 Empty Cart Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// 📍 บันทึกที่อยู่ของผู้ใช้
exports.saveAddress = async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ message: "⚠️ กรุณากรอกที่อยู่" });
        }

        await prisma.user.update({
            where: { id: Number(req.user.id) },
            data: { address }
        });

        res.json({ message: "✅ บันทึกที่อยู่สำเร็จ" });

    } catch (err) {
        console.error("🚨 Save Address Error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};
// 📦 ดึงคำสั่งซื้อของผู้ใช้
exports.getOrder = async (req, res) => {
  try {
      const orders = await prisma.order.findMany({
          where: { orderedById: Number(req.user.id) },
          include: {
              products: {
                  include: {
                      product: true
                  }
              }
          }
      });

      if (orders.length === 0) {
          return res.status(404).json({ message: "⚠️ ไม่พบคำสั่งซื้อของคุณ" });
      }

      res.json(orders);

  } catch (err) {
      console.error("🚨 Get Order Error:", err);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};
