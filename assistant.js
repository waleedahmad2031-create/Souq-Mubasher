import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================
   عناصر الصفحة
========================================= */

const chat =
  document.getElementById("chat");

const messageInput =
  document.getElementById("messageInput");

const sendButton =
  document.getElementById("sendButton");


/* =========================================
   المنتجات
========================================= */

let products = [];


/* =========================================
   حالة المساعد
========================================= */

window.currentAssistantOrder = null;

let assistantStep = "shop";

let selectedShop =
  localStorage.getItem("selectedShop") || "";


let customerData = {

  name: "",
  phone: "",
  district: ""

};


/* =========================================
   تحميل المنتجات
========================================= */

async function loadProducts() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "products")
      );


    products = [];


    snapshot.forEach(doc => {

      const data =
        doc.data();


      products.push({

        id: doc.id,

        name:
          data.name ||
          data.اسم ||
          "منتج",

        price:
          Number(
            data.price ??
            data.سعر ??
            0
          ),

        category:
          data.category ||
          data.القسم ||
          "",

        city:
          data.city ||
          data.مدينة ||
          "",

        image:
          data.image ||
          data.صورة ||
          "",

        description:
          data.description ||
          data.الوصف ||
          "",

        sellerId:
          data.sellerId ||
          "",

        shopName:
          data.shopName ||
          data.اسم_المتجر ||
          ""

      });

    });


    if (!products.length) {

      addBotMessage(
        "⚠️ لا توجد منتجات حاليًا."
      );

      return;

    }


    /* =====================================
       التاجر المحفوظ
    ===================================== */

    if (selectedShop) {

      const shopExists =
        products.some(
          product =>
            String(product.shopName || "").trim() ===
            selectedShop
        );


      if (shopExists) {

        addBotMessage(

          "🤖 أهلًا بك في سوق مباشر 🌹<br><br>" +

          "🏪 التاجر المحدد حاليًا:<br>" +

          "<strong>" +
          escapeHtml(selectedShop) +
          "</strong><br><br>" +

          "اكتب اسم المنتج والكمية التي تريدها.<br><br>" +

          "مثال:<br>" +

          "دقيق قمح 10 وماء شملان 2"

        );


        assistantStep =
          "product";

        return;

      }

    }


    showShopSelection();


  } catch (error) {

    console.error(
      "خطأ تحميل المنتجات:",
      error
    );


    addBotMessage(

      "❌ حدث خطأ أثناء تحميل المنتجات.<br><br>" +

      escapeHtml(
        error.message ||
        String(error)
      )

    );

  }

}


/* =========================================
   عرض التجار
========================================= */

function showShopSelection() {

  const shops = {};


  products.forEach(product => {

    const shopName =
      String(
        product.shopName ||
        "سوق مباشر"
      ).trim();


    if (shopName) {

      shops[shopName] = true;

    }

  });


  const shopNames =
    Object.keys(shops);


  if (!shopNames.length) {

    addBotMessage(
      "⚠️ لا توجد أسماء تجار في المنتجات حاليًا."
    );

    return;

  }


  let html =

    "🤖 أهلًا بك في سوق مباشر 🌹<br><br>" +

    "<strong>🏪 أولًا اختر التاجر الذي تريد الشراء منه:</strong><br><br>";


  shopNames.forEach(shopName => {

    html += `

      <button
        class="assistant-shop-button"
        data-shop="${escapeHtml(shopName)}"
        style="
          display:block;
          width:100%;
          margin:8px 0;
          padding:13px;
          border:none;
          border-radius:12px;
          background:linear-gradient(
            135deg,
            #009688,
            #00796b
          );
          color:white;
          font-size:15px;
          font-weight:bold;
          cursor:pointer;
        "
      >
        🏪 ${escapeHtml(shopName)}
      </button>

    `;

  });


  addBotMessage(html);


  const buttons =
    document.querySelectorAll(
      ".assistant-shop-button"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        chooseAssistantShop(
          button.dataset.shop
        );

      }
    );

  });

}


/* =========================================
   اختيار التاجر
========================================= */

function chooseAssistantShop(shopName) {

  const cart =
    JSON.parse(
      localStorage.getItem("cart")
    ) || [];


  if (cart.length > 0) {

    const cartShop =
      String(
        cart[0].shopName ||
        ""
      ).trim();


    if (
      cartShop &&
      cartShop !== shopName
    ) {

      addBotMessage(

        "⚠️ السلة تحتوي حاليًا على منتجات من:<br><br>" +

        "<strong>" +
        escapeHtml(cartShop) +
        "</strong><br><br>" +

        "لا يمكن إنشاء طلب من تاجر آخر في نفس السلة.<br>" +

        "أكمل الطلب الحالي أو أفرغ السلة أولًا."

      );

      return;

    }

  }


  selectedShop =
    shopName;


  localStorage.setItem(
    "selectedShop",
    selectedShop
  );


  assistantStep =
    "product";


  addBotMessage(

    "✅ تم اختيار التاجر:<br><br>" +

    "🏪 <strong>" +
    escapeHtml(selectedShop) +
    "</strong><br><br>" +

    "الآن اكتب المنتجات والكميات.<br><br>" +

    "مثال:<br>" +

    "دقيق قمح 10 وماء شملان 2"

  );

}


/* =========================================
   رسالة المساعد
========================================= */

function addBotMessage(text) {

  const div =
    document.createElement("div");


  div.className =
    "message bot";


  div.innerHTML =
    text;


  chat.appendChild(div);


  scrollChat();

}


/* =========================================
   رسالة العميل
========================================= */

function addUserMessage(text) {

  const div =
    document.createElement("div");


  div.className =
    "message user";


  div.textContent =
    text;


  chat.appendChild(div);


  scrollChat();

}


/* =========================================
   النزول لآخر المحادثة
========================================= */

function scrollChat() {

  window.scrollTo({

    top:
      document.body.scrollHeight,

    behavior:
      "smooth"

  });

}


/* =========================================
   تطبيع العربي
========================================= */

function normalizeArabic(text) {

  return String(text || "")

    .toLowerCase()

    .replace(
      /[إأآ]/g,
      "ا"
    )

    .replace(
      /ة/g,
      "ه"
    )

    .replace(
      /ى/g,
      "ي"
    )

    .replace(
      /ؤ/g,
      "و"
    )

    .replace(
      /ئ/g,
      "ي"
    )

    .replace(
      /[ًٌٍَُِّْـ]/g,
      ""
    )

    .trim();

}


/* =========================================
   التوصيل لكل كرتون
========================================= */

function getDeliveryPerCarton(price) {

  price =
    Number(price || 0);


  if (price < 1500) {

    return 50;

  }


  if (price < 2000) {

    return 70;

  }


  return 100;

}


/* =========================================
   البحث عن المنتجات
========================================= */

function findProducts(text) {

  const normalizedText =
    normalizeArabic(text);


  const shopProducts =
    products.filter(product => {

      const productShop =
        String(
          product.shopName ||
          "سوق مباشر"
        ).trim();


      return (
        productShop ===
        selectedShop
      );

    });


  const results = [];


  shopProducts.forEach(product => {

    const productName =
      normalizeArabic(
        product.name
      );


    if (!productName) {

      return;

    }


    let score = 0;


    /* الاسم كامل */
    if (
      normalizedText.includes(
        productName
      )
    ) {

      score += 100;

    }


    /* كلمات الاسم */
    const productWords =
      productName
        .split(/\s+/)
        .filter(
          word =>
            word.length >= 2
        );


    productWords.forEach(word => {

      if (
        normalizedText.includes(
          word
        )
      ) {

        score += 10;

      }

    });


    if (score > 0) {

      results.push({

        product,
        score

      });

    }

  });


  results.sort(
    (a,b) =>
      b.score - a.score
  );


  return results.map(
    item =>
      item.product
  );

}


/* =========================================
   استخراج الكمية
========================================= */

function extractQuantity(
  text,
  product
) {

  const normalizedText =
    normalizeArabic(text);


  const productName =
    normalizeArabic(
      product.name
    );


  const index =
    normalizedText.indexOf(
      productName
    );


  if (index === -1) {

    return 1;

  }


  const afterProduct =
    normalizedText.substring(
      index + productName.length,
      index + productName.length + 20
    );


  const match =
    afterProduct.match(
      /\d+/
    );


  if (!match) {

    return 1;

  }


  const quantity =
    Number(
      match[0]
    );


  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {

    return 1;

  }


  return quantity;

}


/* =========================================
   معالجة الرسالة
========================================= */

async function processMessage(text) {

  const cleanText =
    String(text || "").trim();


  if (!cleanText) {

    return;

  }


  addUserMessage(
    cleanText
  );


  const lower =
    normalizeArabic(
      cleanText
    );


  /* =====================================
     لم يتم اختيار تاجر
  ===================================== */

  if (
    !selectedShop ||
    assistantStep === "shop"
  ) {

    showShopSelection();

    return;

  }


  /* =====================================
     تحية
  ===================================== */

  if (
    lower === "السلام عليكم" ||
    lower === "سلام" ||
    lower.includes("مرحبا") ||
    lower.includes("هلا")
  ) {

    addBotMessage(

      "وعليكم السلام ورحمة الله وبركاته 🌹<br><br>" +

      "🏪 التاجر المختار:<br>" +

      "<strong>" +
      escapeHtml(selectedShop) +
      "</strong><br><br>" +

      "اكتب اسم المنتج والكمية."

    );

    return;

  }


  /* =====================================
     تغيير التاجر
  ===================================== */

  if (
    lower.includes("غير التاجر") ||
    lower.includes("غير تاجر") ||
    lower.includes("تاجر اخر") ||
    lower.includes("تاجر ثاني")
  ) {

    const cart =
      JSON.parse(
        localStorage.getItem("cart")
      ) || [];


    if (cart.length > 0) {

      addBotMessage(

        "⚠️ السلة تحتوي على منتجات من:<br><br>" +

        "<strong>" +

        escapeHtml(
          cart[0].shopName || ""
        ) +

        "</strong><br><br>" +

        "أكمل الطلب الحالي أو أفرغ السلة أولًا."

      );

      return;

    }


    selectedShop = "";

    localStorage.removeItem(
      "selectedShop"
    );


    assistantStep =
      "shop";


    showShopSelection();

    return;

  }


  /* =====================================
     البحث
  ===================================== */

  const found =
    findProducts(
      cleanText
    );


  if (!found.length) {

    addBotMessage(

      "❌ لم أجد المنتج عند التاجر:<br><br>" +

      "🏪 <strong>" +

      escapeHtml(
        selectedShop
      ) +

      "</strong><br><br>" +

      "اكتب اسم المنتج بشكل أوضح."

    );

    return;

  }


  /* =====================================
     تجهيز المنتجات
  ===================================== */

  const selectedProducts =
    found.map(product => {

      const quantity =
        extractQuantity(
          cleanText,
          product
        );


      const subtotal =
        Number(product.price) *
        quantity;


      const deliveryPerCarton =
        getDeliveryPerCarton(
          product.price
        );


      const deliveryTotal =
        deliveryPerCarton *
        quantity;


      return {

        product,

        quantity,

        subtotal,

        deliveryPerCarton,

        deliveryTotal

      };

    });


  /* =====================================
     منع المنتجات المكررة
  ===================================== */

  const uniqueProducts = [];


  selectedProducts.forEach(item => {

    const exists =
      uniqueProducts.some(
        old =>
          old.product.id ===
          item.product.id
      );


    if (!exists) {

      uniqueProducts.push(item);

    }

  });


  /* =====================================
     عرض النتائج
  ===================================== */

  let html =

    "وجدت لك المنتجات التالية 👇<br><br>";


  let productsTotal = 0;

  let deliveryTotal = 0;


  uniqueProducts.forEach(
    (item,index) => {

      const product =
        item.product;


      productsTotal +=
        item.subtotal;


      deliveryTotal +=
        item.deliveryTotal;


      html += `

        <div style="
          background:#f5f5f5;
          padding:13px;
          margin:8px 0;
          border-radius:10px;
          line-height:1.9;
        ">

          <strong>
            ${index + 1}.
            ${escapeHtml(product.name)}
          </strong>

          <br>

          💰 سعر الكرتون:
          ${Number(product.price).toLocaleString()}
          ريال

          <br>

          📦 الكمية:
          ${item.quantity}
          كرتون

          <br>

          🚚 التوصيل:
          ${item.deliveryPerCarton}
          × ${item.quantity}
          =
          ${item.deliveryTotal.toLocaleString()}
          ريال

          <br>

          💵 مجموع المنتج:
          ${item.subtotal.toLocaleString()}
          ريال

        </div>

      `;

    });


  const finalTotal =
    productsTotal +
    deliveryTotal;


  html += `

    <hr>

    🛍️ مجموع المنتجات:
    <strong>
      ${productsTotal.toLocaleString()}
      ريال
    </strong>

    <br>

    🚚 مجموع التوصيل:
    <strong>
      ${deliveryTotal.toLocaleString()}
      ريال
    </strong>

    <br>

    💰 الإجمالي النهائي:
    <strong style="font-size:18px;">
      ${finalTotal.toLocaleString()}
      ريال
    </strong>

    <br><br>

    اضغط لتأكيد جميع المنتجات 👇

    <br><br>

    <button
      class="assistant-order-button"
      style="
        width:100%;
        padding:14px;
        border:none;
        border-radius:12px;
        background:#009688;
        color:white;
        font-size:16px;
        font-weight:bold;
        cursor:pointer;
      "
    >
      🛒 تأكيد طلب جميع المنتجات
    </button>

  `;


  addBotMessage(
    html
  );


  const buttons =
    document.querySelectorAll(
      ".assistant-order-button"
    );


  const button =
    buttons[
      buttons.length - 1
    ];


  if (button) {

    button.addEventListener(
      "click",
      () => {

        prepareOrder(
          uniqueProducts
        );

      }
    );

  }

}


/* =========================================
   تجهيز الطلب
========================================= */

function prepareOrder(
  selectedProducts
) {

  if (
    !selectedProducts ||
    !selectedProducts.length
  ) {

    addBotMessage(
      "⚠️ لم يتم اختيار أي منتج."
    );

    return;

  }


  const productShop =
    String(
      selectedProducts[0].product.shopName ||
      "سوق مباشر"
    ).trim();


  /* =====================================
     التأكد من التاجر
  ===================================== */

  const differentShop =
    selectedProducts.find(item => {

      return String(
        item.product.shopName ||
        "سوق مباشر"
      ).trim() !==
      productShop;

    });


  if (differentShop) {

    addBotMessage(
      "⚠️ المنتجات المختارة ليست من نفس التاجر."
    );

    return;

  }


  /* =====================================
     فحص السلة
  ===================================== */

  const cart =
    JSON.parse(
      localStorage.getItem("cart")
    ) || [];


  if (cart.length > 0) {

    const cartShop =
      String(
        cart[0].shopName ||
        ""
      ).trim();


    if (
      cartShop &&
      cartShop !== productShop
    ) {

      addBotMessage(

        "⚠️ السلة تحتوي على منتجات من تاجر آخر.<br><br>" +

        "أكمل الطلب الحالي أو أفرغ السلة أولًا."

      );

      return;

    }

  }


  /* =====================================
     تجهيز المنتجات
  ===================================== */

  const orderProducts =
    selectedProducts.map(item => {

      const product =
        item.product;


      return {

        productId:
          product.id,

        name:
          product.name,

        price:
          Number(product.price),

        quantity:
          Number(item.quantity),

        category:
          product.category || "",

        sellerId:
          product.sellerId || "",

        shopName:
          product.shopName || productShop,

        deliveryPerCarton:
          Number(
            item.deliveryPerCarton
          ),

        deliveryTotal:
          Number(
            item.deliveryTotal
          ),

        subtotal:
          Number(
            item.subtotal
          )

      };

    });


  const productsTotal =
    orderProducts.reduce(
      (sum,item) =>
        sum + item.subtotal,
      0
    );


  const deliveryTotal =
    orderProducts.reduce(
      (sum,item) =>
        sum + item.deliveryTotal,
      0
    );


  const finalTotal =
    productsTotal +
    deliveryTotal;


  /* =====================================
     حفظ الطلب المؤقت
  ===================================== */

  window.currentAssistantOrder = {

    products:
      orderProducts,

    shopName:
      productShop,

    sellerId:
      orderProducts[0].sellerId || "",

    productsTotal:
      productsTotal,

    deliveryTotal:
      deliveryTotal,

    total:
      finalTotal

  };


  customerData = {

    name: "",
    phone: "",
    district: ""

  };


  assistantStep =
    "name";


  /* =====================================
     رسالة التأكيد
  ===================================== */

  let html =

    "ممتاز 👍<br><br>" +

    "🏪 التاجر:<br>" +

    "<strong>" +
    escapeHtml(productShop) +
    "</strong><br><br>" +

    "🛒 المنتجات:<br>";


  orderProducts.forEach(
    (item,index) => {

      html +=

        `${index + 1}. ` +

        escapeHtml(item.name) +

        " — " +

        item.quantity +

        " كرتون<br>";

    }
  );


  html +=

    "<br>🛍️ مجموع المنتجات: <strong>" +

    productsTotal.toLocaleString() +

    " ريال</strong><br>" +

    "🚚 رسوم التوصيل: <strong>" +

    deliveryTotal.toLocaleString() +

    " ريال</strong><br>" +

    "💰 الإجمالي النهائي: <strong>" +

    finalTotal.toLocaleString() +

    " ريال</strong><br><br>" +

    "👤 ما اسم العميل؟";


  addBotMessage(
    html
  );

}


/* =========================================
   بيانات العميل
========================================= */

async function processCustomerStep(
  text
) {

  const cleanText =
    String(text || "").trim();


  if (!cleanText) {

    return;

  }


  /* =====================================
     الاسم
  ===================================== */

  if (
    assistantStep === "name"
  ) {

    customerData.name =
      cleanText;


    assistantStep =
      "phone";


    addUserMessage(
      cleanText
    );


    addBotMessage(

      "أهلًا " +

      escapeHtml(
        customerData.name
      ) +

      " 🌹<br><br>" +

      "📱 الآن اكتب رقم الجوال."

    );


    return;

  }


  /* =====================================
     الجوال
  ===================================== */

  if (
    assistantStep === "phone"
  ) {

    const phone =
      cleanText.replace(
        /[\s-]/g,
        ""
      );


    if (
      phone.length < 7
    ) {

      addUserMessage(
        cleanText
      );


      addBotMessage(

        "📱 يبدو أن رقم الجوال غير صحيح.<br><br>" +

        "اكتب رقم الجوال مرة أخرى."

      );

      return;

    }


    customerData.phone =
      cleanText;


    assistantStep =
      "district";


    addUserMessage(
      cleanText
    );


    addBotMessage(

      "تمام 👍<br><br>" +

      "📍 الآن اكتب اسم الحي."

    );


    return;

  }


  /* =====================================
     الحي
  ===================================== */

  if (
    assistantStep === "district"
  ) {

    customerData.district =
      cleanText;


    addUserMessage(
      cleanText
    );


    addBotMessage(
      "⏳ جاري تسجيل طلبك..."
    );


    await saveAssistantOrder();

    return;

  }

}


/* =========================================
   حفظ الطلب
========================================= */

async function saveAssistantOrder() {

  const order =
    window.currentAssistantOrder;


  if (
    !order ||
    !order.products ||
    !order.products.length
  ) {

    addBotMessage(
      "⚠️ لم يتم اختيار المنتجات."
    );

    assistantStep =
      "product";

    return;

  }


  try {

    /* =====================================
       بيانات الطلب
    ===================================== */

    const orderData = {

      customerName:
        customerData.name,

      customerPhone:
        customerData.phone,

      customerCity:
        "إب",

      customerAddress:
        customerData.district,

      deliveryArea:
        customerData.district,

      orderType:
        "طلب بواسطة المساعد الذكي",

      deliveryTime:
        "بعد تجهيز الطلب والتواصل مع العميل",

      deliveryFee:
        Number(order.deliveryTotal),

      cartonsTotal:
        order.products.reduce(
          (sum,item) =>
            sum + Number(item.quantity),
          0
        ),

      shopName:
        order.shopName,

      sellerId:
        order.sellerId || "",


      /* ===================================
         المنتجات
      =================================== */

      products:
        order.products.map(product => ({

          id:
            product.productId,

          name:
            product.name,

          price:
            Number(product.price),

          quantity:
            Number(product.quantity),

          category:
            product.category || "",

          sellerId:
            product.sellerId || "",

          shopName:
            product.shopName,

          deliveryPerCarton:
            Number(
              product.deliveryPerCarton
            ),

          deliveryTotal:
            Number(
              product.deliveryTotal
            ),

          subtotal:
            Number(
              product.subtotal
            )

        })),


      productsTotal:
        Number(order.productsTotal),

      deliveryTotal:
        Number(order.deliveryTotal),

      total:
        Number(order.total),

      status:
        "جديد",

      source:
        "طلب بواسطة المساعد الذكي",

      assistantOrder:
        true,

      createdAt:
        serverTimestamp()

    };


    /* =====================================
       حفظ Firebase
    ===================================== */

    const orderRef =
      await addDoc(

        collection(
          db,
          "orders"
        ),

        orderData

      );


    console.log(
      "✅ تم حفظ طلب المساعد:",
      orderRef.id
    );


    /* =====================================
       تجهيز منتجات واتساب
    ===================================== */

    let productsText = "";


    order.products.forEach(
      (product,index) => {

        productsText +=

`${index + 1}. ${product.name}
📦 الكمية: ${product.quantity} كرتون
💰 سعر الكرتون: ${Number(product.price).toLocaleString()} ريال
💵 مجموع المنتج: ${Number(product.subtotal).toLocaleString()} ريال
🚚 التوصيل: ${Number(product.deliveryTotal).toLocaleString()} ريال

`;

      }
    );


    /* =====================================
       رسالة واتساب
    ===================================== */

    const whatsappMessage =

`🛒 طلب جديد بواسطة المساعد الذكي - سوق مباشر

🏪 التاجر:
${order.shopName}

👤 اسم العميل:
${customerData.name}

📱 رقم الجوال:
${customerData.phone}

📍 المدينة:
إب

🏘️ الحي:
${customerData.district}

━━━━━━━━━━━━

📦 المنتجات:

${productsText}

━━━━━━━━━━━━

🛍️ مجموع المنتجات:
${Number(order.productsTotal).toLocaleString()} ريال

🚚 رسوم التوصيل:
${Number(order.deliveryTotal).toLocaleString()} ريال

💰 الإجمالي النهائي:
${Number(order.total).toLocaleString()} ريال

━━━━━━━━━━━━

🤖 مصدر الطلب:
المساعد الذكي

🆔 رقم الطلب:
${orderRef.id}`;


    /* =====================================
       واتساب الإدارة
    ===================================== */

    const whatsappUrl =

      `https://wa.me/966550496391?text=` +

      encodeURIComponent(
        whatsappMessage
      );


    window.open(
      whatsappUrl,
      "_blank"
    );


    /* =====================================
       رسالة النجاح
    ===================================== */

    let successProducts = "";


    order.products.forEach(
      product => {

        successProducts +=

          "📦 " +

          escapeHtml(
            product.name
          ) +

          " — " +

          product.quantity +

          " كرتون<br>";

      }
    );


    addBotMessage(

      "✅ تم تسجيل طلبك بنجاح.<br><br>" +

      "🏪 التاجر: " +

      escapeHtml(
        order.shopName
      ) +

      "<br><br>" +

      "🛒 المنتجات:<br>" +

      successProducts +

      "<br>" +

      "🛍️ مجموع المنتجات: " +

      Number(
        order.productsTotal
      ).toLocaleString() +

      " ريال<br>" +

      "🚚 التوصيل: " +

      Number(
        order.deliveryTotal
      ).toLocaleString() +

      " ريال<br>" +

      "💰 الإجمالي النهائي: " +

      Number(
        order.total
      ).toLocaleString() +

      " ريال<br><br>" +

      "📱 تم إرسال تفاصيل الطلب للإدارة عبر واتساب.<br><br>" +

      "🆔 رقم الطلب:<br>" +

      escapeHtml(
        orderRef.id
      ) +

      "<br><br>" +

      "سيتم التواصل معك لتأكيد الطلب."

    );


    /* =====================================
       تنظيف
    ===================================== */

    window.currentAssistantOrder =
      null;


    assistantStep =
      "product";


    customerData = {

      name: "",
      phone: "",
      district: ""

    };


  } catch (error) {

    console.error(
      "❌ خطأ حفظ طلب المساعد:",
      error
    );


    addBotMessage(

      "❌ تعذر تسجيل الطلب.<br><br>" +

      escapeHtml(
        error.message ||
        String(error)
      )

    );

  }

}


/* =========================================
   زر الإرسال
========================================= */

async function sendMessage() {

  const text =
    messageInput.value.trim();


  if (!text) {

    return;

  }


  messageInput.value = "";


  /* =====================================
     بيانات العميل
  ===================================== */

  if (
    assistantStep === "name" ||
    assistantStep === "phone" ||
    assistantStep === "district"
  ) {

    await processCustomerStep(
      text
    );

    return;

  }


  /* =====================================
     اختيار التاجر
  ===================================== */

  if (
    assistantStep === "shop"
  ) {

    addUserMessage(
      text
    );


    addBotMessage(

      "من فضلك اختر التاجر من الأزرار الموجودة بالأعلى 🏪"

    );


    return;

  }


  /* =====================================
     المنتج
  ===================================== */

  await processMessage(
    text
  );

}


/* =========================================
   الأحداث
========================================= */

if (sendButton) {

  sendButton.addEventListener(
    "click",
    sendMessage
  );

}


if (messageInput) {

  messageInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        sendMessage();

      }

    }
  );

}


/* =========================================
   حماية HTML
========================================= */

function escapeHtml(text) {

  return String(
    text ?? ""
  )

  .replace(
    /&/g,
    "&amp;"
  )

  .replace(
    /</g,
    "&lt;"
  )

  .replace(
    />/g,
    "&gt;"
  )

  .replace(
    /"/g,
    "&quot;"
  )

  .replace(
    /'/g,
    "&#039;"
  );

}


/* =========================================
   تشغيل المساعد
========================================= */

loadProducts();
