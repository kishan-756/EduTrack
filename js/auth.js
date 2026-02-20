import { auth } from "../firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const nameInput = document.getElementById("name");
const mainBtn = document.getElementById("mainBtn");
const toggleAuth = document.getElementById("toggleAuth");
const nameField = document.getElementById("nameField");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const toggleText = document.getElementById("toggleText");

let isLogin = true;

toggleAuth.onclick = () => {
  isLogin = !isLogin;
  nameField.style.display = isLogin ? "none" : "block";
  authTitle.innerText = isLogin ? "Welcome Back" : "Create Account";
  authSubtitle.innerText = isLogin ? "Sign in to track your progress" : "Join EduTrack to start your journey";
  mainBtn.innerText = isLogin ? "Login" : "Register";
  toggleText.innerHTML = isLogin
    ? `Don't have an account? <span id="toggleAuth" style="color: var(--primary); cursor: pointer; font-weight: 600;">Create one</span>`
    : `Already have an account? <span id="toggleAuth" style="color: var(--primary); cursor: pointer; font-weight: 600;">Sign in</span>`;

  // Re-attach listener since we replaced the innerHTML
  document.getElementById("toggleAuth").onclick = toggleAuth.onclick;
};

mainBtn.onclick = async () => {
  try {
    if (isLogin) {
      await signInWithEmailAndPassword(auth, email.value, password.value);
    } else {
      await createUserWithEmailAndPassword(auth, email.value, password.value);
      // Note: You can add user profile update here if needed
    }
  } catch (error) {
    alert(error.message);
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "dashboard.html";
});
