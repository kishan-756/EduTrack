import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const addBtn = document.getElementById("addBtn");
const subject = document.getElementById("subject");
const list = document.getElementById("list");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser;


onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "index.html";

  currentUser = user;
  load();
});

logoutBtn.onclick = () => signOut(auth);


addBtn.onclick = async () => {
  await addDoc(collection(db, "users", currentUser.uid, "schedule"), {
    subject: subject.value
  });

  subject.value = "";
  load();
};


async function load() {
  list.innerHTML = "";

  const snap = await getDocs(
    collection(db, "users", currentUser.uid, "schedule")
  );

  snap.forEach(d => {
    const li = document.createElement("li");
    li.innerText = d.data().subject;
    list.appendChild(li);
  });
}
