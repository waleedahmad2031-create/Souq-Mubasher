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

        id:
          doc.id,

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
       التاجر المحفوظ
    ===================================== */

    if (selectedShop) {

      const shopExists =
        products.some(product => {

          return String(
            product.shopName || ""
          ).trim() === selectedShop;

        });


      if (shopExists) {

        assistantStep =
          "product";


        addBotMessage(

          "🤖 أهلًا بك في سوق مباشر 🌹<br><br>" +

          "🏪 التاجر المحدد حاليًا:<br>" +

          "<strong>" +
          escapeHtml(selectedShop) +
          "</strong><br><br>" +

          "اكتب المنتجات والكميات التي تريدها.<br><br>" +

          "مثال:<br>" +

          "<strong>" +
          "دقيق قمح 10 وماء شملان 2 وسكر 3" +
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


/* =========================================
   اختيار التاجر
========================================= */

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

    "الآن اكتب المنتجات والكميات.<br><br>" +

    "مثال:<br>" +

    "<strong>دقيق قمح 10 وماء شملان 2 وسكر 3</strong>"

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
   تحويل الأرقام العربية
========================================= */

function normalizeDigits(text) {

  return String(text || "")

    .replace(
      /[٠-٩]/g,
      digit => {

        return String(
          "٠١٢٣٤٥٦٧٨٩".indexOf(
            digit
          )
        );

      }

    )

    .replace(
      /[۰-۹]/g,
      digit => {

        return String(
          "۰۱۲۳۴۵۶۷۸۹".indexOf(
            digit
          )
        );

      }

    );

}


/* =========================================
   تطبيع العربي
========================================= */

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


/* =========================================
   التوصيل لكل كرتون
========================================= */

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


/* =========================================
   هل الاسم موجود في النص؟
========================================= */

function findExactProductPositions(
  text,
  product
) {

  const normalizedText =
    normalizeArabic(text);


  const productName =
    normalizeArabic(
      product.name
    );


  if (!productName) {

    return [];

  }


  const positions = [];


  let start =
    0;


  while (true) {

    const index =
      normalizedText.indexOf(
        productName,
        start
      );


    if (index === -1) {

      break;

    }


    positions.push({

      product,

      start:
        index,

      end:
        index +
        productName.length

    });


    start =
      index +
      productName.length;

  }


  return positions;

}


/* =========================================
   استخراج المنتجات الحقيقية
========================================= */

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


  /* =====================================
     البحث بالاسم الكامل أولًا
  ===================================== */

  let matches = [];


  shopProducts.forEach(product => {

    const positions =
      findExactProductPositions(
        text,
        product
      );


    positions.forEach(position => {

      matches.push(position);

    });

  });


  /*
     نرتب الأسماء الأطول أولًا
     حتى لا يختار "ماء" بدل
     "ماء شملان"
  */

  matches.sort(
    (a,b) => {

      const lengthA =
        a.end - a.start;

      const lengthB =
        b.end - b.start;

      return lengthB - lengthA;

    }
  );


  /* =====================================
     منع التداخل بين أسماء المنتجات
  ===================================== */

  const accepted = [];


  matches.forEach(match => {

    const overlaps =
      accepted.some(old => {

        return !(
          match.end <= old.start ||
          match.start >= old.end
        );

      });


    if (!overlaps) {

      accepted.push(match);

    }

  });


  accepted.sort(
    (a,b) =>
      a.start - b.start
  );


  /* =====================================
     إذا وجدنا أسماء حقيقية
     لا نستخدم التخمين
  ===================================== */

  if (accepted.length) {

    return accepted;

  }


  /* =====================================
     بحث احتياطي ذكي
     فقط إذا لم نجد اسمًا كاملًا
  ===================================== */

  const normalizedText =
    normalizeArabic(text);


  const fuzzy = [];


  shopProducts.forEach(product => {

    const name =
      normalizeArabic(
        product.name
      );


    const words =
      name
        .split(/\s+/)
        .filter(
          word =>
            word.length >= 2
        );


    let score = 0;


    words.forEach(word => {

      if (
        normalizedText.includes(word)
      ) {

        score += 1;

      }

    });


    if (
      score === words.length &&
      score > 0
    ) {

      const index =
        normalizedText.indexOf(name);


      fuzzy.push({

        product,

        start:
          index >= 0
            ? index
            : 0,

        end:
          index >= 0
            ? index + name.length
            : name.length,

        score

      });

    }

  });


  fuzzy.sort(
    (a,b) =>
      b.score - a.score
  );


  /*
     في البحث الاحتياطي نأخذ
     أفضل منتج واحد فقط
     حتى لا يضيف المساعد منتجات من عنده
  */

  if (fuzzy.length) {

    return [
      fuzzy[0]
    ];

  }


  return [];

}


/* =========================================
   استخراج الكمية بعد المنتج
========================================= */

function extractQuantityForMatch(
  text,
  match,
  nextMatch
) {

  const normalizedText =
    normalizeArabic(text);


  let start =
    match.end;


  let end =
    nextMatch
      ? nextMatch.start
      : normalizedText.length;


  /*
     نبحث بعد اسم المنتج
     حتى بداية المنتج التالي
  */

  const afterText =
    normalizedText.substring(
      start,
      end
    );


  const afterNumber =
    afterText.match(
      /\d+(?:\.\d+)?/
    );


  if (afterNumber) {

    const quantity =
      Number(
        afterNumber[0]
      );


    if (
      Number.isFinite(quantity) &&
      quantity > 0
    ) {

      return quantity;

    }

  }


  /*
     إذا لم توجد كمية بعد الاسم،
     نبحث قبله من نهاية المنتج السابق
  */

  let beforeStart = 0;


  if (match.previousEnd !== undefined) {

    beforeStart =
      match.previousEnd;

  }


  const beforeText =
    normalizedText.substring(
      beforeStart,
      match.start
    );


  const numbersBefore =
    beforeText.match(
      /\d+(?:\.\d+)?/g
    );


  if (numbersBefore &&
      numbersBefore.length) {

    const lastNumber =
      numbersBefore[
        numbersBefore.length - 1
      ];


    const quantity =
      Number(
        lastNumber
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


/* =========================================
   تجهيز المنتجات مع الكميات
========================================= */

function buildRequestedProducts(
  text
) {

  const matches =
    findRequestedProducts(
      text
    );


  if (!matches.length) {

    return [];

  }


  /*
     حفظ نهاية المنتج السابق
  */

  matches.forEach(
    (match,index) => {

      match.previousEnd =
        index > 0
          ? matches[index - 1].end
          : 0;

    }
  );


  const result = [];


  matches.forEach(
    (match,index) => {

      const quantity =
        extractQuantityForMatch(
          text,
          match,
          matches[index + 1]
        );


      const product =
        match.product;


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

    const existing =
      unique.find(old => {

        return (
          old.product.id ===
          item.product.id
        );

      });


    if (existing) {

      existing.quantity +=
        item.quantity;


      existing.subtotal =
        existing.product.price *
        existing.quantity;


      existing.deliveryTotal =
        existing.deliveryPerCarton *
        existing.quantity;

    } else {

      unique.push({

        ...item

      });

    }

  });


  return unique;

}


/* =========================================
   معالجة رسالة المنتجات
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
     لم يتم اختيار تاجر
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
    lower.includes("مرحبا") ||
    lower.includes("هلا") ||
    lower === "سلام"
  ) {

    addBotMessage(

      "وعليكم السلام ورحمة الله وبركاته 🌹<br><br>" +

      "🏪 التاجر الحالي:<br>" +

      "<strong>" +
      escapeHtml(selectedShop) +
      "</strong><br><br>" +

      "اكتب المنتجات والكميات التي تريدها.<br><br>" +

      "مثال:<br>" +

      "<strong>دقيق قمح 10 وماء شملان 2</strong>"

    );

    return;

  }


  /* =====================================
     تغيير التاجر
  ===================================== */

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


  /* =====================================
     بحث المنتجات
  ===================================== */

  const selectedProducts =
    buildRequestedProducts(
      cleanText
    );


  /* =====================================
     لم يجد منتج
  ===================================== */

  if (
    !selectedProducts.length
  ) {

    addBotMessage(

      "❌ لم أجد المنتج الذي كتبته عند التاجر:<br><br>" +

      "🏪 <strong>" +

      escapeHtml(
        selectedShop
      ) +

      "</strong><br><br>" +

      "اكتب اسم المنتج كما هو ظاهر في المتجر.<br><br>" +

      "مثال:<br>" +

      "<strong>دقيق قمح 10 وماء شملان 2</strong>"

    );

    return;

  }


  /* =====================================
     عرض المنتجات
  ===================================== */

  let html =

    "وجدت لك المنتجات التالية 👇<br><br>";


  let productsTotal = 0;

  let deliveryTotal = 0;

  let cartonsTotal = 0;


  selectedProducts.forEach(
    (item,index) => {

      const product =
        item.product;


      productsTotal +=
        item.subtotal;


      deliveryTotal +=
        item.deliveryTotal;


      cartonsTotal +=
        item.quantity;


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


  const finalTotal =
    productsTotal +
    deliveryTotal;


  html += `

    <hr>

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
      font-size:19px;
      color:#009688;
    ">
      ${finalTotal.toLocaleString()}
      ريال
    </strong>

    <br><br>

    إذا كانت المنتجات والكميات صحيحة اضغط تأكيد الطلب 👇

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


/* =========================================
   تجهيز الطلب
========================================= */

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


  /* =====================================
     التاجر
  ===================================== */

  const productShop =
    String(
      selectedProducts[0].product.shopName ||
      "سوق مباشر"
    ).trim();


  /* =====================================
     التأكد أن كل المنتجات من نفس التاجر
  ===================================== */

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


  /* =====================================
     تجهيز المنتجات للحفظ
  ===================================== */

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
          Number(
            product.price
          ),

        quantity:
          Number(
            item.quantity
          ),

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


  /* =====================================
     حفظ الطلب مؤقتًا
  ===================================== */

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


  /* =====================================
     رسالة التأكيد
  ===================================== */

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

        item.quantity +

        " كرتون<br>";

    }
  );


  html +=

    "<br>📦 إجمالي الكراتين: <strong>" +

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
     الجوال
  ===================================== */

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
   حفظ الطلب
========================================= */

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

    /* =====================================
       بيانات الطلب
    ===================================== */

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


      /* ===================================
         المنتجات
      =================================== */

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


    /* =====================================
       حفظ Firebase
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
       تجهيز رسالة المنتجات لواتساب
    ===================================== */

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


    /* =====================================
       رسالة واتساب
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

━━━━━━━━━━━━

📦 المنتجات:

${productsText}

━━━━━━━━━━━━

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


    /* =====================================
       واتساب الإدارة
    ===================================== */

    const whatsappUrl =

      `https://wa.me/966550496391?text=` +

      encodeURIComponent(
        whatsappMessage
      );


    /*
       فتح واتساب مباشرة
    */

    window.location.href =
      whatsappUrl;


    /* =====================================
       رسالة النجاح
    ===================================== */

    let successProducts = "";


    order.products.forEach(
      product => {

        successProducts +=

          "📦 " +

          escapeHtml(
            product.name
          ) +

          " — " +

          product.quantity +

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

      "🛒 المنتجات:<br>" +

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

      "📱 سيتم فتح واتساب لإرسال الطلب للإدارة.<br><br>" +

      "🆔 رقم الطلب:<br>" +

      escapeHtml(
        orderRef.id
      )

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
     المنتجات
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
