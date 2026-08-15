import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =====================================
   عناصر الصفحة
===================================== */

const email =
document.getElementById("email");

const password =
document.getElementById("password");

const loginBtn =
document.getElementById("loginBtn");

const msg =
document.getElementById("msg");


/* =====================================
   حساب المدير الوحيد
===================================== */

const ADMIN_EMAIL =
"waleedahmad2031@gmail.com";


/* =====================================
   تسجيل الدخول
===================================== */

loginBtn.addEventListener(
"click",
async () => {


const mail =
email.value.trim().toLowerCase();

const pass =
password.value.trim();


msg.style.color =
"red";


/* =====================================
   التحقق من الحقول
===================================== */

if(!mail || !pass){

msg.textContent =
"يرجى إدخال البريد الإلكتروني وكلمة المرور";

return;

}


try{


loginBtn.disabled =
true;

msg.style.color =
"#0b7a75";

msg.textContent =
"جاري تسجيل الدخول...";


/* =====================================
   تسجيل الدخول في Firebase
===================================== */

const userCredential =
await signInWithEmailAndPassword(
auth,
mail,
pass
);


const user =
userCredential.user;


/* =====================================
   التحقق من المدير
===================================== */

if(
user.email &&
user.email.toLowerCase() ===
ADMIN_EMAIL
){

msg.style.color =
"#0b7a75";

msg.textContent =
"تم تسجيل دخول المدير بنجاح ✅";


setTimeout(() => {

location.href =
"admin.html";

},700);


return;

}


/* =====================================
   التحقق من البائع
===================================== */

const sellerRef =
doc(
db,
"sellers",
user.uid
);


const sellerSnap =
await getDoc(
sellerRef
);


/* =====================================
   الحساب ليس بائعًا
===================================== */

if(!sellerSnap.exists()){

msg.style.color =
"red";

msg.textContent =
"❌ هذا الحساب ليس مسجلًا كبائع.";

return;

}


/* =====================================
   بيانات البائع
===================================== */

const seller =
sellerSnap.data();


/* =====================================
   التحقق من حالة البائع
===================================== */

if(
seller.status === "stopped"
){

msg.style.color =
"#e65100";

msg.textContent =
"⏸️ حسابك متوقف مؤقتًا من الإدارة.";

return;

}


/* =====================================
   البائع نشط
===================================== */

msg.style.color =
"#0b7a75";

msg.textContent =
"تم تسجيل الدخول بنجاح ✅";


setTimeout(() => {

location.href =
"seller.html";

},700);


}catch(error){

console.error(error);

msg.style.color =
"red";

msg.textContent =
"البريد الإلكتروني أو كلمة المرور غير صحيحة";


}finally{

loginBtn.disabled =
false;

}

});
