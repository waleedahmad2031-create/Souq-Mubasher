import { db } from "./firebase.js";

import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const productsBox =
  document.getElementById("products");

const shopsBox =
  document.getElementById("shops");

const productsTitle =
  document.getElementById("productsTitle");


let cart =
  JSON.parse(localStorage.getItem("cart")) || [];


window.productsData = {};


// =====================================
// التاجر المختار
// =====================================

let selectedShop =
  localStorage.getItem("selectedShop") || "";


// =====================================
// إعدادات المشاهدة
// =====================================

const VIEW_COOLDOWN =
  30 * 60 * 1000;


// =====================================
// تسجيل مشاهدة المنتج
// =====================================

async function recordProductView(id, product) {

  try {

    const key =
      "product_view_" + id;

    const lastView =
      Number(
        localStorage.getItem(key) || 0
      );

    const now =
      Date.now();


    if (
      lastView &&
      now - lastView < VIEW_COOLDOWN
    ) {

      return;

    }


    localStorage.setItem(
      key,
      String(now)
    );


    await addDoc(
      collection(
        db,
        "productEvents"
      ),
      {

        type:"view",

        productId:
          String(id),

        productName:
          String(
            product.name || ""
          ),

        price:
          Number(
            product.price || 0
          ),

        category:
          String(
            product.category || ""
          ),

        shopName:
          String(
            product.shopName || ""
          ),

        createdAt:
          serverTimestamp()

      }
    );


  } catch(error){

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
){

  try{

    await addDoc(
      collection(
        db,
        "productEvents"
      ),
      {

        type:"cart",

        productId:
          String(id),

        productName:
          String(
            product.name || ""
          ),

        price:
          Number(
            product.price || 0
          ),

        quantity:
          Number(
            quantity || 1
          ),

        category:
          String(
            product.category || ""
          ),

        shopName:
          String(
            product.shopName || ""
          ),

        createdAt:
          serverTimestamp()

      }
    );


  }catch(error){

    console.error(
      "تعذر تسجيل إضافة المنتج للسلة:",
      error
    );

  }

}


// =====================================
// مراقبة المشاهدات
// =====================================

function observeProductViews(){

  const cards =
    document.querySelectorAll(
      ".product"
    );


  if(!cards.length){

    return;

  }


  const observer =
    new IntersectionObserver(

      (entries,observer)=>{

        entries.forEach(
          entry=>{

            if(!entry.isIntersecting){

              return;

            }


            const card =
              entry.target;


            const productId =
              card.dataset.productId;


            if(!productId){

              return;

            }


            const product =
              window.productsData[
                productId
              ];


            if(!product){

              return;

            }


            recordProductView(
              productId,
              product
            );


            observer.unobserve(
              card
            );

          }
        );

      },

      {
        threshold:0.5
      }

    );


  cards.forEach(
    card=>{

      observer.observe(
        card
      );

    }
  );

}


// =====================================
// عرض التجار
// =====================================

function showShops(){

  if(!shopsBox){

    return;

  }


  const shops = {};


  Object.keys(
    window.productsData
  ).forEach(id=>{

    const product =
      window.productsData[id];

    const shopName =
      String(
        product.shopName ||
        "سوق مباشر"
      ).trim();


    if(shopName){

      shops[shopName] = true;

    }

  });


  shopsBox.innerHTML = "";


  const shopNames =
    Object.keys(shops);


  if(!shopNames.length){

    shopsBox.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        color:#777;
        padding:15px;
      ">
        🏪 لا يوجد تجار حاليًا
      </div>
    `;

    return;

  }


  shopNames.forEach(
    shopName=>{

      const button =
        document.createElement("button");


      button.className =
        "shop-button";


      if(
        selectedShop === shopName
      ){

        button.classList.add(
          "selected"
        );

      }


      button.innerHTML = `
        🏪 ${shopName}

        <span>
          عرض المنتجات
        </span>
      `;


      button.onclick = ()=>{

        chooseShop(
          shopName
        );

      };


      shopsBox.appendChild(
        button
      );

    }
  );

}


// =====================================
// اختيار التاجر
// =====================================

function chooseShop(shopName){

  cart =
    JSON.parse(
      localStorage.getItem("cart")
    ) || [];


  if(
    cart.length > 0
  ){

    const cartShop =
      String(
        cart[0].shopName || ""
      );


    if(
      cartShop &&
      cartShop !== shopName
    ){

      alert(
        "⚠️ السلة تحتوي على منتجات من تاجر آخر.\n\n" +
        "أكمل الطلب الحالي أو أفرغ السلة أولًا."
      );

      return;

    }

  }


  selectedShop =
    shopName;


  localStorage.setItem(
    "selectedShop",
    shopName
  );


  showShops();


  showShopProducts(
    shopName
  );

}


// =====================================
// عرض منتجات التاجر
// =====================================

function showShopProducts(shopName){

  productsBox.innerHTML = "";


  if(productsTitle){

    productsTitle.innerHTML =
      `🏪 منتجات التاجر: ${shopName}`;

  }


  let found = false;


  Object.keys(
    window.productsData
  ).forEach(id=>{

    const data =
      window.productsData[id];


    const productShop =
      String(
        data.shopName ||
        "سوق مباشر"
      ).trim();


    if(
      productShop !== shopName
    ){

      return;

    }


    found = true;


    productsBox.innerHTML += `

      <div
        class="product"
        data-product-id="${id}"
      >

        ${
          data.image
          ?
          `
          <img
            src="${data.image}"
            alt="${data.name || "منتج"}"
            loading="lazy"
          >
          `
          :
          `
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
          ${data.name || "بدون اسم"}
        </h3>


        ${
          data.category
          ?
          `
          <div style="
            display:inline-block;
            background:#e8f5e9;
            color:#00897b;
            padding:4px 9px;
            border-radius:20px;
            font-size:11px;
            margin-bottom:5px;
          ">
            📂 ${data.category}
          </div>
          `
          :
          ""
        }


        <p style="
          margin:7px 0;
          color:#777;
          font-size:12px;
        ">

          🏪 ${productShop}

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

            ${Number(
              data.price || 0
            ).toLocaleString()}

            ريال

          </b>

        </div>


        ${
          data.description
          ?
          `
          <p style="
            font-size:11px;
            color:#777;
            line-height:1.6;
            margin:8px 2px;
          ">
            ${data.description}
          </p>
          `
          :
          ""
        }


        <button
          onclick="
            addToCart('${id}')
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

  });


  if(!found){

    productsBox.innerHTML = `
      <div style="
        grid-column:1/-1;
        background:white;
        padding:30px;
        border-radius:15px;
        text-align:center;
        color:#777;
      ">
        🛍️ لا توجد منتجات لهذا التاجر حاليًا
      </div>
    `;

  }


  observeProductViews();

}


// =====================================
// تحميل المنتجات
// =====================================

function loadProducts(){

  productsBox.innerHTML =
    "جاري تحميل المنتجات...";


  onSnapshot(

    collection(
      db,
      "products"
    ),

    snap=>{

      window.productsData = {};


      if(snap.empty){

        if(shopsBox){

          shopsBox.innerHTML =
            "🛍️ لا توجد منتجات حاليًا";

        }


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
        productDoc=>{

          window.productsData[
            productDoc.id
          ] =
            productDoc.data();

        }
      );


      // عرض التجار
      showShops();


      // إذا كان هناك تاجر محفوظ
      if(
        selectedShop &&
        Object.values(
          window.productsData
        ).some(
          product =>
            String(
              product.shopName ||
              "سوق مباشر"
            ).trim()
            ===
            selectedShop
        )
      ){

        showShopProducts(
          selectedShop
        );

      }else{

        selectedShop = "";

        localStorage.removeItem(
          "selectedShop"
        );


        productsBox.innerHTML = `
          <div style="
            grid-column:1/-1;
            background:white;
            padding:30px;
            border-radius:15px;
            text-align:center;
            color:#777;
          ">
            🏪 اختر تاجرًا بالأعلى لعرض منتجاته
          </div>
        `;

        if(productsTitle){

          productsTitle.innerHTML =
            "🛍️ اختر تاجرًا لعرض منتجاته";

        }

      }

    },

    error=>{

      console.error(error);


      productsBox.innerHTML = `
        <div style="
          grid-column:1/-1;
          background:white;
          padding:25px;
          border-radius:15px;
          text-align:center;
          color:#d32f2f;
        ">

          ⚠️ حدث خطأ أثناء تحميل المنتجات

          <br><br>

          ${error.message}

        </div>
      `;

    }

  );

}


// =====================================
// إضافة المنتج للسلة
// =====================================

window.addToCart =
async function(id){

  cart =
    JSON.parse(
      localStorage.getItem("cart")
    ) || [];


  const product =
    window.productsData[id];


  if(!product){

    alert(
      "تعذر العثور على المنتج"
    );

    return;

  }


  const productShop =
    String(
      product.shopName ||
      "سوق مباشر"
    ).trim();


  // ===================================
  // منع أكثر من تاجر في السلة
  // ===================================

  if(cart.length > 0){

    const cartShop =
      String(
        cart[0].shopName ||
        "سوق مباشر"
      ).trim();


    if(
      cartShop !== productShop
    ){

      alert(
        "⚠️ لا يمكن إضافة منتجات من تاجر آخر.\n\n" +
        "كل طلب يكون من تاجر واحد فقط."
      );

      return;

    }

  }


  // ===================================
  // تحديد التاجر
  // ===================================

  selectedShop =
    productShop;


  localStorage.setItem(
    "selectedShop",
    selectedShop
  );


  const existingItem =
    cart.find(
      item =>
        item.id === id
    );


  let quantity;


  if(existingItem){

    existingItem.quantity =
      Number(
        existingItem.quantity || 1
      ) + 1;


    quantity =
      existingItem.quantity;

  }else{

    quantity = 1;


    cart.push({

      id:id,

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
        productShop,

      category:
        product.category || "",

      quantity:1

    });

  }


  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );


  updateCartCount();


  await recordCartEvent(
    id,
    product,
    quantity
  );


  alert(
    "✅ تمت إضافة الكرتون إلى السلة"
  );

};


// =====================================
// عداد السلة
// =====================================

function updateCartCount(){

  const count =
    document.getElementById(
      "cartCount"
    );


  if(count){

    const totalQuantity =
      cart.reduce(

        (sum,item)=>
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
// التشغيل
// =====================================

loadProducts();

updateCartCount();
