import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

loginBtn.addEventListener("click", async () => {

  const mail = email.value.trim();
  const pass = password.value.trim();

  msg.style.color = "red";

  if (!mail || !pass) {
    msg.textContent = "يرجى إدخال البريد الإلكتروني وكلمة المرور";
    return;
  }

  try {

    loginBtn.disabled = true;
    msg.style.color = "#0b7a75";
    msg.textContent = "جاري تسجيل الدخول...";

    const userCredential =
      await signInWithEmailAndPassword(auth, mail, pass);

    const user = userCredential.user;

    msg.textContent = "تم تسجيل الدخول بنجاح ✅";

    setTimeout(() => {

      if (user.email === "waleedahmad2031@gmail.com") {

        location.href = "admin.html";

      } else {

        location.href = "seller.html";

      }

    }, 1000);

  } catch (error) {

    console.error(error);

    msg.style.color = "red";
    msg.textContent =
      "البريد الإلكتروني أو كلمة المرور غير صحيحة";

  } finally {

    loginBtn.disabled = false;

  }

});
