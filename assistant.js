import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");


// 📱 ضع هنا رقم واتساب صاحب المتجر
// مثال للسعودية: 966550496391
const WHATSAPP_NUMBER = "966550496391";


// الطلب الحالي
let currentOrder = [];


// مرحلة المحادثة
let orderStage = "products";


// بيانات العميل
let customer = {
  name: "",
  phone: "",
  address: ""
};


// -------------------------
// إضافة رسالة
// -------------------------

function addMessage(text, type) {

  const message = document.createElement("div");

  message.className = "message " + type;

  message.innerText = text;

  chat.appendChild(message);

  window.scrollTo(
    0,
    document.body.scrollHeight
  );
}


// -------------------------
// تنظيف النص
// -------------------------

function cleanText(text) {

  return text
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();

}


// -------------------------
// تحويل الأرقام العربية
// -------------------------

function convertArabicNumbers(text) {

  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const english = "0123456789";

  return text.replace(/[٠-٩]/g, function(number) {

    return english[
      arabic.indexOf(number)
    ];

  });

}


// -------------------------
// هل الرسالة موافقة؟
// -------------------------

function isYes(text) {

  const value = cleanText(text);

  return [
    "نعم",
    "اي",
    "ايوه",
    "أيوه",
    "ايوة",
    "تمام",
    "موافق",
    "موافقه",
    "اكيد",
    "نعم اريد",
    "اريد الطلب",
    "اتمام الطلب",
    "اتم الطلب"
  ].some(word => value.includes(cleanText(word)));

}


// -------------------------
// هل الرسالة إلغاء؟
/ -------------------------

function isNo(text) {

  const value = cleanText(text);

  return [
    "لا",
    "الغاء",
    "الغ",
    "مش اريد",
    "لا اريد",
    "ما اريد"
  ].some(word => value.includes(cleanText(word)));

}


// -------------------------
// تحميل المنتجات
// -------------------------

async function loadProducts() {

  const products = [];

  const collectionNames = [
    "products",
    "منتجات"
  ];

  for (const collectionName of collectionNames) {

    try {

      const snapshot = await getDocs(
        collection(db, collectionName)
      );

      snapshot.forEach(doc => {

        const data = doc.data();

        const name =
          data.name ||
          data.اسم ||
          "";

        if (!name) return;


        const price =
          Number(
            data.price ||
            data.سعر ||
            0
          );


        // منع تكرار نفس المنتج
        const exists =
          products.some(
            p =>
              p.id === doc.id ||
              cleanText(p.name) === cleanText(name)
          );


        if (!exists) {

          products.push({

            id: doc.id,

            name: name,

            price: price

          });

        }

      });

    } catch(error) {

      console.error(
        "خطأ في تحميل المنتجات:",
        error
      );

    }

  }

  return products;
}


// -------------------------
// استخراج الكمية
// -------------------------

function getQuantity(text, productName) {

  const normalized =
    cleanText(
      convertArabicNumbers(text)
    );


  const name =
    cleanText(productName);


  const position =
    normalized.indexOf(name);


  if (position === -1) {

    return 1;

  }


  // النص قبل اسم المنتج
  const before =
    normalized.substring(
      Math.max(0, position - 15),
      position
    );


  // النص بعد اسم المنتج
  const after =
    normalized.substring(
      position + name.length,
      position + name.length + 15
    );


  // رقم قبل المنتج
  const beforeNumbers =
    before.match(/\d+/g);


  if (
    beforeNumbers &&
    beforeNumbers.length
  ) {

    return parseInt(
      beforeNumbers[
        beforeNumbers.length - 1
      ]
    );

  }


  // رقم بعد المنتج
  const afterNumber =
    after.match(/^\s*(\d+)/);


  if (afterNumber) {

    return parseInt(
      afterNumber[1]
    );

  }


  return 1;
}


// -------------------------
// البحث عن المنتجات داخل الرسالة
// -------------------------

function findProducts(
  text,
  products
) {

  const normalized =
    cleanText(
      convertArabicNumbers(text)
    );


  const found = [];


  // المنتجات الأطول أولًا
  // حتى لا يتداخل اسم منتج مع اسم آخر
  const sorted =
    [...products].sort(
      (a, b) =>
        cleanText(b.name).length -
        cleanText(a.name).length
    );


  for (const product of sorted) {

    const name =
      cleanText(product.name);


    if (!name) continue;


    if (
      normalized.includes(name)
    ) {

      const quantity =
        getQuantity(
          text,
          product.name
        );


      const price =
        Number(product.price) || 0;


      const total =
        price * quantity;


      found.push({

        id: product.id,

        name: product.name,

        price: price,

        quantity: quantity,

        total: total

      });

    }

  }


  return found;
}


// -------------------------
// عرض الطلب
// -------------------------

function showOrder() {

  let message =
    "وجدت لك المنتجات التالية ✅\n\n";


  let total = 0;


  currentOrder.forEach(
    product => {

      total += product.total;


      message +=
        "🛍️ " +
        product.name +
        "\n" +

        "📦 الكمية: " +
        product.quantity +
        "\n" +

        "💰 سعر الحبة: " +
        product.price +
        " ريال\n" +

        "💵 إجمالي المنتج: " +
        product.total +
        " ريال\n\n";

    }
  );


  message +=
    "━━━━━━━━━━━━\n" +

    "💰 إجمالي الطلب: " +
    total +
    " ريال\n\n" +

    "هل تريد إتمام الطلب؟";


  addMessage(
    message,
    "bot"
  );
}


// -------------------------
// طلب اسم العميل
// -------------------------

function askCustomerName() {

  orderStage = "name";

  addMessage(
    "ممتاز 👍\n\nما اسمك؟",
    "bot"
  );
}


// -------------------------
// طلب الجوال
// -------------------------

function askCustomerPhone() {

  orderStage = "phone";

  addMessage(
    "شكرًا 🌹\n\nأرسل رقم الجوال.",
    "bot"
  );
}


// -------------------------
// طلب العنوان
// -------------------------

function askCustomerAddress() {

  orderStage = "address";

  addMessage(
    "تمام 👍\n\nأرسل عنوان التوصيل بالتفصيل.",
    "bot"
  );
}


// -------------------------
// تأكيد الطلب
// -------------------------

function showFinalOrder() {

  let message =
    "📋 مراجعة الطلب\n\n";


  currentOrder.forEach(
    product => {

      message +=
        "🛍️ " +
        product.name +
        " × " +
        product.quantity +
        " = " +
        product.total +
        " ريال\n";

    }
  );


  const total =
    currentOrder.reduce(
      (sum, product) =>
        sum + product.total,
      0
    );


  message +=
    "\n💰 الإجمالي: " +
    total +
    " ريال\n\n" +

    "👤 الاسم: " +
    customer.name +

    "\n📱 الجوال: " +
    customer.phone +

    "\n📍 العنوان: " +
    customer.address +

    "\n\nهل تؤكد إرسال الطلب؟";


  orderStage = "finalConfirm";


  addMessage(
    message,
    "bot"
  );
}


// -------------------------
// حفظ الطلب
// -------------------------

async function saveOrder() {

  const total =
    currentOrder.reduce(
      (sum, product) =>
        sum + product.total,
      0
    );


  const orderData = {

    name: customer.name,

    phone: customer.phone,

    address: customer.address,

    products: currentOrder,

    total: total,

    status: "جديد",

    source: "طلب بواسطة المساعد الذكي",

    createdAt: serverTimestamp()

  };


  try {

    await addDoc(
      collection(db, "orders"),
      orderData
    );


    addMessage(
      "✅ تم تسجيل طلبك بنجاح.\n\n" +
      "📦 الطلب أصبح موجودًا في نظام الطلبات.",
      "bot"
    );


    // إرسال واتساب
    sendWhatsApp(
      orderData
    );


    // إعادة البداية
    currentOrder = [];

    customer = {
      name: "",
      phone: "",
      address: ""
    };

    orderStage = "products";


  } catch(error) {

    console.error(error);

    addMessage(
      "❌ حدث خطأ أثناء حفظ الطلب. حاول مرة أخرى.",
      "bot"
    );

  }

}


// -------------------------
// إرسال واتساب
// -------------------------

function sendWhatsApp(order) {

  let message =
    "🛒 طلب جديد من سوق مباشر\n\n";


  message +=
    "👤 الاسم: " +
    order.name +
    "\n";


  message +=
    "📱 الجوال: " +
    order.phone +
    "\n";


  message +=
    "📍 العنوان: " +
    order.address +
    "\n\n";


  message +=
    "🛍️ المنتجات:\n";


  order.products.forEach(
    product => {

      message +=
        "- " +
        product.name +
        " × " +
        product.quantity +
        " = " +
        product.total +
        " ريال\n";

    }
  );


  message +=
    "\n💰 الإجمالي: " +
    order.total +
    " ريال";


  const url =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(message);


  window.open(
    url,
    "_blank"
  );
}


// -------------------------
// معالجة الرسالة
// -------------------------

async function sendMessage() {

  const text =
    input.value.trim();


  if (!text) return;


  addMessage(
    text,
    "user"
  );


  input.value = "";


  // =====================
  // مرحلة المنتجات
  // =====================

  if (
    orderStage === "products"
  ) {

    addMessage(
      "🔎 أبحث لك عن المنتجات...",
      "bot"
    );


    const products =
      await loadProducts();


    const found =
      findProducts(
        text,
        products
      );


    const messages =
      chat.querySelectorAll(".bot");


    if (messages.length) {

      messages[
        messages.length - 1
      ].remove();

    }


    if (!found.length) {

      addMessage(
        "عذرًا 🌹 لم أجد المنتج.\n\nاكتب اسم المنتج كما هو موجود في المتجر.",
        "bot"
      );

      return;

    }


    // حفظ المنتجات
    currentOrder = found;


    // عرض الطلب
    showOrder();


    return;
  }


  // =====================
  // تأكيد أولي
  // =====================

  if (
    orderStage === "products" &&
    isYes(text)
  ) {

    askCustomerName();

    return;

  }


  // =====================
  // اسم العميل
  // =====================

  if (
    orderStage === "name"
  ) {

    customer.name = text;

    askCustomerPhone();

    return;

  }


  // =====================
  // رقم الجوال
  // =====================

  if (
    orderStage === "phone"
  ) {

    customer.phone = text;

    askCustomerAddress();

    return;

  }


  // =====================
  // العنوان
  // =====================

  if (
    orderStage === "address"
  ) {

    customer.address = text;

    showFinalOrder();

    return;

  }


  // =====================
  // التأكيد النهائي
  // =====================

  if (
    orderStage === "finalConfirm"
  ) {

    if (isYes(text)) {

      addMessage(
        "⏳ جاري تسجيل الطلب...",
        "bot"
      );

      await saveOrder();

      return;

    }


    if (isNo(text)) {

      currentOrder = [];

      orderStage = "products";

      addMessage(
        "تم إلغاء الطلب 👍\n\nيمكنك كتابة طلب جديد.",
        "bot"
      );

      return;

    }


    addMessage(
      "اكتب «نعم» لتأكيد الطلب أو «لا» لإلغائه.",
      "bot"
    );

  }

}


// -------------------------
// الأحداث
// -------------------------

sendButton.addEventListener(
  "click",
  sendMessage
);


input.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {

      sendMessage();

    }

  }
);
