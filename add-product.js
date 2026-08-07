import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const categoryInput = document.getElementById("category");
const imageInput = document.getElementById("image");
const descriptionInput = document.getElementById("description");

const saveBtn = document.getElementById("saveBtn");
const msg = document.getElementById("msg");

let currentSeller = null;

onAuthStateChanged(auth, (user) => {

if(!user){

location.href = "login.html";
return;

}

currentSeller = user;

});

saveBtn.addEventListener("click", async () => {

const name = nameInput.value.trim();
const price = Number(priceInput.value);
const category = categoryInput.value;
const image = imageInput.value.trim();
const description = descriptionInput.value.trim();

if(!currentSeller){
msg.style.color = "red";
msg.textContent = "يجب تسجيل الدخول أولًا";
return;
}

if(!name || !price || !category){
msg.style.color = "red";
msg.textContent = "يرجى تعبئة اسم المنتج والسعر والقسم";
return;
}

try{

saveBtn.disabled = true;

msg.style.color = "#0b7a75";
msg.textContent = "جاري حفظ المنتج...";

await addDoc(collection(db,"products"),{

name:name,
price:price,
category:category,
image:image,
description:description,

sellerId:currentSeller.uid,

createdAt:serverTimestamp()

});

msg.style.color = "#0b7a75";
msg.textContent = "تم حفظ المنتج بنجاح ✅";

nameInput.value = "";
priceInput.value = "";
categoryInput.value = "";
imageInput.value = "";
descriptionInput.value = "";

}catch(error){

console.error(error);

msg.style.color = "red";
msg.textContent = "حدث خطأ أثناء حفظ المنتج";

}finally{

saveBtn.disabled = false;

}

});
