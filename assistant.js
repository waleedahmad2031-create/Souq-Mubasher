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
   البيانات
========================================= */

let products = [];

window.currentAssistantOrder = null;
window.assistantCustomer = null;


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

    console.log(
      "تم تحميل المنتجات:",
      products.length
    );

  } catch (error) {

    console.error(
      "خطأ تحميل المنتجات:",
      error
    );

    addBotMessage(
      "تعذر تحميل المنتجات حاليًا ❌"
    );

  }

}


/* =========================================
   رسائل
========================================= */

function addBotMessage(text) {

  const div =
    document.createElement("div");

  div.className = "message bot";

  div.innerHTML = text;

  chat.appendChild(div);

  scrollChat();

}


function addUserMessage(text) {

  const div =
    document.createElement("div");

  div.className = "message user";

  div.textContent = text;

  chat.appendChild(div);

  scrollChat();

}


function scrollChat() {

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });

}


/* =========================================
   تطبيع العربية
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
   البحث عن المنتج
========================================= */

function findProducts(text) {

  const normalizedText =
    normalizeArabic(text);

  const words =
    normalizedText
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
   التأكد من نعم
========================================= */

function isYes(text) {

  const value =
    normalizeArabic(text)
      .replace(/\s+/g, "");

  return (
    value === "نعم" ||
    value === "نعمموافق" ||
    value === "ايوه" ||
    value === "ايوا" ||
    value === "ايوة" ||
    value === "ايه" ||
    value === "موافق" ||
    value === "موافقه" ||
    value === "اوافق" ||
    value === "تأكيد" ||
    value === "تاكيد" ||
    value === "أكد" ||
    value === "اكيد" ||
    value.includes("نعم") ||
    value.includes("موافق") ||
    value.includes("اوافق") ||
    value.includes("تاكيد") ||
    value.includes("تأكيد")
  );

}


/* =========================================
   التأكد من لا
========================================= */

function isNo(text) {

  const value =
    normalizeArabic(text)
      .replace(/\s+/g, "");

  return (
    value === "لا" ||
    value === "لالا" ||
    value === "مش" ||
    value === "لااريد" ||
    value === "الغاء" ||
    value === "إلغاء" ||
    value.includes("لا اريد") ||
    value.includes("لااريد") ||
    value.includes("الغاء")
  );

}


/* =========================================
   استخراج بيانات العميل
========================================= */

function parseCustomerData(text) {

  const result = {

    name: "",
    phone: "",
    district: ""

  };


  /*
     الطريقة الأولى:

     الاسم: أحمد
     الرقم: 777777777
     الحي: السبل
  */

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

      result.name = value;

    }


    if (
      key === "الرقم" ||
      key === "رقم" ||
      key === "الجوال" ||
      key === "رقم الجوال" ||
      key === "الهاتف" ||
      key === "رقم الهاتف"
    ) {

      result.phone = value;

    }


    if (
      key === "الحي" ||
      key === "العنوان" ||
      key === "المنطقه" ||
      key === "المنطقة"
    ) {

      result.district = value;

    }

  });


  /*
     الطريقة الثانية:

     أحمد - 777777777 - السبل
  */

  if (
    !result.name ||
    !result.phone ||
    !result.district
  ) {

    const parts =
      String(text)
        .split(/[-–—,،]+/)
        .map(x => x.trim())
        .filter(Boolean);


    if (parts.length >= 3) {

      if (!result.name) {
        result.name = parts[0];
      }

      if (!result.phone) {

        const phonePart =
          parts.find(
            part =>
              /(\+?\d[\d\s]{7,})/.test(
                part
              )
          );

        if (phonePart) {
          result.phone = phonePart;
        }

      }

      if (!result.district) {

        const districtPart =
          parts.find(
            part =>
              part !== result.name &&
              part !== result.phone
          );

        if (districtPart) {
          result.district =
            districtPart;
        }

      }

    }

  }


  /*
     تنظيف رقم الجوال
  */

  result.phone =
    String(result.phone || "")
      .replace(/[^\d+]/g, "")
      .trim();


  return result;

}


/* =========================================
   تجهيز الطلب
========================================= */

function prepareOrder(
  product,
  quantity
) {

  const total =
    Number(product.price) *
    Number(quantity);


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
      total

  };


  addBotMessage(

    "ممتاز 👍<br><br>" +

    "📦 المنتج: <strong>" +
    escapeHtml(product.name) +
    "</strong><br>" +

    "🔢 الكمية: <strong>" +
    quantity +
    "</strong><br>" +

    "💰 الإجمالي: <strong>" +
    total.toLocaleString() +
    " ريال</strong><br><br>" +

    "الآن أرسل بياناتك كلها في رسالة واحدة 👇<br><br>" +

    "<strong>" +
    "الاسم - رقم الجوال - الحي" +
    "</strong><br><br>" +

    "مثال:<br>" +

    "أحمد - 777123456 - السبل"

  );

}


/* =========================================
   عرض تأكيد الطلب
========================================= */

function showOrderConfirmation() {

  const order =
    window.currentAssistantOrder;

  const customer =
    window.assistantCustomer;


  if (!order || !customer) {
    return;
  }


  addBotMessage(

    "راجع طلبك من فضلك 👇<br><br>" +

    "📦 المنتج: <strong>" +
    escapeHtml(order.name) +
    "</strong><br>" +

    "🔢 الكمية: <strong>" +
    order.quantity +
    "</strong> كرتون<br>" +

    "💰 المجموع: <strong>" +
    Number(order.total)
      .toLocaleString() +
    " ريال</strong><br><br>" +

    "👤 الاسم: <strong>" +
    escapeHtml(customer.name) +
    "</strong><br>" +

    "📱 الجوال: <strong>" +
    escapeHtml(customer.phone) +
    "</strong><br>" +

    "🏠 الحي: <strong>" +
    escapeHtml(customer.district) +
    "</strong><br><br>" +

    "هل تؤكد الطلب؟<br>" +

    "<strong>اكتب: نعم أو لا</strong>"

  );

}


/* =========================================
   حفظ الطلب
========================================= */

async function saveAssistantOrder() {

  const order =
    window.currentAssistantOrder;

  const customer =
    window.assistantCustomer;


  if (!order || !customer) {

    addBotMessage(
      "لم أجد بيانات الطلب، حاول مرة أخرى."
    );

    return;

  }


  try {

    const orderData = {

      customerName:
        String(customer.name),

      customerPhone:
        String(customer.phone),

      customerCity:
        "إب",

      customerAddress:
        String(customer.district),

      deliveryDistrict:
        String(customer.district),

      deliveryArea:
        "مدينة إب",

      orderType:
        "جملة",

      deliveryTime:
        "بعد تجهيز الطلب والتواصل مع العميل",

      products: [

        {

          id:
            String(order.productId),

          name:
            String(order.name),

          price:
            Number(order.price),

          quantity:
            Number(order.quantity),

          category:
            String(order.category || ""),

          sellerId:
            String(order.sellerId || "")

        }

      ],

      productsTotal:
        Number(order.total),

      deliveryFee:
        0,

      cartonsTotal:
        Number(order.quantity),

      total:
        Number(order.total),

      status:
        "جديد",

      source:
        "طلب بواسطة المساعد الذكي",

      assistantOrder:
        true,

      sellerId:
        String(order.sellerId || ""),

      createdAt:
        serverTimestamp()

    };


    const orderRef =
      await addDoc(
        collection(db, "orders"),
        orderData
      );


    addBotMessage(

      "✅ <strong>تم تسجيل طلبك بنجاح!</strong><br><br>" +

      "🆔 رقم الطلب:<br>" +

      "<strong>" +
      escapeHtml(orderRef.id) +
      "</strong><br><br>" +

      "سيتم التواصل معك لتأكيد الطلب. 🌹"

    );


    window.currentAssistantOrder =
      null;

    window.assistantCustomer =
      null;


  } catch (error) {

    console.error(
      "خطأ حفظ طلب المساعد:",
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


  /* ---------------------------------------
     إذا في انتظار التأكيد
  --------------------------------------- */

  if (
    window.currentAssistantOrder &&
    window.assistantCustomer &&
    window.assistantCustomer.confirmation === true
  ) {


    if (isYes(cleanText)) {

      await saveAssistantOrder();

      return;

    }


    if (isNo(cleanText)) {

      window.currentAssistantOrder =
        null;

      window.assistantCustomer =
        null;


      addBotMessage(
        "تم إلغاء الطلب 👍<br><br>" +
        "يمكنك اختيار منتج آخر متى شئت."
      );

      return;

    }


    addBotMessage(
      "لم أفهم الإجابة 😅<br><br>" +
      "من فضلك اكتب <strong>نعم</strong> لتأكيد الطلب أو <strong>لا</strong> لإلغائه."
    );

    return;

  }


  /* ---------------------------------------
     إذا يوجد منتج وننتظر بيانات العميل
  --------------------------------------- */

  if (
    window.currentAssistantOrder &&
    !window.assistantCustomer
  ) {

    const customer =
      parseCustomerData(cleanText);


    if (
      !customer.name ||
      !customer.phone ||
      !customer.district
    ) {

      addBotMessage(

        "أحتاج البيانات الثلاثة فقط 👇<br><br>" +

        "👤 الاسم<br>" +
        "📱 رقم الجوال<br>" +
        "🏠 الحي<br><br>" +

        "مثال:<br>" +

        "<strong>" +
        "أحمد - 777123456 - السبل" +
        "</strong>"

      );

      return;

    }


    window.assistantCustomer = {

      ...customer,

      confirmation: true

    };


    showOrderConfirmation();

    return;

  }


  /* ---------------------------------------
     تحية
  --------------------------------------- */

  if (
    lower === "السلام عليكم" ||
    lower.includes("مرحبا") ||
    lower.includes("هلا") ||
    lower === "سلام"
  ) {

    addBotMessage(

      "وعليكم السلام ورحمة الله وبركاته 🌹<br><br>" +

      "أهلًا بك في سوق مباشر 🤖<br><br>" +

      "اكتب اسم المنتج والكمية التي تريدها."

    );

    return;

  }


  /* ---------------------------------------
     مساعدة
  --------------------------------------- */

  if (
    lower.includes("مساعده") ||
    lower.includes("كيف اطلب")
  ) {

    addBotMessage(

      "بكل سهولة 👍<br><br>" +

      "اكتب مثلًا:<br>" +

      "أريد دقيق قمح عدد 10"

    );

    return;

  }


  /* ---------------------------------------
     البحث عن المنتج
  --------------------------------------- */

  const found =
    findProducts(cleanText);


  if (!found.length) {

    addBotMessage(

      "لم أجد المنتج الذي تقصده 🔎<br><br>" +

      "اكتب اسم المنتج كما هو موجود في المتجر."

    );

    return;

  }


  const product =
    found[0];


  const quantity =
    extractQuantity(cleanText);


  const total =
    Number(product.price) *
    Number(quantity);


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
    total.toLocaleString() +
    " ريال<br><br>";


  html +=
    "اضغط لطلب المنتج 👇<br><br>";


  html +=

    `<button
      class="assistant-order-button"
      type="button"
    >
      🛒 طلب هذا المنتج
    </button>`;


  addBotMessage(html);


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
   زر الإرسال
========================================= */

async function sendMessage() {

  const text =
    messageInput.value.trim();


  if (!text) {
    return;
  }


  messageInput.value = "";


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

  return String(text ?? "")

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
   تشغيل
========================================= */

loadProducts();
