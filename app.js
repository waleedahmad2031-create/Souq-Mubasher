import { db } from "./firebase.js";

import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const productsBox = document.getElementById("products");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

window.productsData = {};


// ===============================
// تحميل المنتجات بشكل مباشر
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
// إضافة للسلة
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


  cart.push({

    id: id,

    name: product.name || "",

    price: Number(product.price || 0),

    image: product.image || "",

    city: product.city || "",

    description: product.description || "",

    shopName: product.shopName || ""

  });


  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );


  const count =
    document.getElementById("cartCount");


  if (count) {

    count.innerText =
      cart.length;

  }


  alert("✅ تمت إضافة المنتج إلى السلة");

};


// ===============================
// عداد السلة
// ===============================

function updateCartCount() {

  const count =
    document.getElementById("cartCount");


  if (count) {

    count.innerText =
      cart.length;

  }

}


// تشغيل
loadProducts();

updateCartCount();
