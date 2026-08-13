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

const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");


/* =========================================
   المنتجات
========================================= */

let products = [];


/* =========================================
   حالة طلب المساعد
========================================= */

window.currentAssistantOrder = null;

let assistantStep = null;

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

    const snapshot = await getDocs(
      collection(db, "products")
    );

    products = [];

    snapshot.forEach(doc => {

      const data = doc.data();

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
          ""

      });

    });

    addBotMessage(
      "تم تحميل المنتجات بنجاح ✅<br><br>" +
      "اكتب اسم المنتج والكمية التي تريدها."
    );

  } catch (error) {

    console.error(
      "خطأ تحميل المنتجات:",
      error
    );

    addBotMessage(
      "حدث خطأ أثناء تحميل المنتجات ❌<br><br>" +
      escapeHtml(
        error.message || String(error)
      )
    );

  }

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
    top: document.body.scrollHeight,
    behavior: "smooth"
  });

}


/* =========================================
   تطبيع العربي
========================================= */

function normalizeArabic(text) {

  return String(text || "")
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .trim();

}


/* =========================================
   البحث عن المنتجات
========================================= */

function findProducts(text) {

  const words =
    normalizeArabic(text)
      .split(/\s+/)
      .filter(word => word.length >= 2);

  if (!words.length) {
    return [];
  }

  return products
    .map(product => {

      const productName =
        normalizeArabic(product.name);

      let score = 0;

      words.forEach(word => {

        if (
          productName.includes(word)
        ) {

          score += 2;

        }

      });

      return {
        product,
        score
      };

    })
    .filter(item => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .map(
      item => item.product
    );

}


/* =========================================
   استخراج الكمية
========================================= */

function extractQuantity(text) {

  const match =
    String(text).match(/\d+/);

  if (!match) {
    return 1;
  }

  const quantity =
    Number(match[0]);

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

  addUserMessage(cleanText);

  const lower =
    normalizeArabic(cleanText);


  /* =====================================
     تحية
  ===================================== */

  if (
    lower === "السلام عليكم" ||
    lower === "السلام عليكم ورحمه الله" ||
    lower === "سلام" ||
    lower.includes("مرحبا") ||
    lower.includes("هلا")
  ) {

    addBotMessage(
      "وعليكم السلام ورحمة الله وبركاته 🌹<br><br>" +
      "أهلًا بك في سوق مباشر 🤖<br>" +
      "اكتب اسم المنتج والكمية التي تريدها."
    );

    return;

  }


  /* =====================================
     مساعدة
  ===================================== */

  if (
    lower.includes("مساعده") ||
    lower.includes("كيف اطلب")
  ) {

    addBotMessage(
      "بكل سهولة 👍<br><br>" +
      "اكتب مثلًا:<br>" +
      "دقيق قمح 10<br><br>" +
      "وسأجهز لك الطلب."
    );

    return;

  }


  /* =====================================
     البحث عن المنتج
  ===================================== */

  const found =
    findProducts(cleanText);

  if (!found.length) {

    addBotMessage(
      "لم أجد منتجًا مطابقًا لطلبك حاليًا 🔎<br><br>" +
      "جرّب كتابة اسم المنتج بشكل أوضح."
    );

    return;

  }


  const product =
    found[0];

  const quantity =
    extractQuantity(cleanText);

  const total =
    product.price * quantity;


  /* =====================================
     عرض المنتج
  ===================================== */

  let html = "";

  html +=
    "وجدت لك هذا المنتج 👇<br><br>";

  html +=
    "<strong>" +
    escapeHtml(product.name) +
    "</strong><br>";

  html +=
    "💰 السعر: " +
    Number(product.price)
      .toLocaleString() +
    " ريال<br>";

  html +=
    "📦 الكمية: " +
    quantity +
    "<br>";

  html +=
    "💵 الإجمالي: " +
    Number(total)
      .toLocaleString() +
    " ريال<br><br>";

  html +=
    "إذا تريد طلبه، اضغط الزر التالي 👇";

  html +=
    "<br><br>" +

    `<button
      class="assistant-order-button"
    >
      🛒 طلب هذا المنتج
    </button>`;

  addBotMessage(html);


  /* =====================================
     زر الطلب
  ===================================== */

  const buttons =
    document.querySelectorAll(
      ".assistant-order-button"
    );

  const button =
    buttons[buttons.length - 1];

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

  const total =
    product.price * quantity;


  /* حفظ المنتج */

  window.currentAssistantOrder = {

    productId:
      product.id,

    name:
      product.name,

    price:
      Number(product.price),

    quantity:
      Number(quantity),

    category:
      product.category || "",

    sellerId:
      product.sellerId || "",

    total:
      Number(total)

  };


  /* تصفير بيانات العميل */

  customerData = {

    name: "",
    phone: "",
    district: ""

  };


  /* أول خطوة */

  assistantStep = "name";


  addBotMessage(
    "ممتاز 👍<br><br>" +

    "🛒 المنتج: <strong>" +
    escapeHtml(product.name) +
    "</strong><br>" +

    "📦 الكمية: <strong>" +
    quantity +
    "</strong><br>" +

    "💰 الإجمالي: <strong>" +
    Number(total)
      .toLocaleString() +
    " ريال</strong><br><br>" +

    "👤 ما اسم العميل؟"
  );

}


/* =========================================
   معالجة بيانات العميل خطوة بخطوة
========================================= */

async function processCustomerStep(text) {

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

    addUserMessage(cleanText);

    addBotMessage(
      "أهلًا " +
      escapeHtml(customerData.name) +
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
      cleanText.replace(
        /[\s-]/g,
        ""
      );

    if (
      phone.length < 7
    ) {

      addUserMessage(cleanText);

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

    addUserMessage(cleanText);

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

    addUserMessage(cleanText);

    addBotMessage(
      "⏳ جاري تسجيل طلبك..."
    );

    await saveAssistantOrder();

    return;

  }

}


/* =========================================
   حفظ طلب المساعد
========================================= */

async function saveAssistantOrder() {

  const order =
    window.currentAssistantOrder;


  if (!order) {

    addBotMessage(
      "أولًا اختر المنتج الذي تريد طلبه 🛒"
    );

    assistantStep = null;

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

    deliveryFee:
      0,

    cartonsTotal:
      Number(order.quantity),

    products: [

      {

        id:
          order.productId,

        name:
          order.name,

        price:
          Number(order.price),

        quantity:
          Number(order.quantity),

        category:
          order.category || "",

        sellerId:
          order.sellerId || ""

      }

    ],

    productsTotal:
      Number(order.total),

    total:
      Number(order.total),

    status:
      "جديد",

    source:
      "طلب بواسطة المساعد الذكي",

    assistantOrder:
      true,

    createdAt:
      serverTimestamp(),

    sellerId:
      order.sellerId || ""

  };


  try {

    /* =====================================
       حفظ في Firestore
    ===================================== */

    const orderRef =
      await addDoc(
        collection(db, "orders"),
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
`🛒 طلب جديد بواسطة المساعد الذكي - سوق مباشر

👤 اسم العميل:
${customerData.name}

📱 رقم الجوال:
${customerData.phone}

📍 المدينة:
إب

🏘️ الحي:
${customerData.district}

📦 المنتج:
${order.name}

🔢 الكمية:
${order.quantity} كرتون

💰 سعر المنتج:
${Number(order.price).toLocaleString()} ريال

💵 الإجمالي:
${Number(order.total).toLocaleString()} ريال

🤖 مصدر الطلب:
المساعد الذكي

🆔 رقم الطلب:
${orderRef.id}`;


    /* =====================================
       فتح واتساب الإدارة
    ===================================== */

    const whatsappUrl =
      `https://wa.me/966550496391?text=${encodeURIComponent(
        whatsappMessage
      )}`;


    window.open(
      whatsappUrl,
      "_blank"
    );


    /* =====================================
       نجاح
    ===================================== */

    addBotMessage(
      "✅ تم تسجيل طلبك بنجاح.<br><br>" +

      "📦 المنتج: " +
      escapeHtml(order.name) +
      "<br>" +

      "🔢 الكمية: " +
      order.quantity +
      " كرتون<br>" +

      "💰 الإجمالي: " +
      Number(order.total)
        .toLocaleString() +
      " ريال<br><br>" +

      "📱 تم إرسال تفاصيل الطلب للإدارة عبر واتساب.<br><br>" +

      "🆔 رقم الطلب:<br>" +
      escapeHtml(orderRef.id) +
      "<br><br>" +

      "سيتم التواصل معك لتأكيد الطلب."
    );


    /* =====================================
       تنظيف الحالة
    ===================================== */

    window.currentAssistantOrder =
      null;

    assistantStep =
      null;

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
     إذا كنا في خطوات بيانات العميل
  ===================================== */

  if (
    assistantStep
  ) {

    await processCustomerStep(
      text
    );

    return;

  }


  /* =====================================
     طلب عادي
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
