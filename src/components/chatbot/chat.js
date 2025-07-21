// เปิดกล่องแชท
function openChat() {
  document.getElementById("chat-box").style.display = "block";
}

// ปิดกล่องแชท
function closeChat(event) {
  event.preventDefault(); 
  document.getElementById("chat-box").style.display = "none";
}

// ฟังก์ชันแสดงข้อความทีละตัว
function typeWriter(element, text, speed = 50) {
  let i = 0;
  function typing() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }
  typing();
}

// ฟังก์ชันสำหรับเริ่มต้นการแชทและเชื่อมต่อกับ Backend
async function startChat(event) {
  event.preventDefault(); // ป้องกันการรีเฟรชหน้าเว็บ
  const messageInput = document.getElementById("message-input");
  const chatHistory = document.getElementById("chat-history");

  const userMessage = messageInput.value.trim();
  if (userMessage === "") return;
  messageInput.value = ""; 

  const userChat = document.createElement("div");
  userChat.className = "message user";
  userChat.innerHTML = `<strong>You:</strong> ${userMessage}`;
  chatHistory.appendChild(userChat);

  try {
    const response = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch response from server");
    }

    const data = await response.json();
    const botReply = data.reply || "No response from bot";

    const botChat = document.createElement("div");
    botChat.className = "message bot";
    botChat.innerHTML = `<strong>Bot:</strong> `;
    const spanElement = document.createElement("span");
    botChat.appendChild(spanElement);
    chatHistory.appendChild(botChat);

    typeWriter(spanElement, botReply);
  } catch (error) {
    console.error("Error:", error);
    const errorChat = document.createElement("div");
    errorChat.className = "message bot";
    errorChat.innerHTML = `<strong>Bot:</strong> ขอโทษครับ เกิดข้อผิดพลาดในการเชื่อมต่อ`;
    chatHistory.appendChild(errorChat);
  }

  chatHistory.scrollTop = chatHistory.scrollHeight;
}


