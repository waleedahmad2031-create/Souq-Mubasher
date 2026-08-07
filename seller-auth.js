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
  getDocs,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


let currentSellerId = null;


// ========================================
// تحميل منتجات البائع
// ========================================

async function loadSellerProducts(sellerId) {

  const productsList =
    document.getElementById("productsList");

  if (!productsList) return;


  productsList.innerHTML =
    "<p>جاري تحميل المنتجات...</p>";


  try {

    const productsQuery = query(
      collection(db, "products"),
      where("sellerId", "==", sellerId)
    );


    const snapshot =
      await getDocs(productsQuery);


    // تحديث عدد المنتجات
    const productsCount =
      document.getElementById("productsCount");

    if (productsCount) {
      productsCount.textContent =
        snapshot.size;
    }


    if (snapshot.empty) {

      productsList.innerHTML =
        "<p>لا توجد منتجات حتى الآن.</p>";

      return;
    }


    productsList.innerHTML = "";


    snapshot.forEach((productDoc) => {

      const product =
        productDoc.data();

      const productId =
        productDoc.id;


      const card =
        document.createElement("div");

      card.className =
        "product-card";


      card.innerHTML = `

        ${
          product.image
            ? `
              <img
                src="${product.image}"
                alt=""
              >
            `
            : ""
        }


        <h3>
          ${product.name || "بدون اسم"}
        </h3>


        <p>
          🏪 ${product.shopName || "متجري"}
        </p>


        <p>
          💰 السعر:
          ${product.price || 0} ريال
        </p>


        <p>
          📂 القسم:
          ${product.category || "-"}
        </p>


        ${
          product.description
            ? `
              <p>
                ${product.description}
              </p>
            `
            : ""
        }


        <div class="actions">

          <button
            class="edit-btn"
            data-id="${productId}"
          >
            ✏️ تعديل
          </button>


          <button
            class="delete-btn"
            data-id="${productId}"
          >
            🗑️ حذف
          </button>

        </div>

      `;


      productsList.appendChild(card);

    });


    // ========================================
    // أزرار الحذف
    // ========================================

    document
      .querySelectorAll(".delete-btn")
      .forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            const id =
              button.dataset.id;


            if (
              !confirm(
                "هل أنت متأكد من حذف هذا المنتج؟"
              )
            ) {
              return;
            }


            try {

              button.disabled = true;

              button.textContent =
                "جاري الحذف...";


              await deleteDoc(
                doc(db, "products", id)
              );


              // تحديث المنتجات مباشرة
              await loadSellerProducts(
                sellerId
              );


            } catch (error) {

              console.error(error);

              alert(
                "حدث خطأ أثناء حذف المنتج"
              );


              button.disabled = false;

              button.textContent =
                "🗑️ حذف";

            }

          }
        );

      });


    // ========================================
    // أزرار التعديل
    // ========================================

    document
      .querySelectorAll(".edit-btn")
      .forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            const id =
              button.dataset.id;


            const productRef =
              doc(db, "products", id);


            try {

              const productSnap =
                await getDoc(productRef);


              if (!productSnap.exists()) {

                alert(
                  "المنتج غير موجود"
                );

                return;
              }


              const product =
                productSnap.data();


              const newName =
                prompt(
                  "اسم المنتج:",
                  product.name || ""
                );


              if (newName === null) {
                return;
              }


              const newPrice =
                prompt(
                  "السعر:",
                  product.price || ""
                );


              if (newPrice === null) {
                return;
              }


              const newDescription =
                prompt(
                  "الوصف:",
                  product.description || ""
                );


              if (newDescription === null) {
                return;
              }


              const priceNumber =
                Number(newPrice);


              if (
                !newName.trim() ||
                !priceNumber
              ) {

                alert(
                  "يرجى إدخال اسم وسعر صحيح"
                );

                return;
              }


              button.disabled = true;

              button.textContent =
                "جاري التعديل...";


              await updateDoc(
                productRef,
                {
                  name: newName.trim(),

                  price: priceNumber,

                  description:
                    newDescription.trim()
                }
              );


              // تحديث القائمة مباشرة
              await loadSellerProducts(
                sellerId
              );


            } catch (error) {

              console.error(error);

              alert(
                "حدث خطأ أثناء تعديل المنتج"
              );


              button.disabled = false;

              button.textContent =
                "✏️ تعديل";

            }

          }
        );

      });


  } catch (error) {

    console.error(error);

    productsList.innerHTML =
      "<p>حدث خطأ أثناء تحميل المنتجات.</p>";
  }

}



// ========================================
// تسجيل دخول البائع
// ========================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      location.href =
        "login.html";

      return;
    }


    currentSellerId =
      user.uid;


    try {

      // بيانات البائع
      const sellerRef =
        doc(
          db,
          "sellers",
          user.uid
        );


      const sellerSnap =
        await getDoc(sellerRef);


      if (!sellerSnap.exists()) {

        alert(
          "لم يتم العثور على بيانات البائع"
        );

        location.href =
          "login.html";

        return;
      }


      const seller =
        sellerSnap.data();


      // حالة الحساب
      if (
        seller.status !==
        "active"
      ) {

        alert(
          "تم إيقاف حسابك، تواصل مع الإدارة."
        );

        location.href =
          "login.html";

        return;
      }


      // اسم المتجر
      const shopName =
        document.getElementById(
          "shopName"
        );


      if (shopName) {

        shopName.textContent =
          seller.shopName || "-";
      }


      // الاشتراك
      const subscription =
        document.getElementById(
          "subscription"
        );


      if (subscription) {

        subscription.textContent =
          seller.subscription ||
          "free";
      }


      // تحميل المنتجات
      await loadSellerProducts(
        user.uid
      );


      // تحميل الطلبات
      const ordersQuery =
        query(
          collection(db, "orders"),
          where(
            "sellerId",
            "==",
            user.uid
          )
        );


      const ordersSnap =
        await getDocs(
          ordersQuery
        );


      const ordersCount =
        document.getElementById(
          "ordersCount"
        );


      if (ordersCount) {

        ordersCount.textContent =
          ordersSnap.size;
      }


    } catch (error) {

      console.error(error);

      alert(
        "حدث خطأ أثناء تحميل بيانات البائع"
      );

    }

  }
);
