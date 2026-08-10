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


// مرحلة الطلب
let orderStage = "products";


// بيانات العميل
let customer = {
  name: "",
  phone: "",
  address: ""
};


// ============================
// إضافة رسالة
// ============================

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


// ============================
// تحويل الأرقام العربية
// ============================

function numbers(text) {

  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const english = "0123456789";

  return text.replace(/[٠-٩]/g, function(n) {

    return english[arabic.indexOf(n)];

  });

}


// ============================
// تنظيف النص
// ============================

function clean(text) {

  return numbers(text)
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .trim();

}


// ============================
// هل موافقة؟
/ ============================

function isYes(text) {

  const value = clean(text);

  const words = [
    "نعم",
    "اي",
    "ايوه",
    "ايوة",
    "تمام",
    "موافق",
    "اكيد",
    "اتمام الطلب",
    "اتم الطلب",
    "اريد اتمام الطلب",
    "أريد إتمام الطلب",
    "اتمام"
  ];

  return words.some(word =>
    value.includes(clean(word))
  );
}


// ============================
// هل إلغاء؟
/ ============================

function isNo(text) {

  const value = clean(text);

  const words = [
    "لا",
    "الغاء",
    "الغ",
    "لا اريد",
    "ما اريد",
    "مش اريد"
  ];

  return words.some(word =>
    value === clean(word) ||
    value.includes(clean(word))
  );
}


// ============================
// تحميل المنتجات
// ============================

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


        const exists =
          result.some(product =>
            clean(product.name) === clean(name)
          );


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


// ============================
// إيجاد الأرقام المرتبطة بالمنتج
// ============================

function getQuantityForPosition(
  text,
  startPosition
) {

  const value =
    clean(text);


  // نأخذ الجزء الذي قبل اسم المنتج
  const before =
    value.substring(
      Math.max(0, startPosition - 10),
      startPosition
    );


  // آخر رقم قبل المنتج
  const matches =
    before.match(/\d+/g);


  if (matches && matches.length) {

    return Number(
      matches[matches.length - 1]
    );

  }


  return 1;
}


// ============================
// البحث عن أكثر من منتج
// ============================

function findProducts(
  text,
  products
) {

  const normalized =
    clean(text);


  const found = [];


  // الأطول أولًا
  const sorted =
    [...products].sort(
      (a, b) =>
        clean(b.name).length -
        clean(a.name).length
    );


  for (const product of sorted) {

    const productName =
      clean(product.name);


    if (!productName) continue;


    let position =
      normalized.indexOf(productName);


    while (position !== -1) {

      const quantity =
        getQuantityForPosition(
          text,
          position
        );


      const price =
        Number(product.price) || 0;


      const total =
        price * quantity;


      // لا نكرر نفس المنتج
      const alreadyFound =
        found.some(item =>
          item.id === product.id
        );


      if (!alreadyFound) {

        found.push({

          id: product.id,

          name: product.name,

          price: price,

          quantity: quantity,

          total: total

        });

      }


      position =
        normalized.indexOf(
          productName,
          position + productName.length
        );

    }

  }


  // ترتيب المنتجات حسب ظهورها في الرسالة
  found.sort(function(a, b) {

    return normalized.indexOf(
      clean(a.name)
    ) -
    normalized.indexOf(
      clean(b.name)
    );

  });


  return found;
}


// ============================
// عرض الطلب
// ============================

function showOrder() {

  let message =
    "وجدت لك المنتجات التالية ✅\n\n";


  let totalOrder = 0;


  currentOrder.forEach(function(product) {

    totalOrder += product.total;


    message +=
      "🛍️ المنتج: " +
      product.name +

      "\n📦 الكمية: " +
      product.quantity +

      "\n💰 سعر الوحدة: " +
      product.price +
      " ريال" +

      "\n💵 إجمالي المنتج: " +
      product.total +
      " ريال\n\n";

  });


  message +=
    "━━━━━━━━━━━━\n" +

    "💰 إجمالي الطلب: " +
    totalOrder +
    " ريال\n\n" +

    "هل تريد إتمام الطلب؟";


  addMessage(
    message,
    "bot"
  );
}


// ============================
// اسم العميل
// ============================

function askName() {

  orderStage = "name";

  addMessage(
    "ممتاز 👍\n\nما اسمك؟",
    "bot"
  );
}


// ============================
// الجوال
// ============================

function askPhone() {

  orderStage = "phone";

  addMessage(
    "شكرًا 🌹\n\nأرسل رقم الجوال.",
    "bot"
  );
}


// ============================
// العنوان
// ============================

function askAddress() {

  orderStage = "address";

  addMessage(
    "تمام 👍\n\nأرسل عنوان التوصيل بالتفصيل.",
    "bot"
  );
}


// ============================
// مراجعة الطلب
// ============================

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


  orderStage =
    "finalConfirm";


  addMessage(
    message,
    "bot"
  );
}


// ============================
// حفظ الطلب
// ============================

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
      "📦 تم وضع الطلب في نظام الطلبات.\n\n" +
      "📱 وسيتم فتح واتساب لإرسال تفاصيل الطلب.",
      "bot"
    );


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

    orderStage =
      "products";


  } catch(error) {

    console.error(
      "خطأ في حفظ الطلب:",
      error
    );


    addMessage(
      "❌ حدث خطأ أثناء تسجيل الطلب.\n\nحاول مرة أخرى.",
      "bot"
    );

  }

}


// ============================
// إرسال واتساب
// ============================

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
    "\n💰 إجمالي الطلب: " +
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


// ============================
// إرسال الرسالة
// ============================

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
  // إذا كنا نطلب اسم العميل
  // ==========================

  if (orderStage === "name") {

    customer.name =
      text;

    askPhone();

    return;
  }


  // ==========================
  // رقم الجوال
  // ==========================

  if (orderStage === "phone") {

    customer.phone =
      text;

    askAddress();

    return;
  }


  // ==========================
  // العنوان
  // ==========================

  if (orderStage === "address") {

    customer.address =
      text;

    showFinalOrder();

    return;
  }


  // ==========================
  // التأكيد النهائي
  // ==========================

  if (orderStage === "finalConfirm") {

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

    return;
  }


  // ==========================
  // إتمام الطلب بعد عرض المنتجات
  // ==========================

  if (
    currentOrder.length > 0 &&
    isYes(text)
  ) {

    askName();

    return;
  }


  // ==========================
  // مرحلة المنتجات
  // ==========================

  if (orderStage === "products") {

    addMessage(
      "🔎 أبحث لك عن المنتجات...",
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
        "❌ لم أجد أي منتج من طلبك.\n\n" +
        "تأكد من كتابة اسم المنتج كما هو موجود في المتجر.",
        "bot"
      );

      return;
    }


    currentOrder =
      found;


    showOrder();

  }

}


// ============================
// زر الإرسال
// ============================

sendButton.addEventListener(
  "click",
  sendMessage
);


// ============================
// زر Enter
// ============================

input.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {

      sendMessage();

    }

  }
);
