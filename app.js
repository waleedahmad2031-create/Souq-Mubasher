import { db } from "./firebase.js";

import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const productsBox =
  document.getElementById("products");

let cart =
  JSON.parse(localStorage.getItem("cart")) || [];

window.productsData = {};


// =====================================
// إعدادات المشاهدة
// =====================================

const VIEW_COOLDOWN =
  30 * 60 * 1000; // 30 دقيقة


// =====================================
// تسجيل مشاهدة المنتج
// =====================================

async function recordProductView(
  id,
  product
) {

  try {

    const key =
      "product_view_" + id;

    const lastView =
      Number(
        localStorage.getItem(key) || 0
      );

    const now =
      Date.now();


    // منع تكرار مشاهدة نفس المنتج
    // خلال 30 دقيقة
    if (
      lastView &&
      now - lastView < VIEW_COOLDOWN
    ) {

      return;

    }


    // حفظ وقت المشاهدة على الجهاز
    localStorage.setItem(
      key,
      String(now)
    );


    // تسجيل الحدث في Firebase
    await addDoc(
      collection(
        db,
        "productEvents"
      ),
      {

        type: "view",

        productId: id,

        productName:
          product.name || "",

        price:
          Number(
            product.price || 0
          ),

        shopName:
          product.shopName || "",

        createdAt:
          serverTimestamp()

      }
    );


    console.log(
      "تم تسجيل مشاهدة المنتج:",
      product.name
    );


  } catch (error) {

    // خطأ المشاهدة لا يؤثر
    // على عمل الموقع
    console.error(
      "تعذر تسجيل مشاهدة المنتج:",
      error
    );

  }

}


// =====================================
// تسجيل إضافة المنتج للسلة
// =====================================

async function recordCartEvent(
  id,
  product,
  quantity
) {

  try {

    await addDoc(
      collection(
        db,
        "productEvents"
      ),
      {

        type: "cart",

        productId: id,

        productName:
          product.name || "",

        price:
          Number(
            product.price || 0
          ),

        quantity:
          Number(quantity || 1),

        shopName:
          product.shopName || "",

        createdAt:
          serverTimestamp()

      }
    );


    console.log(
      "تم تسجيل إضافة المنتج للسلة:",
      product.name
    );


  } catch (error) {

    // فشل تسجيل الحدث لا يمنع
    // إضافة المنتج للسلة
    console.error(
      "تعذر تسجيل إضافة المنتج للسلة:",
      error
    );

  }

}


// =====================================
// مراقبة ظهور المنتجات
// =====================================

function observeProductViews() {

  const cards =
    document.querySelectorAll(
      ".product"
    );


  if (!cards.length) {

    return;

  }


  const observer =
    new IntersectionObserver(

      (entries, observer) => {

        entries.forEach(
          entry => {

            if (
              !entry.isIntersecting
            ) {

              return;

            }


            const card =
              entry.target;


            const productId =
              card.dataset.productId;


            if (!productId) {

              return;

            }


            const product =
              window.productsData[
                productId
              ];


            if (!product) {

              return;

            }


            recordProductView(
              productId,
              product
            );


            // لا نراقب نفس البطاقة
            // مرة ثانية أثناء هذا التحميل
            observer.unobserve(
              card
            );

          }
        );

      },

      {
        threshold: 0.5
      }

    );


  cards.forEach(
    card => {

      observer.observe(
        card
      );

    }
  );

}


// =====================================
// تحميل المنتجات
// =====================================

function loadProducts() {

  productsBox.innerHTML =
    "جاري تحميل المنتجات...";


  onSnapshot(

    collection(
      db,
      "products"
    ),

    (snap) => {

      productsBox.innerHTML =
        "";

      window.productsData =
        {};


      if (snap.empty) {

        productsBox.innerHTML = `
          <div style="
            grid-column:1/-1;
            background:white;
            padding:30px;
            border-radius:15px;
            text-align:center;
            color:#777;
          ">
            🛍️ لا توجد منتجات حاليًا
          </div>
        `;

        return;

      }


      snap.forEach(
        (productDoc) => {

          const data =
            productDoc.data();


          window.productsData[
            productDoc.id
          ] = data;


          productsBox.innerHTML += `

          <div
            class="product"
            data-product-id="${productDoc.id}"
          >

            ${
              data.image
                ? `
                  <img
                    src="${data.image}"
                    alt="${
                      data.name || "منتج"
                    }"
                    loading="lazy"
                  >
                `
                : `
                  <div style="
                    height:150px;
                    background:#f1f1f1;
                    border-radius:11px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:45px;
                  ">
                    🛍️
                  </div>
                `
            }


            <h3>
              ${
                data.name ||
                "بدون اسم"
              }
            </h3>


            ${
              data.category
                ? `
                  <div style="
                    display:inline-block;
                    background:#e8f5e9;
                    color:#00897b;
                    padding:4px 8px;
                    border-radius:20px;
                    font-size:11px;
                    margin-bottom:5px;
                  ">
                    📂 ${
                      data.category
                    }
                  </div>
                `
                : ""
            }


            <p style="
              margin:7px 0;
              color:#777;
              font-size:12px;
            ">

              ${
                data.shopName
                  ? `🏪 ${
                      data.shopName
                    }`
                  : "🛒 سوق مباشر"
              }

            </p>


            <div style="
              background:#f7fafa;
              padding:8px;
              border-radius:9px;
              margin-top:7px;
              text-align:center;
            ">

              <span style="
                color:#777;
                font-size:11px;
              ">
                السعر
              </span>

              <br>

              <b style="
                color:#00897b;
                font-size:18px;
              ">

                ${
                  Number(
                    data.price || 0
                  ).toLocaleString()
                }

                ريال

              </b>

            </div>


            ${
              data.description
                ? `
                  <p style="
                    font-size:11px;
                    color:#777;
                    line-height:1.6;
                    margin:8px 2px;
                  ">
                    ${
                      data.description
                    }
                  </p>
                `
                : ""
            }


            <button
              onclick="
                addToCart(
                  '${productDoc.id}'
                )
              "
              style="
                background:
                  linear-gradient(
                    135deg,
                    #009688,
                    #00796b
                  );
                color:white;
                border:none;
                padding:11px 6px;
                border-radius:10px;
                font-size:14px;
                font-weight:bold;
                cursor:pointer;
                width:100%;
                margin-top:7px;
              "
            >

              🛒 أضف للسلة

            </button>

          </div>

          `;

        }
      );


      // بدء مراقبة المشاهدات
      observeProductViews();

    },

    (error) => {

      console.error(
        error
      );


      productsBox.innerHTML = `
        <div style="
          grid-column:1/-1;
          background:white;
          padding:25px;
          border-radius:15px;
          text-align:center;
          color:#d32f2f;
        ">

          ⚠️ حدث خطأ أثناء
          تحميل المنتجات

        </div>
      `;

    }

  );

}


// =====================================
// إضافة المنتج للسلة
// =====================================

window.addToCart =
async function(id) {

  cart =
    JSON.parse(
      localStorage.getItem(
        "cart"
      )
    ) || [];


  const product =
    window.productsData[id];


  if (!product) {

    alert(
      "تعذر العثور على المنتج"
    );

    return;

  }


  // البحث عن المنتج
  // إذا كان موجودًا
  const existingItem =
    cart.find(
      item =>
        item.id === id
    );


  if (existingItem) {

    // زيادة الكمية
    existingItem.quantity =
      Number(
        existingItem.quantity || 1
      ) + 1;


  } else {

    // إضافة المنتج لأول مرة
    cart.push({

      id: id,

      name:
        product.name || "",

      price:
        Number(
          product.price || 0
        ),

      image:
        product.image || "",

      city:
        product.city || "",

      description:
        product.description || "",

      shopName:
        product.shopName || "",

      quantity: 1

    });

  }


  // حفظ السلة
  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );


  // تحديث العداد
  updateCartCount();


  // تسجيل حدث إضافة للسلة
  await recordCartEvent(
    id,
    product,
    existingItem
      ? existingItem.quantity
      : 1
  );


  alert(
    "✅ تمت إضافة الكرتون إلى السلة"
  );

};


// =====================================
// عداد الكراتين
// =====================================

function updateCartCount() {

  const count =
    document.getElementById(
      "cartCount"
    );


  if (count) {

    const totalQuantity =
      cart.reduce(

        (sum, item) =>
          sum +
          Number(
            item.quantity || 1
          ),

        0

      );


    count.innerText =
      totalQuantity;

  }

}


// =====================================
// تشغيل
// =====================================

loadProducts();

updateCartCount();
