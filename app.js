import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const productsBox = document.getElementById("products");

function getValue(data, en, ar) {
  return data[en] || data[ar] || "";
}

async function loadProducts() {

  productsBox.innerHTML = "";

  const collections = ["products", "منتجات"];

  let found = false;
