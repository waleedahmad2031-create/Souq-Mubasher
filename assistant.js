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

const WHATSAPP_NUMBER = "966550496391";

let currentOrder = [];
let availableProducts = [];
let orderStage = "products";

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
// الأرقام العربية
// =====================================

function numbers(text) {

  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const english = "0123456789";

  return text.replace(
    /[٠-٩]/g,
    n => english[arabic.indexOf(n)]
  );
}


// =====================================
// تنظيف النص
// =====================================

function clean(text) {

  return numbers(String(text))
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

  const words = [
    "نعم",
    "اي",
    "ايوه",
    "ايوة",
    "ايوا",
    "تمام",
    "موافق",
    "موافقه",
    "اكيد",
    "توكل",
    "توكلنا",
    "خلاص",
    "خلص",
    "ارسل",
    "ارسله",
    "ارسل الطلب",
    "اتمام الطلب",
    "اتم الطلب",
    "اريد الطلب",
    "نعم اريد"
  ];

  return words.some(
    word => value === clean(word)
  );
}


// =====================================
// لا
// =====================================

function isNo(text) {

  const value = clean(text);

  const words = [
    "لا",
    "الغاء",
    "الغ",
    "لا اريد",
    "ما اريد",
    "مش اريد",
    "ما اشتي",
    "مش اشتي",
    "لا اشتي"
  ];

  return words.some(
    word => value === clean(word)
  );
}


// =====================================
// كلمات الكمية
// =====================================

const quantityWords = {

  "واحد": 1,
  "وحده": 1,
  "واحده": 1,

  "اثنين": 2,
  "اثنان": 2,
  "اثنتين": 2,
  "ثنتين": 2,

  "ثلاث": 3,
  "ثلاثه": 3,
  "ثلاثة": 3,

  "اربعه": 4,
  "اربعة": 4,

  "خمسه": 5,
  "خمسة": 5,

  "سته": 6,
  "ستة": 6,

  "سبعه": 7,
  "سبعة": 7,

  "ثمانيه": 8,
  "ثمانية": 8,

  "تسعه": 9,
  "تسعة": 9,

  "عشره": 10,
  "عشرة": 10

};


// =====================================
// استخراج الكمية
// =====================================

function extractQuantity(text) {

  const value = clean(text);

  const numberMatch = value.match(/\d+/);

  if(numberMatch) {

    const number = Number(
      numberMatch[0]
    );

    if(number > 0 && number <= 1000) {
      return number;
    }
  }

  for(const word in quantityWords) {

    if(
      value.includes(
        clean(word)
      )
    ) {

      return quantityWords[word];

    }
  }

  return 1;
}


// =====================================
// رسوم التوصيل
// =====================================

function getDeliveryFee(price) {

  price = Number(price || 0);

  if(price < 1500) {
    return 50;
  }

  if(price < 2000) {
    return 70;
  }

  return 100;
}


// =====================================
// تحميل المنتجات
// =====================================

async function getProducts() {

  const result = [];

  try {

    const snapshot = await getDocs(
      collection(db, "products")
    );

    snapshot.forEach(productDoc => {

      const data = productDoc.data();

      const name =
        data.name ||
        data.اسم ||
        "";

      if(!name) {
        return;
      }

      const price =
        Number(
          data.price ||
          data.سعر ||
          0
        );

      result.push({

        id: productDoc.id,

        name: name,

        price: price,

        image:
          data.image || "",

        city:
          data.city || "",

        description:
          data.description || "",

        shopName:
          data.shopName || "مشتاق وليد",

        category:
          data.category || ""

      });

    });

  } catch(error) {

    console.error(
      "خطأ تحميل المنتجات:",
      error
    );

    throw error;

  }

  return result;
}


// =====================================
// كمية المنتج
// =====================================

function getProductQuantity(
  text,
  productName
) {

  const value = clean(text);
  const name = clean(productName);

  const position = value.indexOf(name);

  if(position === -1) {

    return extractQuantity(text);

  }

  const before = value.substring(
    Math.max(0, position - 30),
    position
  );

  const after = value.substring(
    position + name.length,
    position + name.length + 30
  );

  const numbersBefore =
    before.match(/\d+/g);

  if(numbersBefore) {

    const quantity =
      Number(
        numbersBefore[
          numbersBefore.length - 1
        ]
      );

    if(quantity > 0 && quantity <= 1000) {
      return quantity;
    }
  }

  for(const word in quantityWords) {

    if(
      before.includes(
        clean(word)
      )
    ) {

      return quantityWords[word];

    }
  }

  const numbersAfter =
    after.match(/\d+/g);

  if(numbersAfter) {

    const quantity =
      Number(numbersAfter[0]);

    if(quantity > 0 && quantity <= 1000) {
      return quantity;
    }
  }

  for(const word in quantityWords) {

    if(
      after.includes(
        clean(word)
      )
    ) {

      return quantityWords[word];

    }
  }

  return 1;
}


// =====================================
// البحث عن المنتجات
// =====================================

function findProducts(
  text,
  products
) {

  const value = clean(text);

  const found = [];

  const sorted = [...products].sort(
    (a,b) =>
      clean(b.name).length -
      clean(a.name).length
  );

  for(const product of sorted) {

    const productName =
      clean(product.name);

    if(
      value.includes(productName)
    ) {

      const quantity =
        getProductQuantity(
          text,
          product.name
        );

      found.push({

        ...product,

        quantity: quantity,

        total:
          product.price *
          quantity

      });

    }

  }

  return found;
}


// =====================================
// بحث مشابه
// =====================================

function findSimilarProducts(
  text,
  products
) {

  const value = clean(text);

  const words = value.split(" ");

  const found = [];

  for(const product of products) {

    const productName =
      clean(product.name);

    const match =
      words.some(word => {

        if(word.length < 2) {
          return false;
        }

        return productName.includes(word);

      });

    if(match) {

      if(
        !found.some(
          item =>
            item.id === product.id
        )
      ) {

        found.push(product);

      }

    }

  }

  return found;
}


// =====================================
// عرض الاختيارات
// =====================================

function showProductChoices(products) {

  let message =
    "وجدت أكثر من نوع 👇\n\n";

  products.forEach(
    (product,index) => {

      message +=
        `${index + 1}. ${product.name} — ${product.price.toLocaleString()} ريال للكرتون\n`;

    }
  );

  message +=
    "\nاكتب اسم المنتج أو رقم الخيار.";

  availableProducts = products;

  orderStage = "chooseProduct";

  addMessage(
    message,
    "bot"
  );
}


// =====================================
// إضافة منتج للطلب
// =====================================

function addSelectedProduct(
  product,
  quantity
) {

  const existing =
    currentOrder.find(
      item =>
        item.id === product.id
    );

  if(existing) {

    existing.quantity += quantity;

    existing.total =
      existing.price *
      existing.quantity;

    return;
  }

  currentOrder.push({

    id: product.id,

    name: product.name,

    price: Number(product.price || 0),

    quantity: quantity,

    total:
      Number(product.price || 0) *
      quantity,

    image:
      product.image || "",

    city:
      product.city || "",

    description:
      product.description || "",

    shopName:
      product.shopName || "مشتاق وليد"

  });
}


// =====================================
// عرض الطلب
// =====================================

function showOrder() {

  let message =
    "وجدت لك المنتجات التالية ✅\n\n";

  let productsTotal = 0;
  let deliveryTotal = 0;
  let cartonsTotal = 0;

  currentOrder.forEach(product => {

    const delivery =
      getDeliveryFee(product.price);

    productsTotal +=
      product.total;

    cartonsTotal +=
      product.quantity;

    deliveryTotal +=
      delivery *
      product.quantity;

    message +=
      `🛍️ ${product.name}\n` +
      `📦 الكمية: ${product.quantity} كرتون\n` +
      `💰 سعر الكرتون: ${product.price.toLocaleString()} ريال\n` +
      `🚚 توصيل الكرتون: ${delivery} ريال\n\n`;

  });

  const finalTotal =
    productsTotal +
    deliveryTotal;

  message +=
    "━━━━━━━━━━━━\n" +
    `📦 عدد الكراتين: ${cartonsTotal}\n` +
    `🛍️ مجموع المنتجات: ${productsTotal.toLocaleString()} ريال\n` +
    `🚚 رسوم التوصيل: ${deliveryTotal.toLocaleString()} ريال\n` +
    `💰 الإجمالي النهائي: ${finalTotal.toLocaleString()} ريال\n\n` +
    "هل تريد إتمام الطلب؟\n\n" +
    "اكتب: نعم أو لا";

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
    "تمام 👍\n\nأرسل عنوان التوصيل بالتفصيل داخل مدينة إب.",
    "bot"
  );
}


// =====================================
// المراجعة النهائية
// =====================================

function showFinalOrder() {

  let message =
    "📋 مراجعة الطلب\n\n";

  let productsTotal = 0;
  let deliveryTotal = 0;
  let cartonsTotal = 0;

  currentOrder.forEach(product => {

    productsTotal +=
      product.total;

    cartonsTotal +=
      product.quantity;

    deliveryTotal +=
      getDeliveryFee(product.price) *
      product.quantity;

    message +=
      `🛍️ ${product.name} × ${product.quantity} = ${product.total.toLocaleString()} ريال\n`;

  });

  const finalTotal =
    productsTotal +
    deliveryTotal;

  message +=
    `\n📦 عدد الكراتين: ${cartonsTotal}` +
    `\n🛍️ مجموع المنتجات: ${productsTotal.toLocaleString()} ريال` +
    `\n🚚 رسوم التوصيل: ${deliveryTotal.toLocaleString()} ريال` +
    `\n💰 الإجمالي النهائي: ${finalTotal.toLocaleString()} ريال` +
    `\n\n👤 الاسم: ${customer.name}` +
    `\n📱 الجوال: ${customer.phone}` +
    `\n📍 العنوان: ${customer.address}` +
    "\n\nهل تؤكد إرسال الطلب؟\n\nاكتب: نعم أو لا";

  orderStage = "finalConfirm";

  addMessage(
    message,
    "bot"
  );
}


// =====================================
// حفظ الطلب في Firebase
// =====================================

async function saveOrder() {

  let productsTotal = 0;
  let deliveryTotal = 0;
  let cartonsTotal = 0;

  currentOrder.forEach(product => {

    productsTotal +=
      product.total;

    cartonsTotal +=
      product.quantity;

    deliveryTotal +=
      getDeliveryFee(product.price) *
      product.quantity;

  });

  const finalTotal =
    productsTotal +
    deliveryTotal;


  const orderData = {

    customerName:
      String(customer.name),

    customerPhone:
      String(customer.phone),

    customerCity:
      "إب",

    customerAddress:
      String(customer.address),

    deliveryArea:
      "مدينة إب",

    orderType:
      "جملة",

    deliveryTime:
      "مساءً - من بعد المغرب حتى 10 مساءً",

    deliveryFee:
      Number(deliveryTotal),

    cartonsTotal:
      Number(cartonsTotal),

    products:
      currentOrder,

    productsTotal:
      Number(productsTotal),

    total:
      Number(finalTotal),

    status:
      "جديد",

    source:
      "طلب بواسطة المساعد الذكي",

    createdAt:
      serverTimestamp()

  };


  console.log(
    "بيانات الطلب:",
    orderData
  );


  try {

    await addDoc(
      collection(
        db,
        "orders"
      ),
      orderData
    );


    addMessage(
      "✅ تم تسجيل طلبك بنجاح.\n\n📦 وصل الطلب إلى لوحة الإدارة.",
      "bot"
    );


    sendWhatsApp(
      orderData
    );


    currentOrder = [];

    availableProducts = [];

    customer = {
      name: "",
      phone: "",
      address: ""
    };

    orderStage = "products";


  } catch(error) {

    console.error(
      "خطأ حفظ الطلب:",
      error
    );

    addMessage(
      "❌ لم يتم تسجيل الطلب.\n\n" +
      "سبب الخطأ:\n" +
      error.code +
      "\n\n" +
      error.message,
      "bot"
    );

  }
}


// =====================================
// واتساب
// =====================================

function sendWhatsApp(order) {

  let message =
    "🛒 طلب جديد من سوق مباشر\n\n";

  message +=
    `👤 الاسم: ${order.customerName}\n`;

  message +=
    `📱 الجوال: ${order.customerPhone}\n`;

  message +=
    `📍 إب\n`;

  message +=
    `🏠 العنوان: ${order.customerAddress}\n\n`;

  message +=
    "🛍️ المنتجات:\n";

  order.products.forEach(product => {

    message +=
      `- ${product.name} × ${product.quantity} = ${product.total.toLocaleString()} ريال\n`;

  });

  message +=
    `\n📦 عدد الكراتين: ${order.cartonsTotal}`;

  message +=
    `\n🛍️ مجموع المنتجات: ${order.productsTotal.toLocaleString()} ريال`;

  message +=
    `\n🚚 رسوم التوصيل: ${order.deliveryFee.toLocaleString()} ريال`;

  message +=
    `\n💰 الإجمالي النهائي: ${order.total.toLocaleString()} ريال`;

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

  if(!text) {
    return;
  }

  addMessage(
    text,
    "user"
  );

  input.value = "";


  // ===================================
  // المنتجات
  // ===================================

  if(orderStage === "products") {

    addMessage(
      "🔎 أبحث عن المنتجات...",
      "bot"
    );

    try {

      const products =
        await getProducts();


      const loadingMessages =
        chat.querySelectorAll(".bot");

      if(loadingMessages.length) {

        loadingMessages[
          loadingMessages.length - 1
        ].remove();

      }


      if(!products.length) {

        addMessage(
          "❌ لا توجد منتجات متاحة حاليًا.",
          "bot"
        );

        return;
      }


      const found =
        findProducts(
          text,
          products
        );


      if(found.length) {

        currentOrder = [];

        found.forEach(product => {

          addSelectedProduct(
            product,
            product.quantity
          );

        });

        orderStage = "confirm";

        showOrder();

        return;
      }


      const similar =
        findSimilarProducts(
          text,
          products
        );


      if(!similar.length) {

        addMessage(
          "❌ لم أجد المنتج.\n\nاكتب اسم المنتج كما يظهر في المتجر.",
          "bot"
        );

        return;
      }


      if(similar.length > 1) {

        showProductChoices(
          similar
        );

        return;
      }


      addSelectedProduct(
        similar[0],
        extractQuantity(text)
      );

      orderStage = "confirm";

      showOrder();

    } catch(error) {

      console.error(error);

      addMessage(
        "❌ تعذر الاتصال بالمنتجات.\n\n" +
        error.message,
        "bot"
      );
    }

    return;
  }


  // ===================================
  // اختيار المنتج
  // ===================================

  if(orderStage === "chooseProduct") {

    const numberMatch =
      clean(text).match(/^\d+$/);


    if(numberMatch) {

      const index =
        Number(numberMatch[0]) - 1;

      if(
        index >= 0 &&
        index < availableProducts.length
      ) {

        const product =
          availableProducts[index];

        addSelectedProduct(
          product,
          1
        );

        availableProducts = [];

        orderStage = "confirm";

        showOrder();

        return;
      }
    }


    const selected =
      findProducts(
        text,
        availableProducts
      );


    if(selected.length) {

      addSelectedProduct(
        selected[0],
        selected[0].quantity
      );

      availableProducts = [];

      orderStage = "confirm";

      showOrder();

      return;
    }


    addMessage(
      "اكتب اسم المنتج أو رقم الخيار.",
      "bot"
    );

    return;
  }


  // ===================================
  // تأكيد الطلب
  // ===================================

  if(orderStage === "confirm") {

    if(isYes(text)) {

      askName();

      return;
    }

    if(isNo(text)) {

      currentOrder = [];

      orderStage = "products";

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


  // ===================================
  // الاسم
  // ===================================

  if(orderStage === "name") {

    if(text.length < 2) {

      addMessage(
        "اكتب الاسم بشكل صحيح من فضلك.",
        "bot"
      );

      return;
    }

    customer.name = text;

    askPhone();

    return;
  }


  // ===================================
  // الجوال
  // ===================================

  if(orderStage === "phone") {

    const phone =
      numbers(text)
      .replace(/\s/g, "")
      .replace(/-/g, "");

    if(phone.length < 9) {

      addMessage(
        "📱 أرسل رقم جوال صحيح من فضلك.",
        "bot"
      );

      return;
    }

    customer.phone = phone;

    askAddress();

    return;
  }


  // ===================================
  // العنوان
  // ===================================

  if(orderStage === "address") {

    if(text.length < 3) {

      addMessage(
        "📍 اكتب العنوان بالتفصيل من فضلك.",
        "bot"
      );

      return;
    }

    customer.address = text;

    showFinalOrder();

    return;
  }


  // ===================================
  // التأكيد النهائي
  // ===================================

  if(orderStage === "finalConfirm") {

    if(isYes(text)) {

      addMessage(
        "⏳ جاري تسجيل الطلب...",
        "bot"
      );

      await saveOrder();

      return;
    }


    if(isNo(text)) {

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


// =====================================
// الأحداث
// =====================================

sendButton.addEventListener(
  "click",
  sendMessage
);


input.addEventListener(
  "keydown",
  event => {

    if(event.key === "Enter") {

      sendMessage();

    }

  }
);
