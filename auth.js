import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔴 Your Firebase config */
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
const auth = getAuth(app);
const db = getFirestore(app);

/* ===============================
   REGISTER
================================ */
window.registerUser = async function () {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const contact = document.getElementById("regContact").value;
  const password = document.getElementById("regPassword").value;

  // 🔴 FRONTEND VALIDATION
  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  try {
    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      contactNumber: contact,
      createdAt: new Date()
    });

    alert("Registration successful!");
    window.location.href = "login.html";

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    // 🔴 BACKEND ERROR HANDLING
    if (error.code === "auth/email-already-in-use") {
      alert("This email is already registered.");
    }
    else if (error.code === "auth/invalid-email") {
      alert("Invalid email format.");
    }
    else if (error.code === "auth/weak-password") {
      alert("Password is too weak. Use at least 6 characters.");
    }
    else {
      alert("Registration failed: " + error.code);
    }
  }
};

/* ===============================
   LOGIN
================================ */
window.loginUser = async function () {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);

        alert("Login successful!");
        window.location.href = "index.html";

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        // Handle known cases
        if (error.code === "auth/wrong-password") {
            alert("Invalid password!");
        }
        else if (error.code === "auth/user-not-found") {
            alert("No account found. Please register.");
        }
        else if (error.code === "auth/invalid-email") {
            alert("Invalid email format.");
        }
        else if (error.code === "auth/operation-not-allowed") {
            alert("Email/Password login is not enabled in Firebase.");
        }
        else {
            // 🔴 THIS IS WHAT YOU WERE MISSING
            alert("Login failed: " + error.code);
        }
    }
};
