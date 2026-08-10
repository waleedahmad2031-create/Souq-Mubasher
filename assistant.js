import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");


function addMessage(text, type) {

  const message = document.createElement("div");

  message.className = "message " + type;
  message.innerText = text;

  chat.appendChild(message);

  window.scrollTo(0, document.body.scrollHeight);
}


// تنظيف النص العربي
function cleanText(text) {

  return text
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();

}


// تحويل الأرقام العربية إلى أرقام عادية
function convertArabicNumbers(text) {

  const arabicNumbers = "٠١٢٣٤٥٦٧٨٩";
  const englishNumbers = "0123456789";

  return text.replace(/[٠-٩]/g, function(number) {

    return englishNumbers[
      arabicNumbers.indexOf(number)
    ];

  });

}


// الحصول على المنتجات من Firebase
async function loadProducts() {

  const allProducts = [];

  const collections = [
    "products",
    "منتجات"
  ];

  for (const collectionName of collections) {

    try {

      const snapshot = await getDocs(
        collection(db, collectionName)
      );

      snapshot.forEach((doc) => {

        const data = doc.data();

        const name =
          data.name ||
          data.اسم ||
          "";

        if (!name) return;

        allProducts.push({

          id: doc.id,

          name: name,

          price:
            data.price ||
            data.سعر ||
            0

        });

      });

    } catch (error) {

      console.error(
        "خطأ في قراءة المنتجات:",
        error
      );

    }

  }

  return allProducts;
}


// البحث عن المنتجات الموجودة داخل رسالة العميل
function findProductsInMessage(text, products) {

  const normalizedText =
    cleanText(
      convertArabicNumbers(text)
    );

  const found = [];

  for (const product of products) {

    const productName =
      cleanText(product.name);

    if (!productName) continue;


    const position =
      normalizedText.indexOf(productName);


    if (position === -1) continue;


    // الجزء الذي قبل اسم المنتج
    const before =
      normalizedText.substring(
        0,
        position
      );


    // البحث عن آخر رقم قبل المنتج
    const beforeNumbers =
      before.match(/\d+/g);


    let quantity = 1;


    if (beforeNumbers && beforeNumbers.length) {

      quantity =
        parseInt(
          beforeNumbers[beforeNumbers.length - 1]
        );

    }


    // البحث عن رقم بعد اسم المنتج
    const after =
      normalizedText.substring(
        position + productName.length
      );


    const afterNumber =
      after.match(/^\s*(\d+)/);


    if (afterNumber) {

      quantity =
        parseInt(
          afterNumber[1]
        );

    }


    found.push({

      id: product.id,

      name: product.name,

      price: product.price,

      quantity: quantity

    });

  }


  return found;
}


// إرسال الرسالة
async function sendMessage() {

  const text =
    input.value.trim();

  if (!text) return;


  addMessage(
    text,
    "user"
  );

  input.value = "";


  addMessage(
    "🔎 لحظة، أبحث لك عن جميع المنتجات...",
    "bot"
  );


  const products =
    await loadProducts();


  const foundProducts =
    findProductsInMessage(
      text,
      products
    );


  // حذف رسالة البحث
  const messages =
    chat.querySelectorAll(".bot");

  if (messages.length) {

    messages[messages.length - 1].remove();

  }


  if (foundProducts.length === 0) {

    addMessage(
      "عذرًا 🌹 لم أجد المنتجات التي كتبتها. حاول كتابة أسماء المنتجات كما تظهر في المتجر.",
      "bot"
    );

    return;

  }


  let reply =
    "وجدت لك المنتجات التالية ✅\n\n";


  let total = 0;


  foundProducts.forEach(
    (product, index) => {

      const price =
        Number(product.price) || 0;

      const quantity =
        Number(product.quantity) || 1;

      const productTotal =
        price * quantity;

      total += productTotal;


      reply +=
        "🛍️ " +
        product.name +
        "\n" +

        "📦 الكمية: " +
        quantity +
        "\n" +

        "💰 سعر الحبة: " +
        price +
        "\n" +

        "💵 الإجمالي: " +
        productTotal +
        "\n";


      if (
        index <
        foundProducts.length - 1
      ) {

        reply += "\n";

      }

    }
  );


  reply +=
    "\n💰 إجمالي المنتجات: " +
    total +

    "\n\nهل تريد إتمام الطلب؟";


  addMessage(
    reply,
    "bot"
  );

}


// زر الإرسال
sendButton.addEventListener(
  "click",
  sendMessage
);


// زر Enter
input.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {

      sendMessage();

    }

  }
);
