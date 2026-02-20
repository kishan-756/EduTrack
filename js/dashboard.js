// =====================================================
// 🔥 IMPORTS
// =====================================================

import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection, addDoc, getDocs,
  deleteDoc, updateDoc, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// =====================================================
// 🔥 DOM
// =====================================================

// sections
const scheduleSection = document.getElementById("scheduleSection");
const plannerSection = document.getElementById("plannerSection");
const cgpaSection = document.getElementById("cgpaSection");

// nav
const scheduleTab = document.getElementById("scheduleTab");
const plannerTab = document.getElementById("plannerTab");
const cgpaTab = document.getElementById("cgpaTab");
const logoutBtn = document.getElementById("logoutBtn");
const themeBtn = document.getElementById("themeToggle");

// schedule
const titleInput = document.getElementById("title");
const timeInput = document.getElementById("time");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("list");

// planner
const taskInput = document.getElementById("taskInput");
const taskBtn = document.getElementById("taskBtn");
const taskList = document.getElementById("taskList");
const priority = document.getElementById("priority");

// cgpa
const semester = document.getElementById("semester");
const subName = document.getElementById("subName");
const credits = document.getElementById("credits");
const grade = document.getElementById("grade");
const addSubBtn = document.getElementById("addSubBtn");
const cgpaList = document.getElementById("cgpaList");
const overallCgpa = document.getElementById("overallCgpa");
const chartCanvas = document.getElementById("gpaChart");

let currentUser;
let gpaChart = null;


// =====================================================
// 🌗 THEME
// =====================================================

function setTheme(mode) {
  document.body.classList.toggle("dark", mode === "dark");
  themeBtn.innerText = mode === "dark" ? "☀︎" : "☾";
  localStorage.setItem("theme", mode);
}

setTheme(localStorage.getItem("theme") || "light");

themeBtn.onclick = () => {
  setTheme(document.body.classList.contains("dark") ? "light" : "dark");
};


// =====================================================
// 📌 NAVIGATION
// =====================================================

function show(section) {
  [scheduleSection, plannerSection, cgpaSection]
    .forEach(s => s.classList.remove("active"));
  section.classList.add("active");
}

scheduleTab.onclick = () => show(scheduleSection);
plannerTab.onclick = () => show(plannerSection);
cgpaTab.onclick = () => show(cgpaSection);


// =====================================================
// 🔐 AUTH
// =====================================================

onAuthStateChanged(auth, user => {
  if (!user) location.href = "index.html";

  currentUser = user;

  loadSchedule();
  loadPlanner();
  loadCGPA();
});

logoutBtn.onclick = () => signOut(auth);



// =====================================================
// 📅 SCHEDULE
// =====================================================

let editScheduleId = null;

addBtn.onclick = async () => {

  const days = [];
  document.querySelectorAll("#scheduleSection input[type=checkbox]")
    .forEach(cb => cb.checked && days.push(cb.value));

  if (!days.length) days.push("One-time");

  const data = {
    title: titleInput.value.trim(),
    time: timeInput.value,
    days
  };

  if (!data.title || !data.time) return;

  if (editScheduleId) {
    await updateDoc(doc(db, "users", currentUser.uid, "schedule", editScheduleId), data);
    editScheduleId = null;
    addBtn.innerText = "Add";
  } else {
    await addDoc(collection(db, "users", currentUser.uid, "schedule"), data);
  }

  titleInput.value = "";
  timeInput.value = "";
  document.querySelectorAll("#scheduleSection input[type=checkbox]").forEach(cb => cb.checked = false);
  loadSchedule();
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekOrderFromToday() {
  const today = new Date().getDay();
  return DAYS.slice(today).concat(DAYS.slice(0, today));
}

function scheduleSortKey(data) {
  const days = Array.isArray(data.days) ? data.days : ["One-time"];
  if (days.includes("One-time")) return { rank: 0, time: data.time || "00:00", heading: "One-time" };
  const weekOrder = getWeekOrderFromToday();
  let rank = 7;
  for (const d of days) {
    const i = weekOrder.indexOf(d);
    if (i !== -1 && i < rank) rank = i;
  }
  const labels = ["Today", "Tomorrow"];
  const heading = rank < 2 ? labels[rank] : (weekOrder[rank] || "");
  return { rank, time: data.time || "00:00", heading };
}

async function loadSchedule() {

  list.innerHTML = "";

  const snap = await getDocs(collection(db, "users", currentUser.uid, "schedule"));
  const weekOrder = getWeekOrderFromToday();

  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => {
    const ka = scheduleSortKey(a), kb = scheduleSortKey(b);
    if (ka.rank !== kb.rank) return ka.rank - kb.rank;
    return (a.time || "00:00").localeCompare(b.time || "00:00");
  });

  let lastHeading = null;
  items.forEach(({ id, ...data }) => {
    const heading = scheduleSortKey(data).heading;
    if (heading !== lastHeading) {
      lastHeading = heading;
      const headLi = document.createElement("li");
      headLi.className = "schedule-day-heading";
      headLi.textContent = heading;
      list.appendChild(headLi);
    }

    const daysStr = Array.isArray(data.days) ? data.days.join(", ") : (data.days || "One-time");

    const li = document.createElement("li");
    li.innerText = `${data.title} - ${data.time} (${daysStr})`;

    const editBtn = document.createElement("button");
    editBtn.innerText = "Edit";
    editBtn.style.marginLeft = "8px";
    editBtn.onclick = () => {
      editScheduleId = id;
      titleInput.value = data.title;
      timeInput.value = data.time || "";
      document.querySelectorAll("#scheduleSection input[type=checkbox]").forEach(cb => {
        cb.checked = Array.isArray(data.days) && data.days.includes(cb.value);
      });
      addBtn.innerText = "Update";
      titleInput.focus();
    };

    const delBtn = document.createElement("button");
    delBtn.innerText = "Delete";
    delBtn.style.marginLeft = "4px";
    delBtn.onclick = async () => {
      await deleteDoc(doc(db, "users", currentUser.uid, "schedule", id));
      if (editScheduleId === id) { editScheduleId = null; addBtn.innerText = "Add"; titleInput.value = ""; timeInput.value = ""; }
      loadSchedule();
    };

    li.append(editBtn, delBtn);
    list.appendChild(li);
  });
}



// =====================================================
// 📝 PLANNER
// =====================================================

let editTaskId = null;

taskBtn.onclick = async () => {

  const text = taskInput.value.trim();
  if (!text) return;

  const data = {
    text,
    priority: priority.value,
    done: false
  };

  if (editTaskId) {
    await updateDoc(doc(db, "users", currentUser.uid, "planner", editTaskId), { text: data.text, priority: data.priority });
    editTaskId = null;
    taskBtn.innerText = "Add Task";
  } else {
    await addDoc(collection(db, "users", currentUser.uid, "planner"), data);
  }

  taskInput.value = "";
  loadPlanner();
};

async function loadPlanner() {

  taskList.innerHTML = "";

  const snap = await getDocs(collection(db, "users", currentUser.uid, "planner"));

  snap.forEach(d => {

    const data = d.data();

    const li = document.createElement("li");

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = data.done;

    const span = document.createElement("span");
    span.innerText = " " + data.text + " ";

    if (data.done) span.style.textDecoration = "line-through";

    check.onchange = async () => {
      await updateDoc(doc(db, "users", currentUser.uid, "planner", d.id), { done: check.checked });
      span.style.textDecoration = check.checked ? "line-through" : "none";
    };

    const badge = document.createElement("span");
    badge.innerText = data.priority;
    badge.style.marginLeft = "8px";
    badge.style.color = "white";
    badge.style.padding = "2px 6px";
    badge.style.borderRadius = "6px";

    if (data.priority === "Low") badge.style.background = "green";
    if (data.priority === "Medium") badge.style.background = "orange";
    if (data.priority === "High") badge.style.background = "red";

    span.appendChild(badge);

    const editBtn = document.createElement("button");
    editBtn.innerText = "Edit";
    editBtn.style.marginLeft = "8px";
    editBtn.onclick = () => {
      editTaskId = d.id;
      taskInput.value = data.text;
      priority.value = data.priority;
      taskBtn.innerText = "Update Task";
      taskInput.focus();
    };

    const delBtn = document.createElement("button");
    delBtn.innerText = "Delete";
    delBtn.style.marginLeft = "4px";
    delBtn.onclick = async () => {
      await deleteDoc(doc(db, "users", currentUser.uid, "planner", d.id));
      if (editTaskId === d.id) { editTaskId = null; taskBtn.innerText = "Add Task"; taskInput.value = ""; }
      loadPlanner();
    };

    li.append(check, span, editBtn, delBtn);
    taskList.appendChild(li);
  });
}



// =====================================================
// 📊 CGPA (SEMESTER GROUPED + BAR CHART)
// =====================================================

let editCgpaId = null;

const gradeMap = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5 };

addSubBtn.onclick = async () => {

  const subject = subName.value.trim();
  if (!subject) return;

  const data = {
    subject,
    credits: Number(credits.value),
    grade: grade.value,
    sem: semester.value
  };

  if (editCgpaId) {
    await updateDoc(doc(db, "users", currentUser.uid, "cgpa", editCgpaId), data);
    editCgpaId = null;
  } else {
    await addDoc(collection(db, "users", currentUser.uid, "cgpa"), data);
  }

  subName.value = "";
  credits.value = "";
  grade.value = "";

  loadCGPA();
};

semester.onchange = loadCGPA;

async function loadCGPA() {

  cgpaList.innerHTML = "";

  const snap = await getDocs(collection(db, "users", currentUser.uid, "cgpa"));

  const semData = {};

  let totalPoints = 0, totalCredits = 0;

  snap.forEach(d => {
    const data = d.data();

    const pts = gradeMap[data.grade] * data.credits;

    totalPoints += pts;
    totalCredits += data.credits;

    if (!semData[data.sem])
      semData[data.sem] = { points: 0, credits: 0, subjects: [] };

    semData[data.sem].points += pts;
    semData[data.sem].credits += data.credits;
    semData[data.sem].subjects.push({ id: d.id, ...data });
  });

  const overall = totalCredits ? (totalPoints / totalCredits).toFixed(2) : 0;
  overallCgpa.innerText = "Overall CGPA: " + overall;


  const labels = [];
  const values = [];

  Object.keys(semData).sort().forEach(sem => {

    const heading = document.createElement("h4");
    heading.innerText = "Semester " + sem;
    cgpaList.appendChild(heading);

    const s = semData[sem];

    labels.push("Sem " + sem);
    values.push((s.points / s.credits).toFixed(2));

    s.subjects.forEach(data => {

      const li = document.createElement("li");
      li.innerText = `${data.subject} - ${data.credits}cr - ${data.grade}`;

      const del = document.createElement("button");
      del.innerText = "Delete";
      del.onclick = () => deleteDoc(doc(db, "users", currentUser.uid, "cgpa", data.id)).then(loadCGPA);

      li.append(del);
      cgpaList.appendChild(li);
    });
  });

  if (gpaChart) gpaChart.destroy();

  gpaChart = new Chart(chartCanvas, {
    type: "bar",
    data: { labels, datasets: [{ label: "Semester GPA", data: values }] },
    options: { responsive: true, scales: { y: { min: 0, max: 10 } } }
  });
}
