import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const chat =
  document.getElementById("chat");

const input =
  document.getElementById("messageInput");

const sendButton =
  document.getElementById("sendButton");


const WHATSAPP_NUMBER =
  "966550496391";


let currentOrder = [];

let orderStage = "products";


let customer = {
  name: "",
  phone: "",
  address: ""
};


// المنتجات المتاحة للاختيار
let availableProducts = [];


// =============================
// إضافة رسالة
// =============================

function addMessage(text, type) {

  const message =
    document.createElement("div");

  message.className =
    "message " + type;

  message.innerText = text;

  chat.appendChild(message);

  window.scrollTo(
    0,
    document.body.scrollHeight
  );
}


// =============================
// تحويل الأرقام العربية
// =============================

function numbers(text) {

  const arabic =
    "٠١٢٣٤٥٦٧٨٩";

  const english =
    "0123456789";

  return text.replace(
    /[٠-٩]/g,
    function(n) {

      return english[
        arabic.indexOf(n)
      ];

    }
  );

}


// =============================
// تنظيف النص
// =============================

function clean(text) {

  return numbers(text)
    .toLowerCase()
    .replace(
      /[ًٌٍَُِّْـ]/g,
      ""
    )
    .replace(
      /[أإآ]/g,
      "ا"
    )
    .replace(
      /ة/g,
      "ه"
    )
    .replace(
      /[،,]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


// =============================
// نعم
// =============================

function isYes(text) {

  const value =
    clean(text);

  return [

    "نعم",
    "اي",
    "ايوه",
    "ايوة",
    "ايوا",
    "تمام",
    "موافق",
    "موافقه",
    "اكيد",
    "اتمام الطلب",
    "اتم الطلب",
    "اريد الطلب",
    "نعم اريد",
    "توكل",
    "توكلنا",
    "خلص",
    "خلاص",
    "ارسل",
    "ارسله",
    "ارسل الطلب"

  ].some(function(word) {

    return value ===
      clean(word);

  });

}


// =============================
// لا
// =============================

function isNo(text) {

  const value =
    clean(text);

  return [

    "لا",
    "الغاء",
    "الغ",
    "لا اريد",
    "ما اريد",
    "مش اريد",
    "ما اشتي",
    "مش اشتي",
    "لا اشتي"

  ].some(function(word) {

    return value ===
      clean(word);

  });

}


// =============================
// كلمات الكميات
// =============================

const quantityWords = {

  "واحد": 1,
  "وحده": 1,
  "واحدة": 1,

  "اثنين": 2,
  "اثنان": 2,
  "اثنتين": 2,
  "ثنتين": 2,
  "اثنينه": 2,

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


// =============================
// استخراج كمية من جزء من النص
// =============================

function extractQuantity(text) {

  const value =
    clean(text);

  // رقم مباشر
  const numberMatch =
    value.match(/\d+/);

  if(numberMatch) {

    const number =
      Number(numberMatch[0]);

    if(number > 0 && number <= 1000) {

      return number;

    }

  }


  // رقم بالكلمات
  for(
    const word in quantityWords
  ) {

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


// =============================
// حساب رسوم التوصيل
// =============================

function getDeliveryFee(price) {

  price =
    Number(price) || 0;


  if(price < 1500) {

    return 50;

  }


  if(price < 2000) {

    return 70;

  }


  return 100;

}


// =============================
// تحميل المنتجات
// =============================

async function getProducts() {

  const result = [];

  const names = [

    "products",
    "منتجات"

  ];


  for(
    const collectionName of names
  ) {

    try {

      const snapshot =
        await getDocs(
          collection(
            db,
            collectionName
          )
        );


      snapshot.forEach(
        function(doc) {

          const data =
            doc.data();


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


          if(!name) {

            return;

          }


          const exists =
            result.some(
              function(product) {

                return clean(
                  product.name
                ) === clean(name);

              }
            );


          if(!exists) {

            result.push({

              id: doc.id,

              name: name,

              price: price

            });

          }

        }
      );


    }catch(error) {

      console.error(
        "خطأ في تحميل المنتجات:",
        error
      );

    }

  }


  return result;

}


// =============================
// استخراج الكمية الخاصة بمنتج
// =============================

function getProductQuantity(
  text,
  productName
) {

  const value =
    clean(text);

  const name =
    clean(productName);


  const position =
    value.indexOf(name);


  if(position === -1) {

    return 1;

  }


  /*
   نأخذ الكلام الذي قبل اسم المنتج
   حتى 25 حرفًا
  */

  const before =
    value.substring(
      Math.max(
        0,
        position - 25
      ),
      position
    );


  /*
   نأخذ الكلام الذي بعد اسم المنتج
  */

  const after =
    value.substring(
      position + name.length,
      position + name.length + 20
    );


  // أرقام قبل المنتج
  const numbersBefore =
    before.match(/\d+/g);


  if(
    numbersBefore &&
    numbersBefore.length
  ) {

    const quantity =
      Number(
        numbersBefore[
          numbersBefore.length - 1
        ]
      );


    if(
      quantity > 0 &&
      quantity <= 1000
    ) {

      return quantity;

    }

  }


  // كلمات كمية قبل المنتج
  for(
    const word in quantityWords
  ) {

    if(
      before.includes(
        clean(word)
      )
    ) {

      return quantityWords[word];

    }

  }


  // أرقام بعد المنتج
  const numbersAfter =
    after.match(/\d+/g);


  if(
    numbersAfter &&
    numbersAfter.length
  ) {

    const quantity =
      Number(
        numbersAfter[0]
      );


    if(
      quantity > 0 &&
      quantity <= 1000
    ) {

      return quantity;

    }

  }


  // كلمات كمية بعد المنتج
  for(
    const word in quantityWords
  ) {

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


// =============================
// فهم كلام العميل
// =============================

function understandCustomerMessage(
  text,
  products
) {

  const found = [];


  /*
   ترتيب المنتجات من الأطول للأقصر
   حتى لا يتداخل اسم منتج مع آخر
  */

  const sorted =
    [...products].sort(
      function(a, b) {

        return clean(b.name).length -
               clean(a.name).length;

      }
    );


  for(
    const product of sorted
  ) {

    const productName =
      clean(product.name);


    if(!productName) {

      continue;

    }


    const value =
      clean(text);


    if(
      !value.includes(
        productName
      )
    ) {

      continue;

    }


    const quantity =
      getProductQuantity(
        text,
        product.name
      );


    const price =
      Number(product.price) || 0;


    const total =
      price * quantity;


    const already =
      found.some(
        function(item) {

          return item.id ===
            product.id;

        }
      );


    if(!already) {

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


// =============================
// البحث عن المنتجات بالاسم
// =============================

function findProducts(
  text,
  products
) {

  const value =
    clean(text);

  const found = [];


  const sorted =
    [...products].sort(
      function(a, b) {

        return clean(b.name).length -
               clean(a.name).length;

      }
    );


  for(
    const product of sorted
  ) {

    const productName =
      clean(product.name);


    if(!productName) {

      continue;

    }


    if(
      !value.includes(
        productName
      )
    ) {

      continue;

    }


    const quantity =
      getProductQuantity(
        text,
        product.name
      );


    const price =
      Number(product.price) || 0;


    const total =
      price * quantity;


    const already =
      found.some(
        function(item) {

          return item.id ===
            product.id;

        }
      );


    if(!already) {

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


// =============================
// البحث بالكلمة العامة
// مثال: ماء
// =============================

function findSimilarProducts(
  text,
  products
) {

  const value =
    clean(text);


  const words =
    value.split(" ");


  const found = [];


  for(
    const product of products
  ) {

    const productName =
      clean(product.name);


    if(!productName) {

      continue;

    }


    const matches =
      words.some(
        function(word) {

          if(word.length < 2) {

            return false;

          }


          return productName.includes(
            word
          );

        }
      );


    if(matches) {

      const exists =
        found.some(
          function(item) {

            return item.id ===
              product.id;

          }
        );


      if(!exists) {

        found.push(product);

      }

    }

  }


  return found;

}


// =============================
// عرض الخيارات
// =============================

function showProductChoices(
  products
) {

  let message =
    "وجدت أكثر من نوع 👇\n\n";


  products.forEach(
    function(product, index) {

      message +=
        (index + 1) +
        ". " +
        product.name +
        " — " +
        product.price +
        " ريال للكرتون\n";

    }
  );


  message +=
    "\nاكتب اسم النوع الذي تريده، مثل:\n" +
    products[0].name;


  availableProducts =
    products;


  orderStage =
    "chooseProduct";


  addMessage(
    message,
    "bot"
  );

}


// =============================
// إضافة المنتج المختار
// =============================

function addSelectedProduct(
  product,
  quantity = 1
) {

  const price =
    Number(product.price) || 0;


  const total =
    price * quantity;


  currentOrder.push({

    id: product.id,

    name: product.name,

    price: price,

    quantity: quantity,

    total: total

  });

}


// =============================
// عرض الطلب
// =============================

function showOrder() {

  let message =
    "وجدت لك المنتجات التالية ✅\n\n";


  let productsTotal = 0;

  let cartonsTotal = 0;

  let deliveryTotal = 0;


  currentOrder.forEach(
    function(product) {

      productsTotal +=
        product.total;


      cartonsTotal +=
        product.quantity;


      const delivery =
        getDeliveryFee(
          product.price
        );


      deliveryTotal +=
        delivery *
        product.quantity;


      message +=

        "🛍️ " +
        product.name +

        "\n📦 الكمية: " +
        product.quantity +
        " كرتون" +

        "\n💰 سعر الكرتون: " +
        product.price +
        " ريال" +

        "\n🚚 توصيل الكرتون: " +
        delivery +
        " ريال\n\n";

    }
  );


  const finalTotal =
    productsTotal +
    deliveryTotal;


  message +=

    "━━━━━━━━━━━━\n" +

    "📦 عدد الكراتين: " +
    cartonsTotal +

    "\n🛍️ مجموع المنتجات: " +
    productsTotal +
    " ريال" +

    "\n🚚 رسوم التوصيل: " +
    deliveryTotal +
    " ريال" +

    "\n💰 الإجمالي النهائي: " +
    finalTotal +
    " ريال\n\n" +

    "هل تريد إتمام الطلب؟";


  addMessage(
    message,
    "bot"
  );

}


// =============================
// اسم العميل
// =============================

function askName() {

  orderStage =
    "name";


  addMessage(
    "ممتاز 👍\n\nما اسمك؟",
    "bot"
  );

}


// =============================
// الجوال
// =============================

function askPhone() {

  orderStage =
    "phone";


  addMessage(
    "شكرًا 🌹\n\nأرسل رقم الجوال.",
    "bot"
  );

}


// =============================
// العنوان
// =============================

function askAddress() {

  orderStage =
    "address";


  addMessage(
    "تمام 👍\n\nأرسل عنوان التوصيل بالتفصيل.",
    "bot"
  );

}


// =============================
// المراجعة النهائية
// =============================

function showFinalOrder() {

  let message =
    "📋 مراجعة الطلب\n\n";


  let productsTotal = 0;

  let deliveryTotal = 0;

  let cartonsTotal = 0;


  currentOrder.forEach(
    function(product) {

      productsTotal +=
        product.total;


      cartonsTotal +=
        product.quantity;


      const delivery =
        getDeliveryFee(
          product.price
        );


      deliveryTotal +=
        delivery *
        product.quantity;


      message +=

        "🛍️ " +
        product.name +

        " × " +
        product.quantity +

        " = " +
        product.total +
        " ريال\n";

    }
  );


  const finalTotal =
    productsTotal +
    deliveryTotal;


  message +=

    "\n📦 عدد الكراتين: " +
    cartonsTotal +

    "\n🛍️ مجموع المنتجات: " +
    productsTotal +
    " ريال" +

    "\n🚚 رسوم التوصيل: " +
    deliveryTotal +
    " ريال" +

    "\n💰 الإجمالي النهائي: " +
    finalTotal +
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


// =============================
// حفظ الطلب
// =============================

async function saveOrder() {

  let productsTotal = 0;

  let deliveryTotal = 0;

  let cartonsTotal = 0;


  currentOrder.forEach(
    function(product) {

      productsTotal +=
        product.total;


      cartonsTotal +=
        product.quantity;


      deliveryTotal +=
        getDeliveryFee(
          product.price
        ) *
        product.quantity;

    }
  );


  const finalTotal =
    productsTotal +
    deliveryTotal;


  const orderData = {

    name:
      customer.name,

    phone:
      customer.phone,

    address:
      customer.address,

    customerName:
      customer.name,

    customerPhone:
      customer.phone,

    customerAddress:
      customer.address,

    customerCity:
      "إب",

    deliveryArea:
      "مدينة إب",

    orderType:
      "جملة",

    deliveryFee:
      deliveryTotal,

    cartonsTotal:
      cartonsTotal,

    products:
      currentOrder,

    productsTotal:
      productsTotal,

    total:
      finalTotal,

    status:
      "جديد",

    source:
      "طلب بواسطة المساعد الذكي",

    createdAt:
      serverTimestamp()

  };


  try {

    await addDoc(
      collection(
        db,
        "orders"
      ),
      orderData
    );


    addMessage(

      "✅ تم تسجيل طلبك بنجاح.\n\n" +
      "📦 تم إرسال الطلب إلى المتجر.",

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


    orderStage =
      "products";


  }catch(error) {

    console.error(error);


    addMessage(
      "❌ حدث خطأ أثناء حفظ الطلب.",
      "bot"
    );

  }

}


// =============================
// واتساب
// =============================

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


  order.products.forEach(
    function(product) {

      message +=

        "- " +
        product.name +

        " × " +
        product.quantity +

        " = " +
        product.total +
        " ريال\n";

    }
  );


  message +=

    "\n📦 عدد الكراتين: " +
    order.cartonsTotal +

    "\n🛍️ مجموع المنتجات: " +
    order.productsTotal +
    " ريال" +

    "\n🚚 رسوم التوصيل: " +
    order.deliveryFee +
    " ريال" +

    "\n💰 الإجمالي النهائي: " +
    order.total +
    " ريال";


  const url =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(
      message
    );


  window.open(
    url,
    "_blank"
  );

}


// =============================
// إرسال الرسالة
// =============================

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


  // ==========================
  // المنتجات
  // ==========================

  if(
    orderStage ===
    "products"
  ) {

    addMessage(
      "🔎 أبحث عن المنتجات...",
      "bot"
    );


    const products =
      await getProducts();


    const found =
      understandCustomerMessage(
        text,
        products
      );


    /*
      حذف رسالة البحث
    */

    const messages =
      chat.querySelectorAll(
        ".bot"
      );


    if(messages.length) {

      messages[
        messages.length - 1
      ].remove();

    }


    // ==========================
    // وجد المنتجات مباشرة
    // ==========================

    if(found.length) {

      currentOrder =
        found;


      orderStage =
        "confirm";


      showOrder();

      return;

    }


    // ==========================
    // البحث بالكلمة العامة
    // ==========================

    const similar =
      findSimilarProducts(
        text,
        products
      );


    if(!similar.length) {

      addMessage(

        "❌ لم أجد المنتج.\n\n" +

        "اكتب اسم المنتج كما هو موجود في المتجر.",

        "bot"

      );

      return;

    }


    // ==========================
    // أكثر من نوع
    // ==========================

    if(similar.length > 1) {

      showProductChoices(
        similar
      );

      return;

    }


    // ==========================
    // نوع واحد فقط
    // ==========================

    const quantity =
      extractQuantity(text);


    addSelectedProduct(
      similar[0],
      quantity
    );


    orderStage =
      "confirm";


    showOrder();

    return;

  }


  // ==========================
  // اختيار نوع المنتج
  // ==========================

  if(
    orderStage ===
    "chooseProduct"
  ) {

    const selected =
      findProducts(
        text,
        availableProducts
      );


    if(selected.length) {

      addSelectedProduct(
        selected[0],
        getProductQuantity(
          text,
          selected[0].name
        )
      );


      availableProducts = [];


      orderStage =
        "confirm";


      showOrder();

      return;

    }


    // إذا كتب رقم الخيار
    const numberMatch =
      clean(text).match(
        /^\d+$/
      );


    if(numberMatch) {

      const index =
        Number(
          numberMatch[0]
        ) - 1;


      if(
        index >= 0 &&
        index <
        availableProducts.length
      ) {

        addSelectedProduct(
          availableProducts[index],
          1
        );


        availableProducts = [];


        orderStage =
          "confirm";


        showOrder();

        return;

      }

    }


    addMessage(

      "اختر النوع بكتابة اسمه أو رقمه من القائمة.",

      "bot"

    );

    return;

  }


  // ==========================
  // تأكيد الطلب
  // ==========================

  if(
    orderStage ===
    "confirm"
  ) {

    if(isYes(text)) {

      askName();

      return;

    }


    if(isNo(text)) {

      currentOrder = [];


      orderStage =
        "products";


      addMessage(

        "تم إلغاء الطلب 👍\n\n" +
        "اكتب طلبًا جديدًا.",

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


  // ==========================
  // الاسم
  // ==========================

  if(
    orderStage ===
    "name"
  ) {

    customer.name =
      text;


    askPhone();

    return;

  }


  // ==========================
  // الجوال
  // ==========================

  if(
    orderStage ===
    "phone"
  ) {

    customer.phone =
      text;


    askAddress();

    return;

  }


  // ==========================
  // العنوان
  // ==========================

  if(
    orderStage ===
    "address"
  ) {

    customer.address =
      text;


    showFinalOrder();

    return;

  }


  // ==========================
  // التأكيد النهائي
  // ==========================

  if(
    orderStage ===
    "finalConfirm"
  ) {

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


      orderStage =
        "products";


      addMessage(

        "تم إلغاء الطلب 👍\n\n" +
        "يمكنك كتابة طلب جديد.",

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


// =============================
// الأحداث
// =============================

sendButton.addEventListener(
  "click",
  sendMessage
);


input.addEventListener(
  "keydown",
  function(event) {

    if(
      event.key === "Enter"
    ) {

      sendMessage();

    }

  }
);
