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


function cleanText(text) {

  return text
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .trim();

}


function getQuantity(text) {

  const number = text.match(/\d+/);

  if (number) {
    return parseInt(number[0]);
  }

  return 1;
}


function getProductName(text) {

  let name = text;

  name = name
    .replace(/عدد\s*\d+/gi, "")
    .replace(/\d+/g, "")
    .replace(/حبه|حبات|كيلو|كجم|كغ|قطعه|قطع/gi, "")
    .replace(/اريد|أريد|ابغى|أبغى|اشتي|أشتي|ارغب|أرغب/gi, "")
    .replace(/من|عندكم|لو سمحت/gi, "")
    .trim();

  return name;
}


async function searchProducts(productName) {

  const results = [];

  const searchName = cleanText(productName);

  const collections = ["products", "منتجات"];

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

        const productClean = cleanText(name);

        if (
          productClean.includes(searchName) ||
          searchName.includes(productClean)
        ) {

          results.push({

            id: doc.id,

            name: name,

            price:
              data.price ||
              data.سعر ||
              0

          });

        }

      });

    } catch (error) {

      console.error(error);

    }

  }

  return results;
}


async function sendMessage() {

  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "user");

  input.value = "";

  addMessage(
    "🔎 لحظة، أبحث لك عن المنتج...",
    "bot"
  );

  const quantity = getQuantity(text);

  const productName = getProductName(text);

  const products =
    await searchProducts(productName);


  const messages =
    chat.querySelectorAll(".bot");

  if (messages.length) {

    messages[messages.length - 1].remove();

  }


  if (products.length === 0) {

    addMessage(
      "عذرًا 🌹 لم أجد هذا المنتج حاليًا. حاول كتابة اسم المنتج كما هو موجود في المتجر.",
      "bot"
    );

    return;
  }


  const product = products[0];


  addMessage(

    "وجدت المنتج ✅\n\n" +

    "🛍️ المنتج: " +
    product.name +

    "\n💰 السعر: " +
    product.price +

    "\n📦 الكمية: " +
    quantity +

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
