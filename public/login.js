const loginForm = document.querySelector(".login-form");
const registerForm = document.querySelector(".register-form");
const wrapper = document.querySelector(".wrapper");
const loginTitle = document.querySelector(".title-login");
const registerTitle = document.querySelector(".title-register");
const signUpBtn = document.querySelector("#SignUpBtn");
const signInBtn = document.querySelector("#SignInBtn");

function loginFunction(){window.location.href = "login.html";
    loginForm.style.left = "50%";
    loginForm.style.opacity = 1;
    registerForm.style.left = "150%";
    registerForm.style.opacity = 0;
    wrapper.style.height = "500px";
    loginTitle.style.top = "50%";
    loginTitle.style.opacity = 1;
    registerTitle.style.top = "50px";
    registerTitle.style.opacity = 0;
}

function registerFunction(){
    loginForm.style.left = "-50%";
    loginForm.style.opacity = 0;
    registerForm.style.left = "50%";
    registerForm.style.opacity = 1;
    wrapper.style.height = "580px";
    loginTitle.style.top = "-60px";
    loginTitle.style.opacity = 0;
    registerTitle.style.top = "50%";
    registerTitle.style.opacity = 1;
}

// ✅ เข้าสู่ระบบ
signInBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    const email = document.getElementById("log-email").value;
    const password = document.getElementById("log-pass").value;

    try {
        const res = await fetch("https://deeying-1.onrender.com/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ เข้าสู่ระบบสำเร็จ");
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            window.location.href = "Userhome.html";
        } else {
            alert("❌ " + data.message);
        }

    } catch (err) {
        alert("⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
        console.error(err);
    }
});

// ✅ สมัครสมาชิก
signUpBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-pass").value;
    const agree = document.getElementById("agree").checked;

    if (!agree) {
        alert("⚠️ กรุณายอมรับเงื่อนไขก่อนสมัครสมาชิก");
        return;
    }

    try {
        const res = await fetch("https://deeying-1.onrender.com/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ");
            loginFunction(); // สลับกลับไปหน้า Login
        } else {
            alert("❌ " + data.message);
        }

    } catch (err) {
        alert("⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
        console.error(err);
    }
});
