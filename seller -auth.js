import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


async function loadSellerProducts(sellerId) {

  const productsList = document.getElementById("productsList");

  if (!productsList) return;

  productsList.innerHTML = "<p>جاري تحميل المنتجات...</p>";

  try {

    const productsQuery = query(
      collection(db, "products"),
      where("sellerId", "==", sellerId)
    );

    const snapshot = await getDocs(productsQuery);

    if (snapshot.empty) {

      productsList.innerHTML =
        "<p>لا توجد منتجات حتى الآن.</p>";

      return;
    }

    productsList.innerHTML = "";

    snapshot.forEach((productDoc) => {

      const product = productDoc.data();

      const card = document.createElement("div");

      card.className = "product-card";

      card.innerHTML = `

        ${product.image ? `
        <img src="${product.image}" alt="">
        ` : ""}

        <h3>${product.name || "بدون اسم"}</h3>

        <p>السعر: ${product.price || 0} ريال</p>

        <p>القسم: ${product.category || "-"}</p>

        ${product.description ? `
        <p>${product.description}</p>
        ` : ""}

        <div class="actions">
          <button>تعديل</button>
          <button>حذف</button>
        </div>

      `;

      productsList.appendChild(card);

    });

  } catch (error) {

    console.error(error);

    productsList.innerHTML =
      "<p>حدث خطأ أثناء تحميل المنتجات.</p>";
  }
}


onAuthStateChanged(auth, async (user) => {

  if (!user) {

    location.href = "login.html";
    return;
  }

  try {

    // بيانات البائع
    const sellerRef = doc(db, "البائعون", user.uid);

    const sellerSnap = await getDoc(sellerRef);

    if (!sellerSnap.exists()) {

      alert("لم يتم العثور على بيانات البائع");

      location.href = "login.html";
      return;
    }

    const seller = sellerSnap.data();


    // التحقق من حالة الحساب
    if (seller.status !== "active") {

      alert("تم إيقاف حسابك، تواصل مع الإدارة.");

      location.href = "login.html";
      return;
    }


    // اسم المتجر
    document.getElementById("shopName").textContent =
      seller.shopName || "-";


    // الاشتراك
    document.getElementById("subscription").textContent =
      seller.subscription || "free";


    // المنتجات
    const productsQuery = query(
      collection(db, "products"),
      where("sellerId", "==", user.uid)
    );

    const productsSnap = await getDocs(productsQuery);

    document.getElementById("productsCount").textContent =
      productsSnap.size;


    // الطلبات
    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", user.uid)
    );

    const ordersSnap = await getDocs(ordersQuery);

    document.getElementById("ordersCount").textContent =
      ordersSnap.size;


    // عرض منتجات البائع
    await loadSellerProducts(user.uid);

  } catch (error) {

    console.error(error);

    alert("حدث خطأ أثناء تحميل بيانات البائع");

  }

});
