import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// ================= ELEMENTS =================
const userText = document.getElementById("user");
const logoutBtn = document.getElementById("logoutBtn");

const scheduleTab = document.getElementById("scheduleTab");
const plannerTab = document.getElementById("plannerTab");
const cgpaTab = document.getElementById("cgpaTab");

const scheduleSection = document.getElementById("scheduleSection");
const plannerSection = document.getElementById("plannerSection");
const cgpaSection = document.getElementById("cgpaSection");

let currentUser;


// =====================================================
// ================= TAB SYSTEM (FIXED) =================
// =====================================================

function showSection(sectionName) {

  const sections = {
    schedule: scheduleSection,
    planner: plannerSection,
    cgpa: cgpaSection
  };

  Object.values(sections).forEach(s => s.classList.remove("active"));

  sections[sectionName].classList.add("active");

  localStorage.setItem("lastTab", sectionName);
}

// restore last opened tab
const lastTab = localStorage.getItem("lastTab") || "schedule";
showSection(lastTab);

scheduleTab.onclick = () => showSection("schedule");
plannerTab.onclick = () => showSection("planner");
cgpaTab.onclick = () => showSection("cgpa");


// =====================================================
// ================= AUTH =================
// =====================================================

onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  userText.innerText = "Logged in: " + user.email;

  // 🔥 load everything only AFTER auth
  loadSchedule();
  loadPlanner();
  loadCGPA();
});

logoutBtn.onclick = () => signOut(auth);



// =====================================================
// ================= SCHEDULE =================
// =====================================================

const title = document.getElementById("title");
const time = document.getElementById("time");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("list");

const dayCheckboxes =
  document.querySelectorAll("#scheduleSection input[type=checkbox]");

addBtn.onclick = async () => {

  const days = [];
  dayCheckboxes.forEach(cb => cb.checked && days.push(cb.value));

  if (!title.value || !time.value || !days.length) return;

  for (let d of days) {
    await addDoc(
      collection(db, "users", currentUser.uid, "schedule"),
      { title: title.value, day: d, time: time.value }
    );
  }

  title.value = "";
  time.value = "";
  dayCheckboxes.forEach(cb => cb.checked = false);

  loadSchedule();
};


async function loadSchedule() {

  list.innerHTML = "";

  const snap = await getDocs(
    collection(db, "users", currentUser.uid, "schedule")
  );

  snap.forEach(d => {
    const data = d.data();

    const li = document.createElement("li");
    li.innerText = `${data.title} - ${data.day} - ${data.time} `;

    const del = document.createElement("button");
    del.innerText = "Delete";

    del.onclick = async () => {
      await deleteDoc(doc(db, "users", currentUser.uid, "schedule", d.id));
      loadSchedule();
    };

    li.append(del);
    list.appendChild(li);
  });
}



// =====================================================
// ================= PLANNER =================
// =====================================================

const taskInput = document.getElementById("taskInput");
const taskBtn = document.getElementById("taskBtn");
const taskList = document.getElementById("taskList");
const prioritySelect = document.getElementById("priority");

taskBtn.onclick = async () => {

  if (!taskInput.value) return;

  await addDoc(
    collection(db, "users", currentUser.uid, "planner"),
    {
      text: taskInput.value,
      priority: prioritySelect.value,
      done: false
    }
  );

  taskInput.value = "";
  loadPlanner();
};


async function loadPlanner() {

  taskList.innerHTML = "";

  const snap = await getDocs(
    collection(db, "users", currentUser.uid, "planner")
  );

  snap.forEach(d => {

    const data = d.data();

    const li = document.createElement("li");

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = data.done;

    check.onchange = async () => {
      await updateDoc(
        doc(db, "users", currentUser.uid, "planner", d.id),
        { done: check.checked }
      );
    };

    li.append(check, document.createTextNode(` ${data.text}`));
    taskList.appendChild(li);
  });
}



// =====================================================
// ================= CGPA =================
// =====================================================

const subName = document.getElementById("subName");
const credits = document.getElementById("credits");
const grade = document.getElementById("grade");
const addSubBtn = document.getElementById("addSubBtn");
const cgpaList = document.getElementById("cgpaList");
const cgpaResult = document.getElementById("cgpaResult");

const gradeMap = { O:10, "A+":9, A:8, "B+":7, B:6, C:5 };

addSubBtn.onclick = async () => {

  await addDoc(
    collection(db, "users", currentUser.uid, "cgpa"),
    {
      subject: subName.value,
      credits: Number(credits.value),
      grade: grade.value.toUpperCase()
    }
  );

  loadCGPA();
};


async function loadCGPA() {

  cgpaList.innerHTML = "";

  let total = 0, creditSum = 0;

  const snap = await getDocs(
    collection(db, "users", currentUser.uid, "cgpa")
  );

  snap.forEach(d => {

    const data = d.data();

    total += gradeMap[data.grade] * data.credits;
    creditSum += data.credits;

    const li = document.createElement("li");
    li.innerText = `${data.subject} - ${data.credits} - ${data.grade}`;
    cgpaList.appendChild(li);
  });

  cgpaResult.innerText =
    "CGPA: " + (creditSum ? (total/creditSum).toFixed(2) : 0);
}
