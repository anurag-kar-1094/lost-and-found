/* ===============================
   ALL IMPORTS (MUST BE AT TOP)
================================ */
import { getAuth, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   FIREBASE INITIALIZATION
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyCIwHZHSgkNHN0CaxhwbggBuWZGIfYo49g",
  authDomain: "lost-and-found-92a95.firebaseapp.com",
  projectId: "lost-and-found-92a95",
  storageBucket: "lost-and-found-92a95.firebasestorage.app",
  messagingSenderId: "630441535798",
  appId: "1:630441535798:web:7b97cba6ce3494b142ab97"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ===============================
   AUTH GUARD (LOGIN REQUIRED)
================================ */
let currentUser = null;

const loginBtn = document.getElementById("loginBtn");
const userWelcome = document.getElementById("userWelcome");
const logoutBtn = document.getElementById("logoutBtn");
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Logged out
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
    userWelcome.style.display = "none";
  } else {
    currentUser = user;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    userWelcome.textContent = `Welcome, ${snap.data().name}`;
    userWelcome.style.display = "block";

    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
  }
});
/* ===============================
   GET LOGGED-IN USER CONTACT
================================ */
async function getLoggedInUserContact() {
  const userRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User profile not found");
  }

  return userSnap.data().contactNumber;
}

/* ===============================
   DISPLAY FOUND ITEMS
================================ */
async function displayFoundItems() {
  const container = document.getElementById("dispFound");
  const noText = document.getElementById("noFoundText");

  container.querySelectorAll(".foundItem").forEach(e => e.remove());

  const snapshot = await getDocs(collection(db, "found_items"));

  let serial = 1;
  let hasData = false;

  snapshot.forEach(docSnap => {
    hasData = true;
    const data = docSnap.data();

    const div = document.createElement("div");
    div.className = "foundItem";
    div.dataset.city = data.location.city.toLowerCase();
    div.dataset.item = data.itemType.toLowerCase();

    div.innerHTML = `
      <strong>${serial}. ${data.itemType.toUpperCase()} – 
      ${data.location.area}, ${data.location.city}</strong>
    `;

    container.appendChild(div);
    serial++;
  });

  noText.style.display = hasData ? "none" : "block";
}
displayFoundItems();
/* ===============================
   MATCHING LOGIC
================================ */
async function matchLostAndFound() {
  const foundSnap = await getDocs(collection(db, "found_items"));
  const lostSnap = await getDocs(collection(db, "lost_items"));

  const container = document.getElementById("dispMatches");
  const noText = document.getElementById("noMatchText");

  container.querySelectorAll(".matchItem").forEach(e => e.remove());

  let serial = 1;
  let hasMatch = false;

  foundSnap.forEach(fDoc => {
    const f = fDoc.data();

    lostSnap.forEach(lDoc => {
      const l = lDoc.data();
      if (l.userId !== currentUser.uid) return;
      if (
        f.itemType === l.itemType &&
        f.location.city === l.location.city &&
        f.location.area === l.location.area
      ) {
        hasMatch = true;
        noText.style.display = "none";

        const div = document.createElement("div");
        div.className = "matchItem";
        div.style.cursor = "pointer";

        div.innerHTML = `
          <strong>${serial}. ${f.itemType.toUpperCase()} – 
          ${f.location.area}, ${f.location.city}</strong><br>
          ✅ Possible match<br>
          📞 Finder Contact: <strong>${f.contactNumber}</strong>
        `;

        div.onclick = async () => {
          const confirmFound = confirm(
            "Have you found your item?\n\n" +
            "If you click OK, then this will mark the item as recovered."
          );

          if (!confirmFound) return;

          // 1️⃣ Add to recovered_items
          await addDoc(collection(db, "recovered_items"), {
            itemType: f.itemType,
            location: {
              city: f.location.city,
              area: f.location.area
            },
            foundBy: {
              userId: f.userId,
            },
            recoveredAt: new Date()
          });

          // 2️⃣ Delete from both collections
          await deleteDoc(doc(db, "found_items", fDoc.id));
          await deleteDoc(doc(db, "lost_items", lDoc.id));

          alert("🎉 Item successfully marked as recovered!");

          // 3️⃣ Refresh UI
          matchLostAndFound();
          displayFoundItems();
          displayMyLostItems();
          displayRecoveredItems();   // 👈 new function
        };


        container.appendChild(div);
        serial++;
      }
    });
  });

  noText.style.display = hasMatch ? "none" : "block";
}
matchLostAndFound();

/* ===============================
   LOGIN BUTTON
================================ */
document.getElementById("loginBtn").addEventListener("click", () => {
  window.location.href = "login.html";
});
async function isMatchFoundForLost(lostData) {
  const foundSnap = await getDocs(collection(db, "found_items"));

  let matchFound = false;

  foundSnap.forEach(docSnap => {
    const found = docSnap.data();

    if (
      found.itemType === lostData.itemType &&
      found.location.city === lostData.location.city &&
      found.location.area === lostData.location.area
    ) {
      matchFound = true;
    }
  });

  return matchFound;
}
async function displayMyLostItems() {
  const container = document.getElementById("myLostItems");
  const noText = document.getElementById("noMyLostText");

  // Remove old items
  container.querySelectorAll(".myLostItem").forEach(e => e.remove());

  const lostSnap = await getDocs(collection(db, "lost_items"));

  let serial = 1;
  let hasAny = false;

  for (const docSnap of lostSnap.docs) {
    const lost = docSnap.data();

    // 🔴 ONLY CURRENT USER'S LOST ITEMS
    if (lost.userId !== currentUser.uid) continue;

    hasAny = true;

    const matchFound = await isMatchFoundForLost(lost);

    const div = document.createElement("div");
    div.className = "myLostItem";
    div.style.borderBottom = "1px solid #ddd";
    div.style.padding = "6px 0";

    div.innerHTML = `
      <strong>${serial}. ${lost.itemType.toUpperCase()} – 
      ${lost.location.area}, ${lost.location.city}</strong><br>
      Status: 
      <span style="color:${matchFound ? "green" : "orange"};">
        ${matchFound ? "✅ Match found" : "⏳ Not found yet"}
      </span>
    `;

    container.appendChild(div);
    serial++;
  }

  noText.style.display = hasAny ? "none" : "block";
}
document.getElementById("goLost").addEventListener("click", () => {
  window.location.href = "lost.html";
});

document.getElementById("goFound").addEventListener("click", () => {
  window.location.href = "found.html";
});
async function checkImmediateMatchForLost(lostData) {
  const snapshot = await getDocs(collection(db, "found_items"));

  let matchFound = false;

  snapshot.forEach(docSnap => {
    const found = docSnap.data();

    if (
      found.itemType === lostData.itemType &&
      found.location.city === lostData.location.city &&
      found.location.area === lostData.location.area
    ) {
      matchFound = true;
    }
  });

  return matchFound;
}
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  alert("Logged out successfully!");
  window.location.href = "index.html";
});
async function displayRecoveredItems() {
  const container = document.getElementById("dispRecovered");
  const noText = document.getElementById("noRecoveredText");

  container.innerHTML = "";

  const snap = await getDocs(collection(db, "recovered_items"));

  let serial = 1;
  let hasData = false;

  snap.forEach(docSnap => {
    hasData = true;
    const data = docSnap.data();

    const div = document.createElement("div");
    div.style.borderBottom = "1px solid #ddd";
    div.style.padding = "6px 0";

    div.innerHTML = `
      <strong>${serial}. ${data.itemType.toUpperCase()}</strong> –
      ${data.location.area}, ${data.location.city}<br>
      <small>Recovered on: ${new Date(data.recoveredAt.seconds * 1000).toDateString()}</small>
    `;

    container.appendChild(div);
    serial++;
  });

  noText.style.display = hasData ? "none" : "block";
}
displayRecoveredItems();
displayMyLostItems();
