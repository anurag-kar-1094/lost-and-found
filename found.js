import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    addDoc,
    collection,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const app = initializeApp({
    apiKey: "AIzaSyCIwHZHSgkNHN0CaxhwbggBuWZGIfYo49g",
    authDomain: "lost-and-found-92a95.firebaseapp.com",
    projectId: "lost-and-found-92a95"
});

const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

onAuthStateChanged(auth, u => {
    if (!u) window.location.href = "login.html";
    currentUser = u;
});
async function getLoggedInUserContact() {
  const userRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User profile not found");
  }

  return userSnap.data().contactNumber;
}
const form = document.getElementById("itemForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert("You must be logged in.");
        return;
    }
    const itemType = document.getElementById("itemType").value;
    const city = document.getElementById("city").value;
    const area = document.getElementById("area").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    const contactNumber = await getLoggedInUserContact();

    const itemData = {
        userId: currentUser.uid,
        itemType,
        location: { city, area},
        date,
        time,
        contactNumber,
        createdAt: new Date()
    };
    await addDoc(collection(db, "found_items"), itemData);
    alert("Found item registered!");
    form.reset();
    window.location.href = "index.html";
});