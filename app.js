import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCIwHZHSgkNHN0CaxhwbggBuWZGIfYo49g",
    authDomain: "lost-and-found-92a95.firebaseapp.com",
    projectId: "lost-and-found-92a95",
    storageBucket: "lost-and-found-92a95.firebasestorage.app",
    messagingSenderId: "630441535798",
    appId: "1:630441535798:web:7b97cba6ce3494b142ab97",
    measurementId: "G-GN8QEQQWYJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===============================
   FORM SUBMIT HANDLER
================================ */

const form = document.getElementById("itemForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const status = document.getElementById("itemStatus").value; // Lost / Found
    const itemType = document.getElementById("itemType").value;
    const city = document.getElementById("city").value;
    const area = document.getElementById("area").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const contactNumber = document.getElementById("contactNumber").value;
    // 🔹 Common data structure
    const itemData = {
        status: status,
        itemType: itemType,
        location: {
            city: city,
            area: area,
        },
        date: date,
        time: time,
        contactNumber: contactNumber, // ✅ NEW FIELD
        createdAt: new Date()
    };

    // 🔴 DECISION LOGIC (THIS IS WHAT YOU WANT)
    if (status === "Lost") {
        await addDoc(collection(db, "lost_items"), itemData);
        alert("Lost item saved successfully!");
    }
    else if (status === "Found") {
        await addDoc(collection(db, "found_items"), itemData);
        alert("Found item saved successfully!");
    }
    else {
        alert("Please select item status");
        return;
    }

    form.reset();
    displayFoundItems();
});
import {
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   DISPLAY FOUND ITEMS
================================ */

/* ===============================
   DISPLAY FOUND ITEMS
================================ */

async function displayFoundItems() {
    const container = document.getElementById("dispFound");
    const noText = document.getElementById("noFoundText");

    // Remove old items
    container.querySelectorAll(".foundItem").forEach(e => e.remove());

    const snapshot = await getDocs(collection(db, "found_items"));

    let serial = 1;
    let hasData = false;

    snapshot.forEach(doc => {
        hasData = true;
        const data = doc.data();

        const itemDiv = document.createElement("div");
        itemDiv.className = "foundItem";
        itemDiv.style.borderBottom = "1px solid #ddd";
        itemDiv.style.padding = "6px 0";

        // store filter data
        itemDiv.dataset.city = data.location.city.toLowerCase();
        itemDiv.dataset.item = data.itemType.toLowerCase();

        itemDiv.innerHTML = `
      <strong>${serial}. ${data.itemType.charAt(0).toUpperCase() + data.itemType.slice(1)
            } – ${data.location.area}, ${data.location.city}</strong>
    `;

        container.appendChild(itemDiv);
        serial++;
    });

    noText.style.display = hasData ? "none" : "block";
}

/* 🔹 Load found items when page opens */
displayFoundItems();
/* ===============================
   FOUND ITEM FILTER LOGIC
================================ */

function applyFoundFilters() {
    const cityFilter =
        document.getElementById("filterFoundCity").value.toLowerCase();
    const itemFilter =
        document.getElementById("filterFoundItem").value.toLowerCase();

    const items = document.querySelectorAll(".foundItem");

    items.forEach(item => {
        const city = item.dataset.city;
        const type = item.dataset.item;

        const cityMatch = cityFilter === "" || city === cityFilter;
        const itemMatch = itemFilter === "" || type.includes(itemFilter);

        item.style.display = (cityMatch && itemMatch) ? "block" : "none";
    });
}

/* ===============================
   MATCHING LOGIC
================================ */

import {
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function matchLostAndFound() {
  const foundSnapshot = await getDocs(collection(db, "found_items"));
  const lostSnapshot = await getDocs(collection(db, "lost_items"));

  const matchContainer = document.getElementById("dispMatches");
  const noMatchText = document.getElementById("noMatchText");

  // Clear old matches
  matchContainer.querySelectorAll(".matchItem").forEach(e => e.remove());

  let serial = 1;
  let hasMatch = false;

  foundSnapshot.forEach(foundDoc => {
    const found = foundDoc.data();

    lostSnapshot.forEach(lostDoc => {
      const lost = lostDoc.data();

      const sameItem = found.itemType === lost.itemType;
      const sameCity = found.location.city === lost.location.city;
      const sameArea = found.location.area === lost.location.area;

      if (sameItem && sameCity && sameArea) {
        hasMatch = true;
        noMatchText.style.display = "none";

        const matchDiv = document.createElement("div");
        matchDiv.className = "matchItem";
        matchDiv.style.borderBottom = "1px solid #ddd";
        matchDiv.style.padding = "8px 0";
        matchDiv.style.cursor = "pointer";

        matchDiv.innerHTML = `
          <strong>${serial}. ${
            found.itemType.charAt(0).toUpperCase() + found.itemType.slice(1)
          } – ${found.location.area}, ${found.location.city}</strong><br>
          <span style="color: green;">✅ Possible match found</span><br>
          📞 Contact Finder: <strong>${found.contactNumber}</strong>
        `;

        // 🔥 CLICK HANDLER
        matchDiv.addEventListener("click", async () => {
          const confirmFound = confirm(
            "Have you found your item?\n\n" +
            "Yes → This item will be removed from the system\n" +
            "No → No action will be taken"
          );

          if (confirmFound) {
            // Delete from BOTH collections
            await deleteDoc(doc(db, "found_items", foundDoc.id));
            await deleteDoc(doc(db, "lost_items", lostDoc.id));

            alert("Item marked as resolved and removed.");

            // Remove from UI
            matchDiv.remove();

            // Optional: reload lists
            displayFoundItems();
            displayLostItems();
          }
        });

        matchContainer.appendChild(matchDiv);
        serial++;
      }
    });
  });

  if (!hasMatch) {
    noMatchText.style.display = "block";
  }
}
matchLostAndFound();

/* ===============================
   FILTER LOGIC
================================ */

function applyFilters() {
    const cityFilter = document.getElementById("filterCity").value.toLowerCase();
    const itemFilter = document.getElementById("filterItem").value.toLowerCase();

    const matchItems = document.querySelectorAll(".matchItem");

    matchItems.forEach(item => {
        const itemCity = item.dataset.city;
        const itemType = item.dataset.item;

        const cityMatch =
            cityFilter === "" || itemCity === cityFilter;

        const itemMatch =
            itemFilter === "" || itemType.includes(itemFilter);

        if (cityMatch && itemMatch) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
}
document.getElementById("filterCity").addEventListener("change", applyFilters);
document.getElementById("filterItem").addEventListener("input", applyFilters);
document
    .getElementById("filterFoundCity")
    .addEventListener("change", applyFoundFilters);

document
    .getElementById("filterFoundItem")
    .addEventListener("input", applyFoundFilters);
