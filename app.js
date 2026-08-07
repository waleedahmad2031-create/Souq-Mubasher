import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const productsBox = document.getElementById("products");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

async function loadProducts(){

productsBox.innerHTML="";

const snap = await getDocs(collection(db,"products"));

if(snap.empty){

productsBox.innerHTML="<h2>لا توجد منتجات</h2>";

return;

}

snap.forEach(doc=>{

const data=doc.data();

productsBox.innerHTML += `

<div class="product">

<img src="${data.image||''}" alt="">

<h3>${data.name||''}</h3>

<p><b>${data.price||0} ريال</b></p>

<p>${data.description||''}</p>

<button onclick="addToCart('${doc.id}')">
🛒 أضف إلى السلة
</button>

</div>

`;

});

window.productsData = {};

snap.forEach(doc=>{
window.productsData[doc.id]=doc.data();
});



  
}

window.addToCart = function(id){

const product = window.productsData[id];

if(!product){

alert("تعذر العثور على المنتج");

return;

}

cart.push({

id:id,

name:product.name || "",

price:Number(product.price || 0),

image:product.image || "",

city:product.city || "",

description:product.description || ""

});

localStorage.setItem("cart",JSON.stringify(cart));

alert("✅ تمت إضافة المنتج إلى السلة");

};

function updateCartCount(){

const count = cart.length;

document.title = `(${count}) المتجر`;

}

loadProducts();

updateCartCount();
