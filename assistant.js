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

const chat =
  document.getElementById("chat");

const messageInput =
  document.getElementById("messageInput");

const sendButton =
  document.getElementById("sendButton");


/* =========================================
   المنتجات
========================================= */

let products = [];


/* =========================================
   حالة المساعد
========================================= */

window.currentAssistantOrder = null;

let assistantStep = "shop";

let selectedShop =
  localStorage.getItem("selectedShop") || "";


let customerData = {

  name: "",
  phone: "",
  district: ""

};


/* =========================================
   تحميل المنتجات
========================================= */

async function loadProducts() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "products")
      );


    products = [];


    snapshot.forEach(doc => {

      const data =
        doc.data();


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
          "",

        shopName:
          data.shopName ||
          data.اسم_المتجر ||
          ""

      });

    });


    if (!products.length) {

      addBotMessage(
        "⚠️ لا توجد منتجات حاليًا."
      );

      return;

    }


    /* =====================================
       إذا كان هناك تاجر محفوظ
    ===================================== */

    if (selectedShop) {

      const shopExists =
        products.some(
          product =>
            product.shopName ===
            selectedShop
        );


      if (shopExists) {

        addBotMessage(
          "🤖 أهلًا بك في سوق مباشر 🌹<br><br>" +

          "🏪 التاجر المحدد حاليًا:<br>" +

          "<strong>" +
          escapeHtml(selectedShop) +
          "</strong><br><br>" +

          "اكتب اسم المنتج والكمية التي تريدها.<br><br>" +

          "مثال:<br>" +

          "دقيق قمح 10"
        );

        assistantStep =
          "product";

        return;

      }

    }


    /* =====================================
       اختيار التاجر
    ===================================== */

    showShopSelection();


  } catch (error) {

    console.error(
      "خطأ تحميل المنتجات:",
      error
    );


    addBotMessage(
      "حدث خطأ أثناء تحميل المنتجات ❌<br><br>" +

      escapeHtml(
        error.message ||
        String(error)
      )
    );

  }

}


/* =========================================
   عرض التجار
========================================= */

function showShopSelection() {

  const shops = {};


  products.forEach(product => {

    const shopName =
      String(
        product.shopName ||
        "سوق مباشر"
      ).trim();


    if (shopName) {

      shops[shopName] = true;

    }

  });


  const shopNames =
    Object.keys(shops);


  if (!shopNames.length) {

    addBotMessage(
      "⚠️ لا توجد أسماء تجار في المنتجات حاليًا."
    );

    return;

  }


  let html =
    "🤖 أهلًا بك في سوق مباشر 🌹<br><br>" +

    "<strong>🏪 أولًا اختر التاجر الذي تريد الشراء منه:</strong><br><br>";


  shopNames.forEach(shopName => {

    html += `

      <button
        class="assistant-shop-button"
        data-shop="${escapeHtml(shopName)}"
        style="
          display:block;
          width:100%;
          margin:8px 0;
          padding:13px;
          border:none;
          border-radius:12px;
          background:linear-gradient(
            135deg,
            #009688,
            #00796b
          );
          color:white;
          font-size:15px;
          font-weight:bold;
          cursor:pointer;
        "
      >
        🏪 ${escapeHtml(shopName)}
      </button>

    `;

  });


  addBotMessage(html);


  const buttons =
    document.querySelectorAll(
      ".assistant-shop-button"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const shopName =
          button.dataset.shop;


        chooseAssistantShop(
          shopName
        );

      }
    );

  });

}


/* =========================================
   اختيار تاجر المساعد
========================================= */

function chooseAssistantShop(shopName) {

  /* =====================================
     فحص السلة
  ===================================== */

  const cart =
    JSON.parse(
      localStorage.getItem("cart")
    ) || [];


  if (cart.length > 0) {

    const cartShop =
      String(
        cart[0].shopName ||
        ""
      ).trim();


    if (
      cartShop &&
      cartShop !== shopName
    ) {

      addBotMessage(
        "⚠️ السلة تحتوي حاليًا على منتجات من:<br><br>" +

        "<strong>" +
        escapeHtml(cartShop) +
        "</strong><br><br>" +

        "لا يمكن إنشاء طلب من تاجر آخر في نفس السلة.<br>" +

        "أكمل الطلب الحالي أو أفرغ السلة أولًا."
      );

      return;

    }

  }


  selectedShop =
    shopName;


  localStorage.setItem(
    "selectedShop",
    selectedShop
  );


  assistantStep =
    "product";


  addBotMessage(

    "✅ تم اختيار التاجر:<br><br>" +

    "🏪 <strong>" +
    escapeHtml(selectedShop) +
    "</strong><br><br>" +

    "الآن اكتب اسم المنتج والكمية التي تريدها.<br><br>" +

    "مثال:<br>" +

    "دقيق قمح 10"

  );

}


/* =========================================
   رسالة المساعد
========================================= */

function addBotMessage(text) {

  const div =
    document.createElement("div");


  div.className =
    "message bot";


  div.innerHTML =
    text;


  chat.appendChild(div);


  scrollChat();

}


/* =========================================
   رسالة العميل
========================================= */

function addUserMessage(text) {

  const div =
    document.createElement("div");


  div.className =
    "message user";


  div.textContent =
    text;


  chat.appendChild(div);


  scrollChat();

}


/* =========================================
   النزول لآخر المحادثة
========================================= */

function scrollChat() {

  window.scrollTo({

    top:
      document.body.scrollHeight,

    behavior:
      "smooth"

  });

}


/* =========================================
   تطبيع العربي
========================================= */

function normalizeArabic(text) {

  return String(text || "")

    .toLowerCase()

    .replace(
      /[إأآ]/g,
      "ا"
    )

    .replace(
      /ة/g,
      "ه"
    )

    .replace(
      /ى/g,
      "ي"
    )

    .replace(
      /ؤ/g,
      "و"
    )

    .replace(
      /ئ/g,
      "ي"
    )

    .replace(
      /[ًٌٍَُِّْـ]/g,
      ""
    )

    .trim();

}


/* =========================================
   البحث عن المنتجات
   من التاجر المختار فقط
========================================= */

function findProducts(text) {

  const words =
    normalizeArabic(text)

      .split(/\s+/)

      .filter(
        word =>
          word.length >= 2
      );


  if (!words.length) {

    return [];

  }


  return products

    .filter(product => {

      const productShop =
        String(
          product.shopName ||
          "سوق مباشر"
        ).trim();


      return (
        productShop ===
        selectedShop
      );

    })

    .map(product => {

      const productName =
        normalizeArabic(
          product.name
        );


      let score = 0;


      words.forEach(word => {

        if (
          productName.includes(
            word
          )
        ) {

          score += 2;

        }

      });


      return {

        product,
        score

      };

    })

    .filter(
      item =>
        item.score > 0
    )

    .sort(
      (a,b) =>
        b.score - a.score
    )

    .map(
      item =>
        item.product
    );

}


/* =========================================
   استخراج الكمية
========================================= */

function extractQuantity(text) {

  const match =
    String(text).match(
      /\d+/
    );


  if (!match) {

    return 1;

  }


  const quantity =
    Number(
      match[0]
    );


  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {

    return 1;

  }


  return quantity;

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


  addUserMessage(
    cleanText
  );


  const lower =
    normalizeArabic(
      cleanText
    );


  /* =====================================
     إذا لم يتم اختيار تاجر
  ===================================== */

  if (
    !selectedShop ||
    assistantStep === "shop"
  ) {

    showShopSelection();

    return;

  }


  /* =====================================
     تحية
  ===================================== */

  if (
    lower === "السلام عليكم" ||
    lower === "السلام عليكم ورحمه الله" ||
    lower === "سلام" ||
    lower.includes("مرحبا") ||
    lower.includes("هلا")
  ) {

    addBotMessage(

      "وعليكم السلام ورحمة الله وبركاته 🌹<br><br>" +

      "🏪 التاجر المختار:<br>" +

      "<strong>" +
      escapeHtml(selectedShop) +
      "</strong><br><br>" +

      "اكتب اسم المنتج والكمية التي تريدها."

    );

    return;

  }


  /* =====================================
     مساعدة
  ===================================== */

  if (
    lower.includes("مساعده") ||
    lower.includes("كيف اطلب")
  ) {

    addBotMessage(

      "بكل سهولة 👍<br><br>" +

      "أنت الآن تطلب من:<br>" +

      "🏪 <strong>" +
      escapeHtml(selectedShop) +
      "</strong><br><br>" +

      "اكتب مثلًا:<br>" +

      "دقيق قمح 10<br><br>" +

      "وسأبحث لك عن المنتج."

    );

    return;

  }


  /* =====================================
     تغيير التاجر
  ===================================== */

  if (
    lower.includes("غير التاجر") ||
    lower.includes("تاجر اخر") ||
    lower.includes("تاجر ثاني")
  ) {

    const cart =
      JSON.parse(
        localStorage.getItem("cart")
      ) || [];


    if (cart.length > 0) {

      addBotMessage(

        "⚠️ لا يمكن تغيير التاجر الآن لأن السلة تحتوي على منتجات من:<br><br>" +

        "<strong>" +
        escapeHtml(
          cart[0].shopName || ""
        ) +
        "</strong><br><br>" +

        "أكمل الطلب الحالي أو أفرغ السلة أولًا."

      );

      return;

    }


    selectedShop = "";

    localStorage.removeItem(
      "selectedShop"
    );


    assistantStep =
      "shop";


    showShopSelection();

    return;

  }


  /* =====================================
     البحث عن المنتج
  ===================================== */

  const found =
    findProducts(
      cleanText
    );


  if (!found.length) {

    addBotMessage(

      "لم أجد هذا المنتج عند التاجر:<br><br>" +

      "🏪 <strong>" +
      escapeHtml(selectedShop) +
      "</strong><br><br>" +

      "جرّب كتابة اسم المنتج بشكل أوضح."

    );

    return;

  }


  const product =
    found[0];


  const quantity =
    extractQuantity(
      cleanText
    );


  const total =
    product.price *
    quantity;


  /* =====================================
     عرض المنتج
  ===================================== */

  let html = "";


  html +=
    "وجدت لك هذا المنتج 👇<br><br>";


  html +=
    "🏪 التاجر: <strong>" +

    escapeHtml(
      product.shopName
    ) +

    "</strong><br>";


  html +=
    "🛍️ المنتج: <strong>" +

    escapeHtml(
      product.name
    ) +

    "</strong><br>";


  html +=
    "💰 السعر: " +

    Number(
      product.price
    ).toLocaleString() +

    " ريال<br>";


  html +=
    "📦 الكمية: " +

    quantity +

    "<br>";


  html +=
    "💵 الإجمالي: " +

    Number(
      total
    ).toLocaleString() +

    " ريال<br><br>";


  html +=
    "إذا تريد طلبه، اضغط الزر التالي 👇";


  html +=

    "<br><br>" +

    `<button
      class="assistant-order-button"
      style="
        width:100%;
        padding:13px;
        border:none;
        border-radius:12px;
        background:#009688;
        color:white;
        font-size:15px;
        font-weight:bold;
        cursor:pointer;
      "
    >
      🛒 طلب هذا المنتج
    </button>`;


  addBotMessage(
    html
  );


  const buttons =
    document.querySelectorAll(
      ".assistant-order-button"
    );


  const button =
    buttons[
      buttons.length - 1
    ];


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
   تجهيز الطلب
========================================= */

function prepareOrder(
  product,
  quantity
) {

  /* =====================================
     حماية التاجر
  ===================================== */

  const productShop =
    String(
      product.shopName ||
      "سوق مباشر"
    ).trim();


  if (
    selectedShop !==
    productShop
  ) {

    addBotMessage(
      "⚠️ هذا المنتج تابع لتاجر مختلف."
    );

    return;

  }


  /* =====================================
     فحص السلة
  ===================================== */

  const cart =
    JSON.parse(
      localStorage.getItem("cart")
    ) || [];


  if (cart.length > 0) {

    const cartShop =
      String(
        cart[0].shopName ||
        ""
      ).trim();


    if (
      cartShop &&
      cartShop !== productShop
    ) {

      addBotMessage(

        "⚠️ السلة تحتوي على منتجات من تاجر آخر.<br><br>" +

        "أكمل الطلب الحالي أو أفرغ السلة أولًا."

      );

      return;

    }

  }


  const total =
    product.price *
    quantity;


  /* =====================================
     حفظ الطلب المؤقت
  ===================================== */

  window.currentAssistantOrder = {

    productId:
      product.id,

    name:
      product.name,

    price:
      Number(
        product.price
      ),

    quantity:
      Number(
        quantity
      ),

    category:
      product.category || "",

    sellerId:
      product.sellerId || "",

    shopName:
      productShop,

    total:
      Number(
        total
      )

  };


  /* =====================================
     تصفير بيانات العميل
  ===================================== */

  customerData = {

    name: "",
    phone: "",
    district: ""

  };


  assistantStep =
    "name";


  addBotMessage(

    "ممتاز 👍<br><br>" +

    "🏪 التاجر: <strong>" +
    escapeHtml(
      productShop
    ) +
    "</strong><br>" +

    "🛒 المنتج: <strong>" +
    escapeHtml(
      product.name
    ) +
    "</strong><br>" +

    "📦 الكمية: <strong>" +
    quantity +
    "</strong><br>" +

    "💰 الإجمالي: <strong>" +

    Number(
      total
    ).toLocaleString() +

    " ريال</strong><br><br>" +

    "👤 ما اسم العميل؟"

  );

}


/* =========================================
   بيانات العميل
========================================= */

async function processCustomerStep(
  text
) {

  const cleanText =
    String(text || "").trim();


  if (!cleanText) {

    return;

  }


  /* =====================================
     الاسم
  ===================================== */

  if (
    assistantStep === "name"
  ) {

    customerData.name =
      cleanText;


    assistantStep =
      "phone";


    addUserMessage(
      cleanText
    );


    addBotMessage(

      "أهلًا " +

      escapeHtml(
        customerData.name
      ) +

      " 🌹<br><br>" +

      "📱 الآن اكتب رقم الجوال."

    );


    return;

  }


  /* =====================================
     الرقم
  ===================================== */

  if (
    assistantStep === "phone"
  ) {

    const phone =
      cleanText.replace(
        /[\s-]/g,
        ""
      );


    if (
      phone.length < 7
    ) {

      addUserMessage(
        cleanText
      );


      addBotMessage(

        "📱 يبدو أن رقم الجوال غير صحيح.<br><br>" +

        "اكتب رقم الجوال مرة أخرى."

      );


      return;

    }


    customerData.phone =
      cleanText;


    assistantStep =
      "district";


    addUserMessage(
      cleanText
    );


    addBotMessage(

      "تمام 👍<br><br>" +

      "📍 الآن اكتب اسم الحي."

    );


    return;

  }


  /* =====================================
     الحي
  ===================================== */

  if (
    assistantStep === "district"
  ) {

    customerData.district =
      cleanText;


    addUserMessage(
      cleanText
    );


    addBotMessage(
      "⏳ جاري تسجيل طلبك..."
    );


    await saveAssistantOrder();


    return;

  }

}


/* =========================================
   حفظ طلب المساعد
========================================= */

async function saveAssistantOrder() {

  const order =
    window.currentAssistantOrder;


  if (!order) {

    addBotMessage(
      "أولًا اختر المنتج الذي تريد طلبه 🛒"
    );


    assistantStep =
      "product";


    return;

  }


  /* =====================================
     حماية أخيرة من اختلاف التجار
  ===================================== */

  if (
    order.shopName !==
    selectedShop
  ) {

    addBotMessage(

      "❌ تعذر تسجيل الطلب لأن التاجر غير مطابق."

    );

    return;

  }


  const orderData = {

    customerName:
      customerData.name,

    customerPhone:
      customerData.phone,

    customerCity:
      "إب",

    customerAddress:
      customerData.district,

    deliveryArea:
      customerData.district,

    orderType:
      "طلب بواسطة المساعد الذكي",

    deliveryTime:
      "بعد تجهيز الطلب والتواصل مع العميل",

    deliveryFee:
      0,

    cartonsTotal:
      Number(
        order.quantity
      ),

    /* ===================================
       بيانات التاجر
    =================================== */

    shopName:
      order.shopName,

    sellerId:
      order.sellerId || "",


    products: [

      {

        id:
          order.productId,

        name:
          order.name,

        price:
          Number(
            order.price
          ),

        quantity:
          Number(
            order.quantity
          ),

        category:
          order.category || "",

        sellerId:
          order.sellerId || "",

        shopName:
          order.shopName

      }

    ],


    productsTotal:
      Number(
        order.total
      ),

    total:
      Number(
        order.total
      ),

    status:
      "جديد",

    source:
      "طلب بواسطة المساعد الذكي",

    assistantOrder:
      true,

    createdAt:
      serverTimestamp()

  };


  try {

    /* =====================================
       حفظ في Firestore
    ===================================== */

    const orderRef =
      await addDoc(

        collection(
          db,
          "orders"
        ),

        orderData

      );


    console.log(
      "✅ تم حفظ طلب المساعد:",
      orderRef.id
    );


    /* =====================================
       رسالة واتساب الإدارة
    ===================================== */

    const whatsappMessage =

`🛒 طلب جديد بواسطة المساعد الذكي - سوق مباشر

🏪 التاجر:
${order.shopName}

👤 اسم العميل:
${customerData.name}

📱 رقم الجوال:
${customerData.phone}

📍 المدينة:
إب

🏘️ الحي:
${customerData.district}

📦 المنتج:
${order.name}

🔢 الكمية:
${order.quantity} كرتون

💰 سعر المنتج:
${Number(order.price).toLocaleString()} ريال

💵 الإجمالي:
${Number(order.total).toLocaleString()} ريال

🤖 مصدر الطلب:
المساعد الذكي

🆔 رقم الطلب:
${orderRef.id}`;


    /* =====================================
       واتساب الإدارة
    ===================================== */

    const whatsappUrl =

      `https://wa.me/966550496391?text=` +

      encodeURIComponent(
        whatsappMessage
      );


    window.open(
      whatsappUrl,
      "_blank"
    );


    /* =====================================
       نجاح
    ===================================== */

    addBotMessage(

      "✅ تم تسجيل طلبك بنجاح.<br><br>" +

      "🏪 التاجر: " +

      escapeHtml(
        order.shopName
      ) +

      "<br>" +

      "📦 المنتج: " +

      escapeHtml(
        order.name
      ) +

      "<br>" +

      "🔢 الكمية: " +

      order.quantity +

      " كرتون<br>" +

      "💰 الإجمالي: " +

      Number(
        order.total
      ).toLocaleString() +

      " ريال<br><br>" +

      "📱 تم إرسال تفاصيل الطلب للإدارة عبر واتساب.<br><br>" +

      "🆔 رقم الطلب:<br>" +

      escapeHtml(
        orderRef.id
      ) +

      "<br><br>" +

      "سيتم التواصل معك لتأكيد الطلب."

    );


    /* =====================================
       تنظيف
    ===================================== */

    window.currentAssistantOrder =
      null;


    assistantStep =
      "product";


    customerData = {

      name: "",
      phone: "",
      district: ""

    };


  } catch (error) {

    console.error(
      "❌ خطأ حفظ طلب المساعد:",
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
   زر الإرسال
========================================= */

async function sendMessage() {

  const text =
    messageInput.value.trim();


  if (!text) {

    return;

  }


  messageInput.value = "";


  /* =====================================
     بيانات العميل
  ===================================== */

  if (
    assistantStep === "name" ||
    assistantStep === "phone" ||
    assistantStep === "district"
  ) {

    await processCustomerStep(
      text
    );

    return;

  }


  /* =====================================
     اختيار التاجر
  ===================================== */

  if (
    assistantStep === "shop"
  ) {

    addUserMessage(
      text
    );


    addBotMessage(

      "من فضلك اختر التاجر من الأزرار الموجودة بالأعلى 🏪"

    );


    return;

  }


  /* =====================================
     المنتج
  ===================================== */

  await processMessage(
    text
  );

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

  return String(
    text ?? ""
  )

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
   تشغيل المساعد
========================================= */

loadProducts();
