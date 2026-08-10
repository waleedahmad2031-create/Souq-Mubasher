
import { db } from "./firebase.js";

import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const productsBox = document.getElementById("products");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

window.productsData = {};


// ===============================
// تحميل المنتجات
// ===============================

function loadProducts() {

  productsBox.innerHTML = "جاري تحميل المنتجات...";

  onSnapshot(
    collection(db, "products"),

    (snap) => {

      productsBox.innerHTML = "";
      window.productsData = {};

      if (snap.empty) {

        productsBox.innerHTML =
          "<h2>لا توجد منتجات</h2>";

        return;
      }


      snap.forEach((productDoc) => {

        const data = productDoc.data();

        window.productsData[productDoc.id] = data;


        productsBox.innerHTML += `

        <div class="product">

          ${
            data.image
              ? `<img src="${data.image}" alt="${data.name || ""}">`
              : ""
          }

          <h3>
            ${data.name || "بدون اسم"}
          </h3>

          ${
            data.shopName
              ? `<p>🏪 التاجر: <b>${data.shopName}</b></p>`
              : ""
          }

          <p>
            💰 <b>${data.price || 0} ريال</b>
          </p>

          ${
            data.category
              ? `<p>📂 القسم: ${data.category}</p>`
              : ""
          }

          ${
            data.description
              ? `<p>${data.description}</p>`
              : ""
          }

          <button
            onclick="addToCart('${productDoc.id}')"
            style="
              background:#009688;
              color:white;
              border:none;
              padding:12px;
              border-radius:8px;
              font-size:16px;
              cursor:pointer;
              width:100%;
            "
          >
            🛒 أضف إلى السلة
          </button>

        </div>

        `;

      });

    },

    (error) => {

      console.error(error);

      productsBox.innerHTML =
        "<p>حدث خطأ أثناء تحميل المنتجات.</p>";

    }
  );
}


// ===============================
// إضافة المنتج للسلة
// ===============================

window.addToCart = function(id) {

  cart =
    JSON.parse(localStorage.getItem("cart")) || [];


  const product =
    window.productsData[id];


  if (!product) {

    alert("تعذر العثور على المنتج");

    return;
  }


  // البحث عن المنتج إذا كان موجودًا
  const existingItem =
    cart.find(item => item.id === id);


  if (existingItem) {

    // زيادة عدد الكراتين
    existingItem.quantity =
      Number(existingItem.quantity || 1) + 1;

  } else {

    // إضافة المنتج لأول مرة
    cart.push({

      id: id,

      name: product.name || "",

      price: Number(product.price || 0),

      image: product.image || "",

      city: product.city || "",

      description: product.description || "",

      shopName: product.shopName || "",

      quantity: 1

    });

  }


  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );


  updateCartCount();


  alert("✅ تمت إضافة الكرتون إلى السلة");

};


// ===============================
// عداد الكراتين في السلة
// ===============================

function updateCartCount() {

  const count =
    document.getElementById("cartCount");


  if (count) {

    const totalQuantity =
      cart.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 1),
        0
      );

    count.innerText =
      totalQuantity;

  }

}


// تشغيل
loadProducts();

updateCartCount();
