import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");


function addMessage(text, type){

  const message = document.createElement("div");

  message.className = "message " + type;

  message.innerText = text;

  chat.appendChild(message);

  window.scrollTo(0, document.body.scrollHeight);
}


function cleanText(text){

  return text
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/أ|إ|آ/g, "ا")
    .replace(/ة/g, "ه")
    .trim();

}


function getQuantity(text){

  const numbers = text.match(/\d+/);

  if(numbers){
    return parseInt(numbers[0]);
  }

  return 1;
}


function getProductName(text){

  let name = text;

  name = name
    .replace(/عدد\s*\d+/gi, "")
    .replace(/\d+/g, "")
    .replace(/حبه|حبات|كيلو|كجم|كغ|قطعه|قطع/gi, "")
    .replace(/اريد|أريد|ابغى|أبغى|اشتي|أشتي|ارغب|أرغب/gi, "")
    .replace(/من|عندكم|عندي|لو سمحت/gi, "")
    .trim();

  return name;

}


async function searchProducts(productName){

  const results = [];

  const collections = ["products", "منتجات"];

  const searchName = cleanText(productName);

  for(const collectionName of collections){

    try{

      const snapshot = await getDocs(
        collection(db, collectionName)
      );

      snapshot.forEach((doc) => {

        const data = doc.data();

        const name =
          data.name ||
          data.اسم ||
          "";

        if(!name) return;

        const productNameClean = cleanText(name);

        if(
          productNameClean.includes(searchName) ||
          searchName.includes(productNameClean)
        ){

          results.push({
            id: doc.id,
            name: name,
            price: data.price || data.سعر || 0,
            image: data.image || data.صورة || "",
            description: data.description || data.الوصف || ""
          });

        }

      });

    }catch(error){

      console.log(
        "خطأ في قراءة مجموعة:",
        collectionName,
        error
      );

    }

  }

  return results;

}


async function sendMessage(){

  const text = input.value.trim();

  if(!text) return;

  addMessage(text, "user");

  input.value = "";

  addMessage("🔎 لحظة، أبحث لك عن المنتج...", "bot");


  const quantity = getQuantity(text);

  const productName = getProductName(text);

  const products = await searchProducts(productName);


  // حذف رسالة البحث

  const messages = chat.querySelectorAll(".bot");

  if(messages.length){

    messages[messages.length - 1].remove();

  }


  if(products.length === 0){

    addMessage(
      "عذرًا 🌹 لم أجد هذا المنتج حاليًا. جرّب كتابة اسم المنتج بطريقة أخرى.",
      "bot"
    );

    return;

  }


  const product = products[0];

  addMessage(
    "وجدت لك هذا المنتج 👇\n\n" +
    "🛍️ المنتج: " + product.name +
    "\n💰 السعر: " + product.price +
    "\n📦 الكمية: " + quantity +
    "\n\nهل تريد إتمام الطلب؟",
    "bot"
  );

}


input.addEventListener("keydown", function(e){

  if(e.key === "Enter"){

    sendMessage();

  }

});
