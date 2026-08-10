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


// تحويل الأرقام العربية
function numbers(text) {

  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const english = "0123456789";

  return text.replace(/[٠-٩]/g, function(n) {

    return english[arabic.indexOf(n)];

  });

}


// تنظيف النص
function clean(text) {

  return numbers(text)
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .trim();

}


// قراءة المنتجات من Firebase
async function getProducts() {

  const result = [];

  const names = ["products", "منتجات"];

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

        result.push({
          name: name,
          price: price
        });

      });

    } catch(error) {

      console.error(error);

    }

  }

  return result;
}


// استخراج الكمية
function getQuantity(text) {

  const value = clean(text);

  const match = value.match(/\d+/);

  if (match) {

    return Number(match[0]);

  }

  return 1;
}


// إزالة الرقم وكلمات الطلب
function getProductText(text) {

  return clean(text)
    .replace(/\d+/g, "")
    .replace(/اريد/g, "")
    .replace(/أريد/g, "")
    .replace(/اشتي/g, "")
    .replace(/ابغى/g, "")
    .replace(/ابي/g, "")
    .replace(/عدد/g, "")
    .replace(/حبه/g, "")
    .replace(/حبات/g, "")
    .trim();

}


// البحث عن المنتج
async function findProduct(text) {

  const products = await getProducts();

  const productText =
    getProductText(text);

  for (const product of products) {

    const productName =
      clean(product.name);

    if (
      productName.includes(productText) ||
      productText.includes(productName)
    ) {

      return product;

    }

  }

  return null;
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
    "🔎 أبحث عن المنتج...",
    "bot"
  );


  const product =
    await findProduct(text);


  // حذف رسالة البحث
  const messages =
    chat.querySelectorAll(".bot");

  if (messages.length) {

    messages[
      messages.length - 1
    ].remove();

  }


  if (!product) {

    addMessage(
      "❌ لم أجد هذا المنتج في المتجر.",
      "bot"
    );

    return;

  }


  const quantity =
    getQuantity(text);


  const total =
    product.price * quantity;


  addMessage(

    "وجدت المنتج ✅\n\n" +

    "🛍️ المنتج: " +
    product.name +

    "\n📦 الكمية: " +
    quantity +

    "\n💰 سعر الوحدة: " +
    product.price +
    " ريال" +

    "\n💵 الإجمالي: " +
    total +
    " ريال" +

    "\n\nهل تريد إتمام الطلب؟",

    "bot"

  );

}


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
