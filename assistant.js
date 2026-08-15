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
   تحويل الأرقام العربية
========================================= */

function convertArabicNumbers(text) {

  return String(text || "")

    .replace(/٠/g, "0")
    .replace(/١/g, "1")
    .replace(/٢/g, "2")
    .replace(/٣/g, "3")
    .replace(/٤/g, "4")
    .replace(/٥/g, "5")
    .replace(/٦/g, "6")
    .replace(/٧/g, "7")
    .replace(/٨/g, "8")
    .replace(/٩/g, "9");

}


/* =========================================
   تطبيع العربي
========================================= */

function normalizeArabic(text) {

  return convertArabicNumbers(text)

    .toLowerCase()

    .replace(/[إأآ]/g, "ا")

    .replace(/ة/g, "ه")

    .replace(/ى/g, "ي")

    .replace(/ؤ/g, "و")

    .replace(/ئ/g, "ي")

    .replace(/[ًٌٍَُِّْـ]/g, "")

    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, " ")

    .replace(/\s+/g, " ")

    .trim();

}


/* =========================================
   كلمات لا نعتبرها اسم منتج
========================================= */

const ignoredWords = new Set([

  "اريد",
  "ابغى",
  "اشتي",
  "بغيت",
  "ارغب",
  "احتاج",
  "اريدلي",
  "جيب",
  "هات",
  "لي",
  "من",
  "عند",
  "التاجر",
  "منتج",
  "منتجات",
  "طلب",
  "اطلب",
  "شراء",
  "كرتون",
  "كرتونات",
  "كرتونه",
  "كم",
  "عدد",
  "واحد",
  "واحده",
  "اثنين",
  "ثلاثه",
  "اربعه",
  "خمسه",
  "سته",
  "سبعه",
  "ثمانيه",
  "تسعه",
  "عشره",
  "ريال",
  "بالريال",
  "السلام",
  "عليكم",
  "مرحبا",
  "هلا",
  "لو",
  "سمحت"

]);


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

        id:
          doc.id,

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
       تاجر محفوظ
    ===================================== */

    if (selectedShop) {

      const shopExists =
        products.some(
          product =>
            normalizeArabic(product.shopName) ===
            normalizeArabic(selectedShop)
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

          "دقيق قمح 10"

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
          padding:14px;
          border:none;
          border-radius:12px;
          background:linear-gradient(135deg,#009688,#00796b);
          color:white;
          font-size:16px;
          font-weight:bold;
          cursor:pointer;
        "
      >
        🏪 ${escapeHtml(shopName)}
      </button>

    `;

  });


  addBotMessage(html);


  document
    .querySelectorAll(
      ".assistant-shop-button"
    )
    .forEach(button => {

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
      normalizeArabic(cartShop) !==
      normalizeArabic(shopName)
    ) {

      addBotMessage(

        "⚠️ السلة تحتوي حاليًا على منتجات من:<br><br>" +

        "<strong>" +
        escapeHtml(cartShop) +
        "</strong><br><br>" +

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

    "الآن اكتب اسم المنتج والكمية التي تريدها.<br><br>" +

    "مثال:<br>" +

    "دقيق قمح 10"

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
   استخراج الكلمات المهمة
========================================= */

function getImportantWords(text) {

  return normalizeArabic(text)

    .split(/\s+/)

    .filter(word => {

      if (!word) {
        return false;
      }

      if (ignoredWords.has(word)) {
        return false;
      }

      if (/^\d+$/.test(word)) {
        return false;
      }

      return word.length >= 2;

    });

}


/* =========================================
   البحث الذكي عن المنتجات
========================================= */

function findProducts(text) {

  const words =
    getImportantWords(text);


  if (!words.length) {

    return [];

  }


  const shopProducts =
    products.filter(product => {

      return normalizeArabic(
        product.shopName || "سوق مباشر"
      ) === normalizeArabic(
        selectedShop || "سوق مباشر"
      );

    });


  return shopProducts

    .map(product => {

      const productName =
        normalizeArabic(
          product.name
        );


      const productWords =
        productName.split(/\s+/);


      let score = 0;


      words.forEach(word => {

        /* تطابق كامل */

        if (
          productWords.includes(word)
        ) {

          score += 5;

        }


        /* الكلمة موجودة داخل اسم المنتج */

        else if (
          productName.includes(word)
        ) {

          score += 3;

        }


        /* بداية الكلمة */

        else if (
          productWords.some(
            productWord =>
              productWord.startsWith(word)
          )
        ) {

          score += 2;

        }

      });


      /* تطابق الاسم كاملًا */

      const normalizedText =
        normalizeArabic(text);


      if (
        normalizedText.includes(
          productName
        )
      ) {

        score += 10;

      }


      return {

        product,
        score

      };

    })

    .filter(
      item =>
        item.score > 0
    )

    .sort(
      (a, b) =>
        b.score - a.score
    )

    .map(
      item =>
        item.product
    );

}


/* =========================================
   استخراج الكمية
========================================= */

function extractQuantity(text) {

  const normalized =
    convertArabicNumbers(text);


  const match =
    normalized.match(
      /\d+(?:\.\d+)?/
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


  return Math.floor(quantity);

}


/* =========================================
   رسوم التوصيل
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
   معالجة رسالة المنتج
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

  if (!selectedShop) {

    assistantStep =
      "shop";

    showShopSelection();

    return;

  }


  /* =====================================
     تحية
  ===================================== */

  if (

    lower === "سلام" ||

    lower.includes("مرحبا") ||

    lower.includes("هلا") ||

    lower.includes("السلام عليكم")

  ) {

    addBotMessage(

      "وعليكم السلام ورحمة الله وبركاته 🌹<br><br>" +

      "🏪 التاجر المختار:<br>" +

      "<strong>" +
      escapeHtml(selectedShop) +
      "</strong><br><br>" +

      "اكتب اسم المنتج والكمية التي تريدها.<br><br>" +

      "مثال: دقيق قمح 10"

    );

    return;

  }


  /* =====================================
     تغيير التاجر
  ===================================== */

  if (

    lower.includes("غير التاجر") ||

    lower.includes("تاجر اخر") ||

    lower.includes("تاجر ثاني")

  ) {

    const cart =
      JSON.parse(
        localStorage.getItem("cart")
      ) || [];


    if (cart.length > 0) {

      addBotMessage(

        "⚠️ لا يمكن تغيير التاجر الآن لأن السلة تحتوي على منتجات من:<br><br>" +

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
     مساعدة
  ===================================== */

  if (

    lower.includes("كيف اطلب") ||

    lower.includes("مساعده") ||

    lower.includes("كيف اشتري")

  ) {

    addBotMessage(

      "👍 طريقة الطلب سهلة جدًا:<br><br>" +

      "1️⃣ اكتب اسم المنتج والكمية.<br>" +

      "2️⃣ سأبحث عنه عند التاجر.<br>" +

      "3️⃣ اضغط «طلب هذا المنتج».<br>" +

      "4️⃣ اكتب اسمك ورقمك وحيك.<br>" +

      "5️⃣ سأرسل الطلب للإدارة عبر واتساب.<br><br>" +

      "مثال:<br>" +

      "<strong>دقيق قمح 10</strong>"

    );

    return;

  }


  /* =====================================
     البحث عن المنتجات
  ===================================== */

  const found =
    findProducts(
      cleanText
    );


  if (!found.length) {

    /* اقتراح منتجات من نفس التاجر */

    const shopProducts =
      products.filter(product => {

        return normalizeArabic(
          product.shopName || ""
        ) === normalizeArabic(
          selectedShop
        );

      });


    let suggestion =
      "";


    if (shopProducts.length) {

      const names =
        shopProducts
          .slice(0, 6)
          .map(p => escapeHtml(p.name))
          .join("<br>• ");


      suggestion =

        "<br><br>📋 بعض المنتجات المتوفرة:<br>" +

        "• " +
        names;

    }


    addBotMessage(

      "❌ لم أجد المنتج الذي كتبته عند التاجر:<br><br>" +

      "🏪 <strong>" +
      escapeHtml(selectedShop) +
      "</strong><br><br>" +

      "جرّب كتابة اسم المنتج بشكل أوضح." +

      suggestion

    );

    return;

  }


  /* =====================================
     المنتج الأفضل
  ===================================== */

  const product =
    found[0];


  const quantity =
    extractQuantity(
      cleanText
    );


  const deliveryPerCarton =
    getDeliveryPerCarton(
      product.price
    );


  const productsTotal =
    product.price *
    quantity;


  const deliveryTotal =
    deliveryPerCarton *
    quantity;


  const orderTotal =
    productsTotal +
    deliveryTotal;


  /* =====================================
     عرض المنتج
  ===================================== */

  let html = "";


  html +=
    "وجدت لك هذا المنتج 👇<br><br>";


  html +=
    "🏪 التاجر: <strong>" +

    escapeHtml(
      product.shopName
    ) +

    "</strong><br>";


  html +=
    "🛍️ المنتج: <strong>" +

    escapeHtml(
      product.name
    ) +

    "</strong><br>";


  html +=
    "💰 السعر: " +

    Number(
      product.price
    ).toLocaleString() +

    " ريال<br>";


  html +=
    "📦 الكمية: " +

    quantity +

    " كرتون<br>";


  html +=
    "🛍️ قيمة المنتجات: " +

    Number(
      productsTotal
    ).toLocaleString() +

    " ريال<br>";


  html +=
    "🚚 التوصيل: " +

    Number(
      deliveryTotal
    ).toLocaleString() +

    " ريال<br>";


  html +=
    "💰 <strong>الإجمالي النهائي: " +

    Number(
      orderTotal
    ).toLocaleString() +

    " ريال</strong><br><br>";


  html +=
    "إذا تريد طلبه، اضغط الزر التالي 👇";


  html +=

    "<br><br>" +

    `<button
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
      🛒 طلب هذا المنتج
    </button>`;


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
          product,
          quantity
        );

      }
    );

  }

}


/* =========================================
   تجهيز الطلب
========================================= */

function prepareOrder(
  product,
  quantity
) {

  const productShop =
    String(
      product.shopName ||
      "سوق مباشر"
    ).trim();


  if (
    normalizeArabic(selectedShop) !==
    normalizeArabic(productShop)
  ) {

    addBotMessage(
      "⚠️ هذا المنتج تابع لتاجر مختلف."
    );

    return;

  }


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

      normalizeArabic(cartShop) !==
      normalizeArabic(productShop)

    ) {

      addBotMessage(

        "⚠️ السلة تحتوي على منتجات من تاجر آخر.<br><br>" +

        "أكمل الطلب الحالي أو أفرغ السلة أولًا."

      );

      return;

    }

  }


  const price =
    Number(
      product.price || 0
    );


  const deliveryPerCarton =
    getDeliveryPerCarton(
      price
    );


  const productsTotal =
    price *
    quantity;


  const deliveryTotal =
    deliveryPerCarton *
    quantity;


  const total =
    productsTotal +
    deliveryTotal;


  window.currentAssistantOrder = {

    productId:
      product.id,

    name:
      product.name,

    price:
      price,

    quantity:
      quantity,

    category:
      product.category || "",

    sellerId:
      product.sellerId || "",

    shopName:
      productShop,

    deliveryPerCarton:
      deliveryPerCarton,

    deliveryTotal:
      deliveryTotal,

    productsTotal:
      productsTotal,

    total:
      total

  };


  customerData = {

    name: "",
    phone: "",
    district: ""

  };


  assistantStep =
    "name";


  addBotMessage(

    "ممتاز 👍<br><br>" +

    "🏪 التاجر: <strong>" +

    escapeHtml(
      productShop
    ) +

    "</strong><br>" +

    "🛒 المنتج: <strong>" +

    escapeHtml(
      product.name
    ) +

    "</strong><br>" +

    "📦 الكمية: <strong>" +

    quantity +

    " كرتون</strong><br>" +

    "💰 قيمة المنتجات: <strong>" +

    productsTotal.toLocaleString() +

    " ريال</strong><br>" +

    "🚚 التوصيل: <strong>" +

    deliveryTotal.toLocaleString() +

    " ريال</strong><br>" +

    "💵 الإجمالي النهائي: <strong>" +

    total.toLocaleString() +

    " ريال</strong><br><br>" +

    "👤 ما اسم العميل؟"

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
     الرقم
  ===================================== */

  if (
    assistantStep === "phone"
  ) {

    const phone =
      cleanText
        .replace(
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


  if (!order) {

    addBotMessage(
      "⚠️ أولًا اختر المنتج الذي تريد طلبه."
    );


    assistantStep =
      "product";


    return;

  }


  if (

    normalizeArabic(order.shopName) !==
    normalizeArabic(selectedShop)

  ) {

    addBotMessage(
      "❌ تعذر تسجيل الطلب لأن التاجر غير مطابق."
    );

    return;

  }


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


    /* ===================================
       التوصيل
    =================================== */

    deliveryPerCarton:
      Number(
        order.deliveryPerCarton
      ),

    deliveryFee:
      Number(
        order.deliveryTotal
      ),

    deliveryTotal:
      Number(
        order.deliveryTotal
      ),


    cartonsTotal:
      Number(
        order.quantity
      ),


    /* ===================================
       التاجر
    =================================== */

    shopName:
      order.shopName,

    sellerId:
      order.sellerId || "",


    /* ===================================
       المنتجات
    =================================== */

    products: [

      {

        id:
          order.productId,

        name:
          order.name,

        price:
          Number(
            order.price
          ),

        quantity:
          Number(
            order.quantity
          ),

        category:
          order.category || "",

        sellerId:
          order.sellerId || "",

        shopName:
          order.shopName,

        deliveryPerCarton:
          Number(
            order.deliveryPerCarton
          ),

        deliveryTotal:
          Number(
            order.deliveryTotal
          ),

        subtotal:
          Number(
            order.productsTotal
          )

      }

    ],


    /* ===================================
       الإجماليات
    =================================== */

    productsTotal:
      Number(
        order.productsTotal
      ),

    total:
      Number(
        order.total
      ),


    status:
      "جديد",


    source:
      "طلب بواسطة المساعد الذكي",


    assistantOrder:
      true,


    createdAt:
      serverTimestamp()

  };


  try {


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
       رسالة واتساب الإدارة
    ===================================== */

    const whatsappMessage =

`🛒 *طلب جديد بواسطة المساعد الذكي - سوق مباشر*

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

━━━━━━━━━━━━━━

📦 المنتج:
${order.name}

🔢 الكمية:
${order.quantity} كرتون

💰 سعر الكرتون:
${Number(order.price).toLocaleString()} ريال

🛍️ مجموع المنتجات:
${Number(order.productsTotal).toLocaleString()} ريال

🚚 التوصيل:
${Number(order.deliveryPerCarton).toLocaleString()} ريال × ${order.quantity}

🚚 إجمالي التوصيل:
${Number(order.deliveryTotal).toLocaleString()} ريال

💵 *الإجمالي النهائي:*
${Number(order.total).toLocaleString()} ريال

━━━━━━━━━━━━━━

🤖 مصدر الطلب:
المساعد الذكي

📌 الحالة:
جديد

🆔 رقم الطلب:
${orderRef.id}

❤️ سوق مباشر`;


    /* =====================================
       واتساب الإدارة
       الرقم ثابت
    ===================================== */

    const whatsappUrl =

      "https://wa.me/966550496391?text=" +

      encodeURIComponent(
        whatsappMessage
      );


    /* =====================================
       فتح واتساب
    ===================================== */

    window.location.href =
      whatsappUrl;


    /* =====================================
       نجاح
    ===================================== */

    addBotMessage(

      "✅ تم تسجيل طلبك بنجاح.<br><br>" +

      "🏪 التاجر: " +

      escapeHtml(
        order.shopName
      ) +

      "<br>" +

      "📦 المنتج: " +

      escapeHtml(
        order.name
      ) +

      "<br>" +

      "🔢 الكمية: " +

      order.quantity +

      " كرتون<br>" +

      "💰 مجموع المنتجات: " +

      Number(
        order.productsTotal
      ).toLocaleString() +

      " ريال<br>" +

      "🚚 التوصيل: " +

      Number(
        order.deliveryTotal
      ).toLocaleString() +

      " ريال<br>" +

      "💵 الإجمالي النهائي: " +

      Number(
        order.total
      ).toLocaleString() +

      " ريال<br><br>" +

      "📱 سيتم فتح واتساب الإدارة لإرسال تفاصيل الطلب.<br><br>" +

      "🆔 رقم الطلب:<br>" +

      escapeHtml(
        orderRef.id
      )

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

      "🏪 من فضلك اختر التاجر من الأزرار الموجودة بالأعلى."

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
