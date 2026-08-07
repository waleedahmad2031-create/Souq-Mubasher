import { auth, db } from "./firebase.js";

import {
createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
doc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const shopName = document.getElementById("shopName");
const phone = document.getElementById("phone");
const email = document.getElementById("email");
const password = document.getElementById("password");

const registerBtn = document.getElementById("registerBtn");
const msg = document.getElementById("msg");
registerBtn.addEventListener("click", async () => {

const shop = shopName.value.trim();
const mobile = phone.value.trim();
const mail = email.value.trim();
const pass = password.value.trim();

msg.style.color = "red";

if(!shop || !mobile || !mail || !pass){
msg.textContent = "يرجى تعبئة جميع الحقول";
return;
}

if(pass.length < 6){
msg.textContent = "كلمة المرور يجب أن تكون 6 أحرف أو أكثر";
return;
}

try{

registerBtn.disabled = true;
msg.style.color = "#0b7a75";
msg.textContent = "جاري إنشاء الحساب...";

const userCredential = await createUserWithEmailAndPassword(
auth,
mail,
pass
);

const user = userCredential.user;

await setDoc(doc(db,"sellers",user.uid),{

uid:user.uid,
shopName:shop,
phone:mobile,
email:mail,

status:"active",

subscription:"free",

createdAt:serverTimestamp()

});

msg.textContent = "تم إنشاء الحساب بنجاح ✅";

}catch(error){

msg.style.color = "red";

msg.textContent = error.message;

}finally{

registerBtn.disabled = false;

}

});
