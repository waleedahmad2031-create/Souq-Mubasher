import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   عناصر الصفحة
========================================================= */

const chat =
  document.getElementById("chat");

const messageInput =
  document.getElementById("messageInput");

const sendButton =
  document.getElementById("sendButton");


/* =========================================================
   المنتجات
========================================================= */

let products = [];


/* =========================================================
   حالة المساعد
========================================================= */

window.currentAssistantOrder = null;

let assistantStep = "shop";

let selectedShop =
  localStorage.getItem("selectedShop") || "";

let customerData = {
  name: "",
  phone: "",
  district: ""
};


/* =========================================================
   تحميل المنتجات
========================================================= */

async function loadProducts() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "products")
      );

    products = [];

    snapshot.forEach(doc => {

      const data = doc.data();

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


    /* =========================================
       التاجر المحفوظ
    ========================================= */

    if (selectedShop) {

      const exists =
        products.some(product => {

          return String(
            product.shopName || ""
          ).trim() === selectedShop;

        });


      if (exists) {

        assistantStep =
          "product";


        addBotMessage(

          "🤖 أهلًا بك في سوق مباشر 🌹<br><br>" +

          "🏪 التاجر الحالي:<br>" +

          "<strong>" +
          escapeHtml(selectedShop) +
          "</strong><br><br>" +

          "اكتب المنتجات والكميات التي تريدها.<br><br>" +

          "مثال:<br>" +

          "<strong>" +
          "ماء شملان 2 وصابون الساعة 3 وبسكويت ابود 1" +
          "</strong>"

        );

        return;

      }

    }


    showShopSelection();


  } catch (error) {

    console.error(
      "خطأ تحميل المنتجات:",
      error
    );

    addBotMessage(

      "❌ حدث خطأ أثناء تحميل المنتجات.<br><br>" +

      escapeHtml(
        error.message ||
        String(error)
      )

    );

  }

}


/* =========================================================
   عرض التجار
========================================================= */

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

    "<strong>🏪 اختر التاجر الذي تريد الشراء منه:</strong><br><br>";


  shopNames.forEach(shopName => {

    html += `

      <button
        class="assistant-shop-button"
        data-shop="${escapeHtml(shopName)}"
        style="
          display:block;
          width:100%;
          margin:8px 0;
          padding:14px;
          border:none;
          border-radius:12px;
          background:#009688;
          color:white;
          font-size:16px;
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

        chooseAssistantShop(
          button.dataset.shop
        );

      }
    );

  });

}


/* =========================================================
   اختيار التاجر
========================================================= */

function chooseAssistantShop(shopName) {

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

        "لا يمكن إنشاء طلب من تاجر آخر في نفس السلة."

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

    "الآن اكتب المنتجات والكميات.<br><br>" +

    "مثال:<br>" +

    "<strong>" +
    "ماء شملان 2 وصابون الساعة 3 وبسكويت ابود 1" +
    "</strong>"

  );

}


/* =========================================================
   رسائل المساعد
========================================================= */

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


/* =========================================================
   رسالة العميل
========================================================= */

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


/* =========================================================
   النزول لآخر المحادثة
========================================================= */

function scrollChat() {

  window.scrollTo({

    top:
      document.body.scrollHeight,

    behavior:
      "smooth"

  });

}


/* =========================================================
   تحويل الأرقام العربية
========================================================= */

function normalizeDigits(text) {

  return String(text || "")

    .replace(
      /[٠-٩]/g,
      digit =>
        String(
          "٠١٢٣٤٥٦٧٨٩".indexOf(
            digit
          )
        )
    )

    .replace(
      /[۰-۹]/g,
      digit =>
        String(
          "۰۱۲۳۴۵۶۷۸۹".indexOf(
            digit
          )
        )
    );

}


/* =========================================================
   تطبيع النص العربي
========================================================= */

function normalizeArabic(text) {

  return normalizeDigits(text)

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

    .replace(
      /[،,؛;|/]+/g,
      " "
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();

}


/* =========================================================
   نص بدون مسافات
   يساعد على فهم:
   ابو عود / ابوعود / ابود
========================================================= */

function compactArabic(text) {

  return normalizeArabic(text)
    .replace(/\s+/g, "");

}


/* =========================================================
   حساب التشابه بين الكلمات
========================================================= */

function levenshtein(a, b) {

  a = String(a || "");
  b = String(b || "");

  const matrix = [];

  for (
    let i = 0;
    i <= b.length;
    i++
  ) {

    matrix[i] = [i];

  }

  for (
    let j = 0;
    j <= a.length;
    j++
  ) {

    matrix[0][j] = j;

  }

  for (
    let i = 1;
    i <= b.length;
    i++
  ) {

    for (
      let j = 1;
      j <= a.length;
      j++
    ) {

      if (
        b.charAt(i - 1) ===
        a.charAt(j - 1)
      ) {

        matrix[i][j] =
          matrix[i - 1][j - 1];

      } else {

        matrix[i][j] =
          Math.min(

            matrix[i - 1][j] + 1,

            matrix[i][j - 1] + 1,

            matrix[i - 1][j - 1] + 1

          );

      }

    }

  }

  return matrix[b.length][a.length];

}


/* =========================================================
   تشابه كلمتين
========================================================= */

function wordSimilarity(a, b) {

  a = compactArabic(a);
  b = compactArabic(b);

  if (!a || !b) {

    return 0;

  }

  if (a === b) {

    return 1;

  }

  if (
    a.includes(b) ||
    b.includes(a)
  ) {

    return 0.9;

  }

  const distance =
    levenshtein(a, b);

  const maxLength =
    Math.max(
      a.length,
      b.length
    );

  if (!maxLength) {

    return 0;

  }

  return (
    1 -
    distance / maxLength
  );

}


/* =========================================================
   التوصيل لكل كرتون
========================================================= */

function getDeliveryPerCarton(price) {

  price =
    Number(price || 0);


  if (price < 1500) {

    return 50;

  }


  if (price < 2000) {

    return 70;

  }


  return 100;

}


/* =========================================================
   البحث الذكي عن المنتجات
========================================================= */

function findRequestedProducts(text) {

  const shopProducts =
    products.filter(product => {

      const shop =
        String(
          product.shopName ||
          "سوق مباشر"
        ).trim();

      return (
        shop === selectedShop
      );

    });


  if (!shopProducts.length) {

    return [];

  }


  const normalizedText =
    normalizeArabic(text);


  const textWords =
    normalizedText
      .split(/\s+/)
      .filter(Boolean);


  const candidates = [];


  shopProducts.forEach(product => {

    const productName =
      normalizeArabic(
        product.name
      );


    const productWords =
      productName
        .split(/\s+/)
        .filter(Boolean);


    let exactWords = 0;
    let similarWords = 0;


    productWords.forEach(
      productWord => {

        let best = 0;

        textWords.forEach(
          textWord => {

            const similarity =
              wordSimilarity(
                productWord,
                textWord
              );

            if (
              similarity > best
            ) {

              best =
                similarity;

            }

          }
        );


        if (best >= 0.95) {

          exactWords++;

        } else if (best >= 0.65) {

          similarWords++;

        }

      }
    );


    const totalWords =
      productWords.length;


    if (!totalWords) {

      return;

    }


    const score =
      (
        exactWords * 2 +
        similarWords
      ) /
      (totalWords * 2);


    /*
       المنتج يعتبر موجودًا إذا:
       - الاسم كامل موجود
       أو
       - معظم كلمات الاسم متشابهة
    */

    const fullNameFound =
      normalizedText.includes(
        productName
      );


    if (
      fullNameFound ||
      score >= 0.45
    ) {

      candidates.push({

        product,

        score:
          fullNameFound
            ? 1.5
            : score

      });

    }

  });


  candidates.sort(
    (a,b) =>
      b.score - a.score
  );


  /*
     نمنع المساعد من إضافة منتجات
     كثيرة بسبب كلمة مشتركة.
     
     نسمح بالمنتجات التي لها
     تطابق جيد فقط.
  */

  const selected = [];


  candidates.forEach(candidate => {

    if (
      candidate.score >= 0.55 ||
      selected.length === 0
    ) {

      selected.push(
        candidate
      );

    }

  });


  /*
     نرجع المنتجات فقط
  */

  return selected.map(
    item =>
      item.product
  );

}


/* =========================================================
   البحث عن كمية مرتبطة بالمنتج
========================================================= */

function findQuantityForProduct(
  text,
  product,
  allProducts
) {

  const normalizedText =
    normalizeArabic(text);


  const productName =
    normalizeArabic(
      product.name
    );


  /*
     أولًا:
     الاسم الكامل
  */

  let productIndex =
    normalizedText.indexOf(
      productName
    );


  /*
     ثانيًا:
     الاسم بدون مسافات
     مثل:
     ابو عود
     ابود
  */

  if (productIndex === -1) {

    const compactText =
      compactArabic(text);

    const compactName =
      compactArabic(product.name);

    const compactIndex =
      compactText.indexOf(
        compactName
      );


    if (
      compactIndex !== -1
    ) {

      /*
         نستخدم الكلمات للعثور
         على أقرب مكان في النص
      */

      const firstWord =
        productName
          .split(/\s+/)[0];

      productIndex =
        normalizedText.indexOf(
          firstWord
        );

    }

  }


  /*
     إذا لم نستطع تحديد مكان المنتج
  */

  if (productIndex === -1) {

    return 1;

  }


  /*
     نحدد نهاية المنطقة
     قبل المنتج التالي
  */

  let endIndex =
    normalizedText.length;


  allProducts.forEach(
    otherProduct => {

      if (
        otherProduct.id ===
        product.id
      ) {

        return;

      }


      const otherName =
        normalizeArabic(
          otherProduct.name
        );


      const otherIndex =
        normalizedText.indexOf(
          otherName,
          productIndex +
          productName.length
        );


      if (
        otherIndex !== -1 &&
        otherIndex < endIndex
      ) {

        endIndex =
          otherIndex;

      }

    }
  );


  /*
     الجزء بعد اسم المنتج
  */

  const afterProduct =
    normalizedText.substring(
      productIndex +
      productName.length,
      endIndex
    );


  /*
     نبحث عن أول رقم بعد المنتج
  */

  const numberAfter =
    afterProduct.match(
      /\b\d+(?:\.\d+)?\b/
    );


  if (numberAfter) {

    const quantity =
      Number(
        numberAfter[0]
      );


    if (
      Number.isFinite(quantity) &&
      quantity > 0
    ) {

      return quantity;

    }

  }


  /*
     إذا الاسم فيه خطأ
     ولم نستطع تحديد نهاية الاسم،
     نبحث في النص عن الأرقام.
  */

  const numbers =
    normalizedText.match(
      /\b\d+(?:\.\d+)?\b/g
    ) || [];


  /*
     نستخدم ترتيب المنتج
     كحل احتياطي.
  */

  const productIndexInList =
    allProducts.findIndex(
      p =>
        p.id === product.id
    );


  if (
    numbers[productIndexInList]
  ) {

    const quantity =
      Number(
        numbers[
          productIndexInList
        ]
      );


    if (
      Number.isFinite(quantity) &&
      quantity > 0
    ) {

      return quantity;

    }

  }


  return 1;

}


/* =========================================================
   استخراج المنتجات والكميات
========================================================= */

function buildRequestedProducts(
  text
) {

  const requestedProducts =
    findRequestedProducts(
      text
    );


  if (!requestedProducts.length) {

    return [];

  }


  const result = [];


  requestedProducts.forEach(
    product => {

      const quantity =
        findQuantityForProduct(
          text,
          product,
          requestedProducts
        );


      const price =
        Number(
          product.price || 0
        );


      const subtotal =
        price *
        quantity;


      const deliveryPerCarton =
        getDeliveryPerCarton(
          price
        );


      const deliveryTotal =
        deliveryPerCarton *
        quantity;


      result.push({

        product,

        quantity,

        subtotal,

        deliveryPerCarton,

        deliveryTotal

      });

    }
  );


  /*
     منع التكرار
  */

  const unique = [];


  result.forEach(item => {

    const exists =
      unique.find(
        old =>
          old.product.id ===
          item.product.id
      );


    if (!exists) {

      unique.push(item);

    }

  });


  return unique;

}


/* =========================================================
   معالجة رسالة المنتجات
========================================================= */

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


  /* =======================================================
     التاجر
  ======================================================= */

  if (
    !selectedShop ||
    assistantStep === "shop"
  ) {

    showShopSelection();

    return;

  }


  /* =======================================================
     التحية
  ======================================================= */

  if (

    lower === "سلام" ||

    lower === "السلام عليكم" ||

    lower.includes("مرحبا") ||

    lower.includes("هلا")

  ) {

    addBotMessage(

      "وعليكم السلام ورحمة الله وبركاته 🌹<br><br>" +

      "🏪 التاجر الحالي:<br>" +

      "<strong>" +
      escapeHtml(selectedShop) +
      "</strong><br><br>" +

      "اكتب المنتجات والكميات.<br><br>" +

      "مثال:<br>" +

      "<strong>" +
      "ماء شملان 2 وصابون الساعة 3 وبسكويت ابود 1" +
      "</strong>"

    );

    return;

  }


  /* =======================================================
     تغيير التاجر
  ======================================================= */

  if (

    lower.includes("غير التاجر") ||

    lower.includes("غير تاجر") ||

    lower.includes("تاجر اخر") ||

    lower.includes("تاجر ثاني")

  ) {

    const cart =
      JSON.parse(
        localStorage.getItem("cart")
      ) || [];


    if (cart.length > 0) {

      addBotMessage(

        "⚠️ السلة تحتوي على منتجات من:<br><br>" +

        "<strong>" +

        escapeHtml(
          cart[0].shopName || ""
        ) +

        "</strong><br><br>" +

        "أكمل الطلب الحالي أو أفرغ السلة أولًا."

      );

      return;

    }


    selectedShop =
      "";

    localStorage.removeItem(
      "selectedShop"
    );

    assistantStep =
      "shop";

    showShopSelection();

    return;

  }


  /* =======================================================
     استخراج المنتجات والكميات
  ======================================================= */

  const selectedProducts =
    buildRequestedProducts(
      cleanText
    );


  /* =======================================================
     لم يجد المنتجات
  ======================================================= */

  if (
    !selectedProducts.length
  ) {

    addBotMessage(

      "❌ لم أتعرف على أي منتج من طلبك.<br><br>" +

      "🏪 التاجر:<br>" +

      "<strong>" +
      escapeHtml(selectedShop) +
      "</strong><br><br>" +

      "اكتب اسم المنتج والكمية، مثل:<br><br>" +

      "<strong>" +

      "ماء شملان 2 وصابون الساعة 3 وبسكويت ابود 1" +

      "</strong>"

    );

    return;

  }


  /* =======================================================
     حساب الإجماليات
  ======================================================= */

  let productsTotal = 0;

  let deliveryTotal = 0;

  let cartonsTotal = 0;


  selectedProducts.forEach(item => {

    productsTotal +=
      item.subtotal;

    deliveryTotal +=
      item.deliveryTotal;

    cartonsTotal +=
      Number(item.quantity);

  });


  const finalTotal =
    productsTotal +
    deliveryTotal;


  /* =======================================================
     عرض المنتجات
  ======================================================= */

  let html =

    "وجدت لك المنتجات التالية 👇<br><br>";


  selectedProducts.forEach(
    (item,index) => {

      const product =
        item.product;


      html += `

        <div style="
          background:#f5f5f5;
          padding:14px;
          margin:9px 0;
          border-radius:12px;
          line-height:1.9;
          border:1px solid #ddd;
        ">

          <strong>
            ${index + 1}.
            ${escapeHtml(product.name)}
          </strong>

          <br>

          💰 سعر الكرتون:
          ${Number(product.price).toLocaleString()}
          ريال

          <br>

          📦 الكمية:
          <strong>
            ${item.quantity}
          </strong>
          كرتون

          <br>

          🚚 التوصيل:
          ${item.deliveryPerCarton}
          ×
          ${item.quantity}
          =
          ${item.deliveryTotal.toLocaleString()}
          ريال

          <br>

          💵 مجموع المنتج:
          ${item.subtotal.toLocaleString()}
          ريال

        </div>

      `;

    }
  );


  /* =======================================================
     الإجماليات
  ======================================================= */

  html += `

    <hr>

    🛒 عدد المنتجات:
    <strong>
      ${selectedProducts.length}
    </strong>

    <br><br>

    📦 إجمالي الكراتين:
    <strong>
      ${cartonsTotal}
    </strong>

    <br><br>

    🛍️ مجموع المنتجات:
    <strong>
      ${productsTotal.toLocaleString()}
      ريال
    </strong>

    <br>

    🚚 مجموع التوصيل:
    <strong>
      ${deliveryTotal.toLocaleString()}
      ريال
    </strong>

    <br>

    💰 الإجمالي النهائي:
    <strong style="
      font-size:20px;
      color:#009688;
    ">
      ${finalTotal.toLocaleString()}
      ريال
    </strong>

    <br><br>

    ⚠️ راجع المنتجات والكميات قبل التأكيد.

    <br><br>

    <button
      class="assistant-order-button"
      style="
        width:100%;
        padding:15px;
        border:none;
        border-radius:12px;
        background:#009688;
        color:white;
        font-size:16px;
        font-weight:bold;
        cursor:pointer;
      "
    >
      🛒 تأكيد طلب جميع المنتجات
    </button>

  `;


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
          selectedProducts
        );

      }
    );

  }

}


/* =========================================================
   تجهيز الطلب
========================================================= */

function prepareOrder(
  selectedProducts
) {

  if (
    !selectedProducts ||
    !selectedProducts.length
  ) {

    addBotMessage(
      "⚠️ لم يتم اختيار أي منتج."
    );

    return;

  }


  const productShop =
    String(
      selectedProducts[0].product.shopName ||
      "سوق مباشر"
    ).trim();


  /* =======================================================
     التأكد من نفس التاجر
  ======================================================= */

  const differentShop =
    selectedProducts.find(item => {

      return String(
        item.product.shopName ||
        "سوق مباشر"
      ).trim() !== productShop;

    });


  if (differentShop) {

    addBotMessage(
      "⚠️ المنتجات المختارة ليست من نفس التاجر."
    );

    return;

  }


  /* =======================================================
     فحص السلة
  ======================================================= */

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


  /* =======================================================
     تجهيز المنتجات للحفظ
  ======================================================= */

  const orderProducts =
    selectedProducts.map(item => {

      const product =
        item.product;


      return {

        productId:
          product.id,

        name:
          product.name,

        price:
          Number(product.price),

        quantity:
          Number(item.quantity),

        category:
          product.category || "",

        sellerId:
          product.sellerId || "",

        shopName:
          product.shopName ||
          productShop,

        deliveryPerCarton:
          Number(
            item.deliveryPerCarton
          ),

        deliveryTotal:
          Number(
            item.deliveryTotal
          ),

        subtotal:
          Number(
            item.subtotal
          )

      };

    });


  const productsTotal =
    orderProducts.reduce(
      (sum,item) =>
        sum +
        Number(item.subtotal),
      0
    );


  const deliveryTotal =
    orderProducts.reduce(
      (sum,item) =>
        sum +
        Number(item.deliveryTotal),
      0
    );


  const cartonsTotal =
    orderProducts.reduce(
      (sum,item) =>
        sum +
        Number(item.quantity),
      0
    );


  const finalTotal =
    productsTotal +
    deliveryTotal;


  /* =======================================================
     حفظ الطلب مؤقتًا
  ======================================================= */

  window.currentAssistantOrder = {

    products:
      orderProducts,

    shopName:
      productShop,

    sellerId:
      orderProducts[0].sellerId || "",

    productsTotal:
      productsTotal,

    deliveryTotal:
      deliveryTotal,

    cartonsTotal:
      cartonsTotal,

    total:
      finalTotal

  };


  customerData = {

    name: "",
    phone: "",
    district: ""

  };


  assistantStep =
    "name";


  /* =======================================================
     تأكيد الطلب
  ======================================================= */

  let html =

    "ممتاز 👍<br><br>" +

    "🏪 التاجر:<br>" +

    "<strong>" +
    escapeHtml(productShop) +
    "</strong><br><br>" +

    "🛒 المنتجات:<br>";


  orderProducts.forEach(
    (item,index) => {

      html +=

        `${index + 1}. ` +

        escapeHtml(
          item.name
        ) +

        " — " +

        "<strong>" +
        item.quantity +
        "</strong>" +

        " كرتون<br>";

    }
  );


  html +=

    "<br>🛒 عدد المنتجات: <strong>" +

    orderProducts.length +

    "</strong><br>" +

    "📦 إجمالي الكراتين: <strong>" +

    cartonsTotal +

    "</strong><br>" +

    "🛍️ مجموع المنتجات: <strong>" +

    productsTotal.toLocaleString() +

    " ريال</strong><br>" +

    "🚚 رسوم التوصيل: <strong>" +

    deliveryTotal.toLocaleString() +

    " ريال</strong><br>" +

    "💰 الإجمالي النهائي: <strong>" +

    finalTotal.toLocaleString() +

    " ريال</strong><br><br>" +

    "👤 ما اسم العميل؟";


  addBotMessage(
    html
  );

}


/* =========================================================
   بيانات العميل
========================================================= */

async function processCustomerStep(
  text
) {

  const cleanText =
    String(text || "").trim();


  if (!cleanText) {

    return;

  }


  /* =======================================================
     الاسم
  ======================================================= */

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


  /* =======================================================
     الجوال
  ======================================================= */

  if (
    assistantStep === "phone"
  ) {

    const phone =
      normalizeDigits(
        cleanText
      ).replace(
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
      phone;


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


  /* =======================================================
     الحي
  ======================================================= */

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

  }

}


/* =========================================================
   حفظ الطلب
========================================================= */

async function saveAssistantOrder() {

  const order =
    window.currentAssistantOrder;


  if (
    !order ||
    !order.products ||
    !order.products.length
  ) {

    addBotMessage(
      "⚠️ لم يتم اختيار المنتجات."
    );

    assistantStep =
      "product";

    return;

  }


  try {

    /* =====================================================
       بيانات الطلب
    ===================================================== */

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
        Number(
          order.deliveryTotal
        ),

      deliveryTotal:
        Number(
          order.deliveryTotal
        ),

      cartonsTotal:
        Number(
          order.cartonsTotal
        ),

      shopName:
        order.shopName,

      sellerId:
        order.sellerId || "",


      /* ===================================================
         المنتجات
      =================================================== */

      products:
        order.products.map(
          product => ({

            id:
              product.productId,

            name:
              product.name,

            price:
              Number(
                product.price
              ),

            quantity:
              Number(
                product.quantity
              ),

            category:
              product.category || "",

            sellerId:
              product.sellerId || "",

            shopName:
              product.shopName,

            deliveryPerCarton:
              Number(
                product.deliveryPerCarton
              ),

            deliveryTotal:
              Number(
                product.deliveryTotal
              ),

            subtotal:
              Number(
                product.subtotal
              )

          })
        ),


      productsTotal:
        Number(
          order.productsTotal
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


    /* =====================================================
       حفظ Firebase
    ===================================================== */

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


    /* =====================================================
       تجهيز منتجات واتساب
    ===================================================== */

    let productsText = "";


    order.products.forEach(
      (product,index) => {

        productsText +=

`${index + 1}. ${product.name}
📦 الكمية: ${product.quantity} كرتون
💰 سعر الكرتون: ${Number(product.price).toLocaleString()} ريال
🚚 التوصيل للكرتون: ${Number(product.deliveryPerCarton).toLocaleString()} ريال
🚚 مجموع التوصيل: ${Number(product.deliveryTotal).toLocaleString()} ريال
💵 مجموع المنتج: ${Number(product.subtotal).toLocaleString()} ريال

`;

      }
    );


    /* =====================================================
       رسالة واتساب
    ===================================================== */

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

━━━━━━━━━━━━

📦 المنتجات:

${productsText}

━━━━━━━━━━━━

🛒 عدد المنتجات:
${order.products.length}

📦 إجمالي الكراتين:
${Number(order.cartonsTotal).toLocaleString()} كرتون

🛍️ مجموع المنتجات:
${Number(order.productsTotal).toLocaleString()} ريال

🚚 رسوم التوصيل:
${Number(order.deliveryTotal).toLocaleString()} ريال

💰 الإجمالي النهائي:
${Number(order.total).toLocaleString()} ريال

━━━━━━━━━━━━

🤖 مصدر الطلب:
المساعد الذكي

🆔 رقم الطلب:
${orderRef.id}`;


    /* =====================================================
       واتساب الإدارة
    ===================================================== */

    const whatsappUrl =

      `https://wa.me/966550496391?text=` +

      encodeURIComponent(
        whatsappMessage
      );


    /* =====================================================
       رسالة النجاح
    ===================================================== */

    let successProducts = "";


    order.products.forEach(
      product => {

        successProducts +=

          "📦 " +

          escapeHtml(
            product.name
          ) +

          " — " +

          "<strong>" +

          product.quantity +

          "</strong>" +

          " كرتون<br>";

      }
    );


    addBotMessage(

      "✅ تم تسجيل طلبك بنجاح.<br><br>" +

      "🏪 التاجر: " +

      escapeHtml(
        order.shopName
      ) +

      "<br><br>" +

      "🛒 عدد المنتجات: <strong>" +

      order.products.length +

      "</strong><br><br>" +

      "📦 المنتجات:<br>" +

      successProducts +

      "<br>" +

      "📦 إجمالي الكراتين: " +

      order.cartonsTotal +

      "<br>" +

      "🛍️ مجموع المنتجات: " +

      Number(
        order.productsTotal
      ).toLocaleString() +

      " ريال<br>" +

      "🚚 التوصيل: " +

      Number(
        order.deliveryTotal
      ).toLocaleString() +

      " ريال<br>" +

      "💰 الإجمالي النهائي: " +

      Number(
        order.total
      ).toLocaleString() +

      " ريال<br><br>" +

      "📱 اضغط لإرسال تفاصيل الطلب للإدارة عبر واتساب:<br><br>" +

      `<a
        href="${whatsappUrl}"
        target="_blank"
        style="
          display:block;
          text-align:center;
          background:#25D366;
          color:white;
          padding:14px;
          border-radius:12px;
          text-decoration:none;
          font-weight:bold;
        "
      >
        📲 إرسال الطلب عبر واتساب
      </a>` +

      "<br><br>" +

      "🆔 رقم الطلب:<br>" +

      escapeHtml(
        orderRef.id
      ) +

      "<br><br>" +

      "سيتم التواصل معك لتأكيد الطلب."

    );


    /* =====================================================
       تنظيف
    ===================================================== */

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


/* =========================================================
   زر الإرسال
========================================================= */

async function sendMessage() {

  const text =
    messageInput.value.trim();


  if (!text) {

    return;

  }


  messageInput.value = "";


  /* =======================================================
     بيانات العميل
  ======================================================= */

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


  /* =======================================================
     اختيار التاجر
  ======================================================= */

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


  /* =======================================================
     المنتجات
  ======================================================= */

  await processMessage(
    text
  );

}


/* =========================================================
   الأحداث
========================================================= */

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


/* =========================================================
   حماية HTML
========================================================= */

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


/* =========================================================
   تشغيل المساعد
========================================================= */

loadProducts();
