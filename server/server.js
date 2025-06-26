const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const prisma = require('../config/prisma');
const path = require('path'); 

require('dotenv').config({ path: './config/.env' });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html")); // หรือ login.html
});


if (!process.env.DIALOGFLOW_PROJECT_ID) {
  throw new Error("DIALOGFLOW_PROJECT_ID is not set in environment");
}

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const sessionClient = new dialogflow.SessionsClient({
  keyFilename: "/etc/secrets/chatbot-key.json"
});

const sessionId = uuid.v4();
const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

// ดึงข้อมูลสินค้าโดยใช้ Prisma
async function getProductInfo(productName) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        title: productName
      },
      select: {
        title: true,
        price: true,
        quantity: true
      }
    });

    return product
      ? { name: product.title, price: product.price, stock: product.quantity }
      : null;
  } catch (err) {
    console.error('Prisma query error:', err);
    return null;
  }
}

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  try {
    console.log(`📝 User Message: ${message}`);

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: 'th',
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    console.log("🎯 Intent Matched:", result.intent.displayName);
    const productName = result.parameters.fields.product?.stringValue || null;

    if (result.intent.displayName === "Greet") {
      return res.json({ reply: result.fulfillmentText || "สวัสดีครับ! มีอะไรให้ช่วยไหมครับ?" });
    }

    if (result.intent.displayName === "ถามราคาสินค้า") {
      if (!productName) {
        return res.json({ reply: "กรุณาระบุชื่อสินค้าที่ต้องการสอบถามด้วยครับ" });
      }

      const productInfo = await getProductInfo(productName);

      if (productInfo) {
        return res.json({
          reply: `สินค้าของเราคือ ${productInfo.name} ราคา ${productInfo.price} บาท คงเหลือในสต็อก ${productInfo.stock} ชิ้น`
        });
      } else {
        return res.json({ reply: `ขออภัย ไม่พบข้อมูลของสินค้า ${productName}` });
      }
    }

    return res.json({ reply: result.fulfillmentText || "ขออภัย ฉันไม่เข้าใจคำถาม กรุณาลองใหม่อีกครั้ง" });

  } catch (error) {
    console.error('❌ Error communicating with Dialogflow:', error);
    res.status(500).send('Error communicating with Dialogflow');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
