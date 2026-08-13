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
      "تم تحميل المنتجات بنجاح ✅<br><br>اكتب اسم المنتج أو الكمية التي تريدها."
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
   البحث عن المنتج
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
   تطبيع النص العربي
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
   معالجة رسالة العميل
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


  /* ---------------------------------------
     تحية
  --------------------------------------- */

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


  /* ---------------------------------------
     مساعدة
  --------------------------------------- */

  if (
    lower.includes("مساعده") ||
    lower.includes("كيف اطلب") ||
    lower.includes("كيف اطلب")
  ) {

    addBotMessage(
      "بكل سهولة 👍<br><br>" +
      "اكتب مثلًا:<br>" +
      "أريد دقيق قمح عدد 10<br><br>" +
      "وسأجهز لك الطلب."
    );

    return;
  }


  /* ---------------------------------------
     البحث عن المنتجات
  --------------------------------------- */

  const found =
    findProducts(cleanText);


  if (!found.length) {

    addBotMessage(
      "لم أجد منتجًا مطابقًا لطلبك حاليًا 🔎<br><br>" +
      "جرّب كتابة اسم المنتج بشكل أوضح."
    );

    return;
  }


  /* ---------------------------------------
     المنتج الأول
  --------------------------------------- */

  const product =
    found[0];


  const quantity =
    extractQuantity(cleanText);


  const total =
    product.price * quantity;


  /* ---------------------------------------
     عرض المنتج
  --------------------------------------- */

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
      data-product-id="${escapeHtml(product.id)}"
    >
      🛒 طلب هذا المنتج
    </button>`;


  addBotMessage(html);


  /* ---------------------------------------
     زر الطلب
  --------------------------------------- */

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


  addBotMessage(
    "ممتاز 👍<br><br>" +
    "المنتج: <strong>" +
    escapeHtml(product.name) +
    "</strong><br>" +
    "الكمية: <strong>" +
    quantity +
    "</strong><br>" +
    "الإجمالي: <strong>" +
    Number(total)
      .toLocaleString() +
    " ريال</strong><br><br>" +

    "الآن أرسل بياناتك بهذا الشكل:<br><br>" +

    "الاسم: محمد<br>" +
    "رقم الجوال: 05xxxxxxxx<br>" +
    "المدينة: إب<br>" +
    "العنوان: الحي والشارع<br>" +
    "وقت التوصيل: صباحًا أو مساءً"
  );


  /* حفظ المنتج مؤقتًا */

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
      Number(product.price) *
      Number(quantity)

  };

}


/* =========================================
   استخراج بيانات العميل
========================================= */

function parseCustomerData(text) {

  const result = {

    name: "",
    phone: "",
    city: "",
    address: "",
    deliveryTime: ""

  };


  const lines =
    String(text)
      .split("\n");


  lines.forEach(line => {

    const parts =
      line.split(":");


    if (parts.length < 2) {
      return;
    }


    const key =
      normalizeArabic(
        parts.shift()
      );


    const value =
      parts.join(":").trim();


    if (
      key === "الاسم" ||
      key === "اسم"
    ) {

      result.name =
        value;

    }


    if (
      key === "رقم الجوال" ||
      key === "الجوال" ||
      key === "الهاتف" ||
      key === "رقم الهاتف"
    ) {

      result.phone =
        value;

    }


    if (
      key === "المدينه" ||
      key === "مدينة"
    ) {

      result.city =
        value;

    }


    if (
      key === "العنوان"
    ) {

      result.address =
        value;

    }


    if (
      key === "وقت التوصيل" ||
      key === "الوقت"
    ) {

      result.deliveryTime =
        value;

    }

  });


  return result;

}


/* =========================================
   حفظ طلب المساعد
========================================= */

async function saveAssistantOrder(
  customer
) {

  const order =
    window.currentAssistantOrder;


  if (!order) {

    addBotMessage(
      "أولًا اختر المنتج الذي تريد طلبه 🛒"
    );

    return;

  }


  if (!customer.name) {

    addBotMessage(
      "اكتب اسمك من فضلك."
    );

    return;

  }


  if (!customer.phone) {

    addBotMessage(
      "اكتب رقم الجوال من فضلك."
    );

    return;

  }


  if (!customer.city) {

    addBotMessage(
      "اكتب المدينة من فضلك."
    );

    return;

  }


  if (!customer.address) {

    addBotMessage(
      "اكتب العنوان من فضلك."
    );

    return;

  }


  if (!customer.deliveryTime) {

    addBotMessage(
      "اكتب وقت التوصيل من فضلك."
    );

    return;

  }


  const orderData = {

    customerName:
      customer.name,

    customerPhone:
      customer.phone,

    customerCity:
      customer.city,

    customerAddress:
      customer.address,

    deliveryArea:
      customer.address,

    orderType:
      "طلب بواسطة المساعد الذكي",

    deliveryTime:
      customer.deliveryTime,

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

    await addDoc(
      collection(db, "orders"),
      orderData
    );


    addBotMessage(
      "تم إرسال طلبك بنجاح ✅🎉<br><br>" +

      "رقم طلبك تم تسجيله في سوق مباشر." +

      "<br><br>" +

      "سيتم التواصل معك لتأكيد الطلب."
    );


    window.currentAssistantOrder =
      null;


  } catch (error) {

    console.error(
      "خطأ حفظ طلب المساعد:",
      error
    );


    addBotMessage(
      "تعذر تسجيل الطلب ❌<br><br>" +

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


  /* إذا يوجد طلب مجهز */

  if (
    window.currentAssistantOrder
  ) {

    const customer =
      parseCustomerData(text);


    /*
      إذا المستخدم أرسل البيانات
      في رسالة واحدة أو عدة أسطر
    */

    if (
      customer.name ||
      customer.phone ||
      customer.city ||
      customer.address ||
      customer.deliveryTime
    ) {

      addUserMessage(text);


      await saveAssistantOrder(
        customer
      );

      return;

    }

  }


  await processMessage(text);

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
