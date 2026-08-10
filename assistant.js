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


// =====================================
// إضافة رسالة
// =====================================

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


// =====================================
// تحويل الأرقام العربية
// =====================================

function numbers(text) {

  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const english = "0123456789";

  return text.replace(/[٠-٩]/g, function(n) {

    return english[arabic.indexOf(n)];

  });

}


// =====================================
// تنظيف النص
// =====================================

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


// =====================================
// نعم
// =====================================

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
    "نعم اريد"
  ].some(word =>
    value.includes(clean(word))
  );

}


// =====================================
// لا
// =====================================

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


// =====================================
// حساب رسوم التوصيل للكرتون
// =====================================

function getDeliveryFee(price) {

  price = Number(price) || 0;

  // أقل من 1500
  if (price < 1500) {

    return 50;

  }

  // من 1500 إلى أقل من 2000
  if (price < 2000) {

    return 70;

  }

  // 2000 فأكثر
  return 100;

}


// =====================================
// تحميل المنتجات
// =====================================

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


// =====================================
// استخراج المنتجات من كلام العميل
// =====================================

function findProducts(text, products) {

  const value = clean(text);

  const found = [];


  const sorted =
    [...products].sort(function(a, b) {

      return clean(b.name).length -
             clean(a.name).length;

    });


  for (const product of sorted) {

    const productName =
      clean(product.name);


    if (!productName) continue;


    if (!value.includes(productName)) {

      continue;

    }


    const position =
      value.indexOf(productName);


    const before =
      value.substring(
        Math.max(0, position - 15),
        position
      );


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


    if (!quantity || quantity < 1) {

      quantity = 1;

    }


    const price =
      Number(product.price) || 0;


    const total =
      price * quantity;


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


// =====================================
// حساب إجماليات الطلب
// =====================================

function calculateOrder() {

  let productsTotal = 0;

  let deliveryTotal = 0;

  let cartonsTotal = 0;


  currentOrder.forEach(function(product) {

    const price =
      Number(product.price) || 0;

    const quantity =
      Number(product.quantity) || 1;


    const productTotal =
      price * quantity;


    const deliveryPerCarton =
      getDeliveryFee(price);


    const productDelivery =
      deliveryPerCarton * quantity;


    productsTotal += productTotal;

    deliveryTotal += productDelivery;

    cartonsTotal += quantity;

  });


  const finalTotal =
    productsTotal + deliveryTotal;


  return {

    productsTotal: productsTotal,

    deliveryTotal: deliveryTotal,

    cartonsTotal: cartonsTotal,

    finalTotal: finalTotal

  };

}


// =====================================
// عرض الطلب للعميل
// =====================================

function showOrder() {

  let message =
    "وجدت لك المنتجات التالية ✅\n\n";


  currentOrder.forEach(function(product) {

    const price =
      Number(product.price) || 0;

    const quantity =
      Number(product.quantity) || 1;


    message +=
      "🛍️ " +
      product.name +

      "\n📦 الكمية: " +
      quantity +
      " كرتون" +

      "\n💰 سعر الكرتون: " +
      price +
      " ريال\n\n";

  });


  const totals =
    calculateOrder();


  message +=
    "━━━━━━━━━━━━\n" +

    "📦 عدد الكراتين: " +
    totals.cartonsTotal +

    "\n🛍️ مجموع المنتجات: " +
    totals.productsTotal +
    " ريال" +

    "\n🚚 إجمالي رسوم التوصيل: " +
    totals.deliveryTotal +
    " ريال" +

    "\n💰 الإجمالي النهائي: " +
    totals.finalTotal +
    " ريال" +

    "\n━━━━━━━━━━━━\n\n" +

    "هل تريد إتمام الطلب؟";


  addMessage(
    message,
    "bot"
  );

}


// =====================================
// طلب الاسم
// =====================================

function askName() {

  orderStage = "name";

  addMessage(
    "ممتاز 👍\n\nما اسمك؟",
    "bot"
  );

}


// =====================================
// طلب الجوال
// =====================================

function askPhone() {

  orderStage = "phone";

  addMessage(
    "شكرًا 🌹\n\nأرسل رقم الجوال.",
    "bot"
  );

}


// =====================================
// طلب العنوان
// =====================================

function askAddress() {

  orderStage = "address";

  addMessage(
    "تمام 👍\n\nأرسل عنوان التوصيل بالتفصيل.",
    "bot"
  );

}


// =====================================
// المراجعة النهائية
// =====================================

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


  const totals =
    calculateOrder();


  message +=
    "\n━━━━━━━━━━━━\n" +

    "📦 عدد الكراتين: " +
    totals.cartonsTotal +

    "\n🛍️ مجموع المنتجات: " +
    totals.productsTotal +
    " ريال" +

    "\n🚚 رسوم التوصيل: " +
    totals.deliveryTotal +
    " ريال" +

    "\n💰 الإجمالي النهائي: " +
    totals.finalTotal +
    " ريال" +

    "\n━━━━━━━━━━━━\n\n" +

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


// =====================================
// حفظ الطلب في Firebase
// =====================================

async function saveOrder() {

  const totals =
    calculateOrder();


  const orderData = {

    name: customer.name,

    phone: customer.phone,

    address: customer.address,

    customerName: customer.name,

    customerPhone: customer.phone,

    customerAddress: customer.address,

    customerCity: "إب",

    deliveryArea: "مدينة إب",

    orderType: "جملة",

    products: currentOrder,

    cartonsTotal: totals.cartonsTotal,

    productsTotal: totals.productsTotal,

    deliveryFee: totals.deliveryTotal,

    deliveryTotal: totals.deliveryTotal,

    total: totals.finalTotal,

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


    sendWhatsApp(orderData);


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


// =====================================
// إرسال الطلب إلى واتساب
// =====================================

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
    "📍 المدينة: إب\n";


  message +=
    "📍 العنوان: " +
    order.address +
    "\n\n";


  message +=
    "🛍️ المنتجات:\n\n";


  order.products.forEach(function(product) {

    const price =
      Number(product.price) || 0;

    const quantity =
      Number(product.quantity) || 1;


    const fee =
      getDeliveryFee(price);


    const productTotal =
      price * quantity;


    const productDelivery =
      fee * quantity;


    message +=
      "🛍️ " +
      product.name +

      "\n📦 الكمية: " +
      quantity +
      " كرتون" +

      "\n💰 سعر الكرتون: " +
      price +
      " ريال" +

      "\n💵 إجمالي المنتج: " +
      productTotal +
      " ريال" +

      "\n\n";

  });


  message +=
    "━━━━━━━━━━━━\n" +

    "📦 عدد الكراتين: " +
    order.cartonsTotal +

    "\n🛍️ مجموع المنتجات: " +
    order.productsTotal +
    " ريال" +

    "\n🚚 رسوم التوصيل: " +
    order.deliveryTotal +
    " ريال" +

    "\n💰 الإجمالي النهائي: " +
    order.total +
    " ريال\n" +

    "━━━━━━━━━━━━";


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


// =====================================
// إرسال الرسالة
// =====================================

async function sendMessage() {

  const text =
    input.value.trim();


  if (!text) return;


  addMessage(
    text,
    "user"
  );


  input.value = "";


  // =================================
  // مرحلة المنتجات
  // =================================

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


    currentOrder = found;

    orderStage = "confirm";


    showOrder();

    return;

  }


  // =================================
  // تأكيد الطلب
  // =================================

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


  // =================================
  // الاسم
  // =================================

  if (
    orderStage === "name"
  ) {

    customer.name =
      text;

    askPhone();

    return;

  }


  // =================================
  // الجوال
  // =================================

  if (
    orderStage === "phone"
  ) {

    customer.phone =
      text;

    askAddress();

    return;

  }


  // =================================
  // العنوان
  // =================================

  if (
    orderStage === "address"
  ) {

    customer.address =
      text;

    showFinalOrder();

    return;

  }


  // =================================
  // التأكيد النهائي
  // =================================

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


// =====================================
// الأحداث
// =====================================

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
