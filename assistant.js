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


// رقم واتساب صاحب المتجر
const WHATSAPP_NUMBER = "966550496391";


// الطلب الحالي
let currentOrder = [];


// مراحل الطلب
let orderStage = "products";


// بيانات العميل
let customer = {
  name: "",
  phone: "",
  address: ""
};


// =============================
// إضافة رسالة
// =============================

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


// =============================
// تحويل الأرقام العربية
// =============================

function numbers(text) {

  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const english = "0123456789";

  return text.replace(/[٠-٩]/g, function(n) {

    return english[arabic.indexOf(n)];

  });

}


// =============================
// تنظيف النص
// =============================

function clean(text) {

  return numbers(text)
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[،,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}


// =============================
// نعم
// =============================

function isYes(text) {

  const value = clean(text);

  return [
    "نعم",
    "اي",
    "ايوه",
    "ايوة",
    "تمام",
    "موافق",
    "اكيد",
    "اتمام الطلب",
    "اتم الطلب",
    "اريد الطلب",
    "نعم اريد",
    "كيف اتمام الطلب"
  ].some(word =>
    value.includes(clean(word))
  );

}


// =============================
// لا
// =============================

function isNo(text) {

  const value = clean(text);

  return [
    "لا",
    "الغاء",
    "الغ",
    "لا اريد",
    "ما اريد",
    "مش اريد"
  ].some(word =>
    value.includes(clean(word))
  );

}


// =============================
// تحميل المنتجات
// =============================

async function getProducts() {

  const result = [];

  const names = [
    "products",
    "منتجات"
  ];

  for (const collectionName of names) {

    try {

      const snapshot = await getDocs(
        collection(db, collectionName)
      );

      snapshot.forEach(function(doc) {

        const data = doc.data();

        const name =
          data.name ||
          data.اسم ||
          "";

        const price =
          Number(
            data.price ||
            data.سعر ||
            0
          );

        if (!name) return;


        // منع تكرار المنتج
        const exists =
          result.some(function(product) {

            return clean(product.name) === clean(name);

          });


        if (!exists) {

          result.push({

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

  return result;
}


// =============================
// استخراج جميع المنتجات
// =============================

function findProducts(text, products) {

  const value =
    clean(text);


  const found = [];


  // نرتب المنتجات من الأطول إلى الأقصر
  const sorted =
    [...products].sort(function(a, b) {

      return clean(b.name).length -
             clean(a.name).length;

    });


  for (const product of sorted) {

    const productName =
      clean(product.name);


    if (!productName) continue;


    // هل اسم المنتج موجود داخل الرسالة؟
    if (!value.includes(productName)) {

      continue;

    }


    // مكان المنتج داخل الرسالة
    const position =
      value.indexOf(productName);


    // نأخذ الجزء الذي قبل اسم المنتج
    const before =
      value.substring(
        Math.max(0, position - 10),
        position
      );


    // نبحث عن آخر رقم قبل اسم المنتج
    const numbersBefore =
      before.match(/\d+/g);


    let quantity = 1;


    if (
      numbersBefore &&
      numbersBefore.length
    ) {

      quantity =
        Number(
          numbersBefore[
            numbersBefore.length - 1
          ]
        );

    }


    // منع الكمية صفر
    if (!quantity || quantity < 1) {

      quantity = 1;

    }


    const price =
      Number(product.price) || 0;


    const total =
      price * quantity;


    // منع تكرار المنتج
    const already =
      found.some(function(item) {

        return clean(item.name) === productName;

      });


    if (!already) {

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


// =============================
// عرض الطلب
// =============================

function showOrder() {

  let message =
    "وجدت لك المنتجات التالية ✅\n\n";


  let total =
    0;


  currentOrder.forEach(function(product) {

    total += product.total;


    message +=
      "🛍️ " +
      product.name +

      "\n📦 الكمية: " +
      product.quantity +

      "\n💰 سعر الوحدة: " +
      product.price +
      " ريال" +

      "\n💵 الإجمالي: " +
      product.total +
      " ريال\n\n";

  });


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


// =============================
// اسم العميل
// =============================

function askName() {

  orderStage = "name";

  addMessage(
    "ممتاز 👍\n\nما اسمك؟",
    "bot"
  );

}


// =============================
// الجوال
// =============================

function askPhone() {

  orderStage = "phone";

  addMessage(
    "شكرًا 🌹\n\nأرسل رقم الجوال.",
    "bot"
  );

}


// =============================
// العنوان
// =============================

function askAddress() {

  orderStage = "address";

  addMessage(
    "تمام 👍\n\nأرسل عنوان التوصيل بالتفصيل.",
    "bot"
  );

}


// =============================
// المراجعة النهائية
// =============================

function showFinalOrder() {

  let message =
    "📋 مراجعة الطلب\n\n";


  currentOrder.forEach(function(product) {

    message +=
      "🛍️ " +
      product.name +

      " × " +
      product.quantity +

      " = " +
      product.total +
      " ريال\n";

  });


  const total =
    currentOrder.reduce(
      function(sum, product) {

        return sum + product.total;

      },
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


  orderStage =
    "finalConfirm";


  addMessage(
    message,
    "bot"
  );

}


// =============================
// حفظ الطلب
// =============================

async function saveOrder() {

  const total =
    currentOrder.reduce(
      function(sum, product) {

        return sum + product.total;

      },
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
      "📦 تم إرسال الطلب إلى المتجر.",
      "bot"
    );


    sendWhatsApp(
      orderData
    );


    // إعادة الطلب
    currentOrder = [];


    customer = {

      name: "",

      phone: "",

      address: ""

    };


    orderStage =
      "products";


  } catch(error) {

    console.error(error);


    addMessage(
      "❌ حدث خطأ أثناء حفظ الطلب.",
      "bot"
    );

  }

}


// =============================
// واتساب
// =============================

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


  order.products.forEach(function(product) {

    message +=
      "- " +
      product.name +

      " × " +
      product.quantity +

      " = " +
      product.total +
      " ريال\n";

  });


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


// =============================
// إرسال الرسالة
// =============================

async function sendMessage() {

  const text =
    input.value.trim();


  if (!text) return;


  addMessage(
    text,
    "user"
  );


  input.value = "";


  // ==========================
  // مرحلة المنتجات
  // ==========================

  if (
    orderStage === "products"
  ) {

    addMessage(
      "🔎 أبحث عن المنتجات...",
      "bot"
    );


    const products =
      await getProducts();


    const found =
      findProducts(
        text,
        products
      );


    // حذف رسالة البحث
    const messages =
      chat.querySelectorAll(".bot");


    if (messages.length) {

      messages[
        messages.length - 1
      ].remove();

    }


    if (!found.length) {

      addMessage(
        "❌ لم أجد المنتجات.\n\n" +
        "اكتب اسم المنتجات كما هي موجودة في المتجر.",
        "bot"
      );

      return;

    }
// حفظ كل المنتجات
currentOrder = found;

// الانتقال إلى مرحلة تأكيد الطلب
orderStage = "confirm";

// عرض كل المنتجات
showOrder();

return;

  }


  // ==========================
  // تأكيد الطلب
  // ==========================

  if (
    orderStage === "confirm"
  ) {

    if (isYes(text)) {

      askName();

      return;

    }


    if (isNo(text)) {

      currentOrder = [];

      orderStage =
        "products";

      addMessage(
        "تم إلغاء الطلب 👍\n\nاكتب طلبًا جديدًا.",
        "bot"
      );

      return;

    }


    addMessage(
      "اكتب «نعم» لإتمام الطلب أو «لا» للإلغاء.",
      "bot"
    );

    return;

  }


  // ==========================
  // الاسم
  // ==========================

  if (
    orderStage === "name"
  ) {

    customer.name =
      text;

    askPhone();

    return;

  }


  // ==========================
  // الجوال
  // ==========================

  if (
    orderStage === "phone"
  ) {

    customer.phone =
      text;

    askAddress();

    return;

  }


  // ==========================
  // العنوان
  // ==========================

  if (
    orderStage === "address"
  ) {

    customer.address =
      text;

    showFinalOrder();

    return;

  }


  // ==========================
  // التأكيد النهائي
  // ==========================

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

      orderStage =
        "products";

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


// =============================
// الأحداث
// =============================

sendButton.addEventListener(
  "click",
  sendMessage
);


input.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key === "Enter"
    ) {

      sendMessage();

    }

  }
);
