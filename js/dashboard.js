// =====================================================
// 🔥 IMPORTS
// =====================================================

import { auth, db, storage } from "../firebase.js";

import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection, addDoc, getDocs,
  deleteDoc, updateDoc, doc, query, where, setDoc, getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// =====================================================
// 🔥 DOM
// =====================================================

// sections
const scheduleSection = document.getElementById("scheduleSection");
const plannerSection = document.getElementById("plannerSection");
const cgpaSection = document.getElementById("cgpaSection");
const focusSection = document.getElementById("focusSection");
const storageSection = document.getElementById("storageSection");

// storage DOM
const storageGrid = document.getElementById("storageGrid");
const addItemSection = document.getElementById("addItemSection");
const createFolderBtn = document.getElementById("createFolderBtn");
const saveItemBtn = document.getElementById("saveItemBtn");
const cancelItemBtn = document.getElementById("cancelItemBtn");
const resourceType = document.getElementById("resourceType");
const linkInputGroup = document.getElementById("linkInputGroup");
const fileInputGroup = document.getElementById("fileInputGroup");
const fileInput = document.getElementById("fileInput");
const resourceName = document.getElementById("resourceName");
const resourceUrl = document.getElementById("resourceUrl");
const folderBreadcrumb = document.getElementById("folderBreadcrumb");
const toggleAddItemBtn = document.getElementById("toggleAddItemBtn");
const closeAddItemBtn = document.getElementById("closeAddItemBtn");
const backToStorageBtn = document.getElementById("backToStorageBtn");

const folderModal = document.getElementById("folderModal");
const folderNameInput = document.getElementById("folderNameInput");
const closeFolderModal = document.getElementById("closeFolderModal");
const confirmFolderBtn = document.getElementById("confirmFolderBtn");
const modalTitle = document.getElementById("modalTitle");

let currentFolderId = null;
let editFolderId = null; // To track if we are editing an existing folder

// nav
const tabs = document.querySelectorAll(".nav-item");
const logoutBtn = document.getElementById("logoutBtn");
const themeBtn = document.getElementById("themeToggle");
const userDisplay = document.getElementById("user");

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
const semesterSelector = document.getElementById("semester");
const subName = document.getElementById("subName");
const credits = document.getElementById("credits");
const grade = document.getElementById("grade");
const addSubBtn = document.getElementById("addSubBtn");
const cgpaList = document.getElementById("cgpaList");
const overallCgpa = document.getElementById("overallCgpa");
const gpaChartCanvas = document.getElementById("gpaChart");

// focus
const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startTimer");
const resetBtn = document.getElementById("resetTimer");
const studyModeBtn = document.getElementById("studyMode");
const breakModeBtn = document.getElementById("breakMode");
const studyChartCanvas = document.getElementById("studyChart");

let currentUser;
let gpaChart = null;
let studyChart = null;
let timerInterval = null;
let timeLeft = 25 * 60;
let isStudyMode = true;
let isTimerRunning = false;


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

function show(tabId) {
  const sections = {
    scheduleTab: scheduleSection,
    plannerTab: plannerSection,
    cgpaTab: cgpaSection,
    storageTab: storageSection,
    focusTab: focusSection
  };

  Object.keys(sections).forEach(id => {
    sections[id].classList.remove("active");
    document.getElementById(id).classList.remove("active");
  });

  sections[tabId].classList.add("active");
  document.getElementById(tabId).classList.add("active");

  if (tabId === "focusTab") loadStudyActivity();
  if (tabId === "storageTab") loadFolders();
}

tabs.forEach(tab => {
  tab.onclick = () => show(tab.id);
});


// =====================================================
// 🔐 AUTH
// =====================================================

onAuthStateChanged(auth, user => {
  if (!user) location.href = "index.html";

  currentUser = user;
  userDisplay.innerText = user.email.split("@")[0];

  loadSchedule();
  loadPlanner();
  loadCGPA();
  loadFolders();
  loadStudyActivity();
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
    addBtn.innerText = "Add Event";
  } else {
    await addDoc(collection(db, "users", currentUser.uid, "schedule"), data);
  }

  titleInput.value = "";
  timeInput.value = "";
  document.querySelectorAll("#scheduleSection input[type=checkbox]").forEach(cb => cb.checked = false);
  loadSchedule();
};

async function loadSchedule() {
  list.innerHTML = "";
  const snap = await getDocs(collection(db, "users", currentUser.uid, "schedule"));

  snap.forEach(d => {
    const data = d.data();
    const li = document.createElement("li");
    const daysStr = data.days.join(", ");

    li.innerHTML = `
            <div>
                <strong style="display:block">${data.title}</strong>
                <span style="font-size:12px; color:#64748b">${data.time} | ${daysStr}</span>
            </div>
            <div style="display:flex; gap:5px">
                <button class="btn btn-outline" style="padding:4px 8px; font-size:12px">Edit</button>
                <button class="btn btn-outline" style="padding:4px 8px; font-size:12px; color:#ef4444">Delete</button>
            </div>
        `;

    const [editB, delB] = li.querySelectorAll("button");

    editB.onclick = () => {
      editScheduleId = d.id;
      titleInput.value = data.title;
      timeInput.value = data.time;
      document.querySelectorAll("#scheduleSection input[type=checkbox]").forEach(cb => {
        cb.checked = data.days.includes(cb.value);
      });
      addBtn.innerText = "Update Event";
      titleInput.focus();
    };

    delB.onclick = async () => {
      await deleteDoc(doc(db, "users", currentUser.uid, "schedule", d.id));
      loadSchedule();
    };

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

  const data = { text, priority: priority.value, done: false };

  if (editTaskId) {
    await updateDoc(doc(db, "users", currentUser.uid, "planner", editTaskId), { text: data.text, priority: data.priority });
    editTaskId = null;
    taskBtn.innerText = "Add to Planner";
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

    const badgeColor = data.priority === "High" ? "#ef4444" : data.priority === "Medium" ? "#f59e0b" : "#10b981";

    li.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px">
                <input type="checkbox" ${data.done ? "checked" : ""} style="width:20px; margin-bottom:0">
                <span style="${data.done ? "text-decoration:line-through; opacity:0.6" : ""}">${data.text}</span>
                <span class="badge" style="background:${badgeColor}">${data.priority}</span>
            </div>
            <div style="display:flex; gap:5px">
                <button class="btn btn-outline" style="padding:4px 8px; font-size:12px">Edit</button>
                <button class="btn btn-outline" style="padding:4px 8px; font-size:12px; color:#ef4444">Delete</button>
            </div>
        `;

    const check = li.querySelector("input");
    check.onchange = async () => {
      await updateDoc(doc(db, "users", currentUser.uid, "planner", d.id), { done: check.checked });
      loadPlanner();
    };

    const [editB, delB] = li.querySelectorAll("button");
    editB.onclick = () => {
      editTaskId = d.id;
      taskInput.value = data.text;
      priority.value = data.priority;
      taskBtn.innerText = "Update Task";
      taskInput.focus();
    };
    delB.onclick = async () => {
      await deleteDoc(doc(db, "users", currentUser.uid, "planner", d.id));
      loadPlanner();
    };

    taskList.appendChild(li);
  });
}



// =====================================================
// 📊 CGPA
// =====================================================

const gradeMap = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5 };
let editCgpaId = null;

addSubBtn.onclick = async () => {
  const subject = subName.value.trim();
  if (!subject) return;

  const data = {
    subject,
    credits: Number(credits.value),
    grade: grade.value,
    sem: semesterSelector.value
  };

  if (editCgpaId) {
    await updateDoc(doc(db, "users", currentUser.uid, "cgpa", editCgpaId), data);
    editCgpaId = null;
    addSubBtn.innerText = "Add Result";
  } else {
    await addDoc(collection(db, "users", currentUser.uid, "cgpa"), data);
  }

  subName.value = ""; credits.value = ""; grade.value = "";
  loadCGPA();
};

async function loadCGPA() {
  const semesterGrid = document.getElementById("semesterGrid");
  semesterGrid.innerHTML = "";

  const snap = await getDocs(collection(db, "users", currentUser.uid, "cgpa"));
  const semData = {};
  let totalPoints = 0, totalCredits = 0;

  snap.forEach(d => {
    const data = d.data();
    const pts = (gradeMap[data.grade] || 0) * data.credits;
    totalPoints += pts;
    totalCredits += data.credits;

    if (!semData[data.sem]) semData[data.sem] = { points: 0, credits: 0, subjects: [] };
    semData[data.sem].points += pts;
    semData[data.sem].credits += data.credits;
    semData[data.sem].subjects.push({ id: d.id, ...data });
  });

  const overall = totalCredits ? (totalPoints / totalCredits).toFixed(2) : "0.00";
  overallCgpa.innerText = overall;

  Object.keys(semData).sort().forEach(sem => {
    const s = semData[sem];
    const semGpa = (s.points / s.credits).toFixed(2);

    const card = document.createElement("div");
    card.className = "sem-card animate-fadeIn";
    card.innerHTML = `
            <div class="sem-header">
                <strong>Semester ${sem}</strong>
                <span class="badge" style="background: var(--primary)">GPA: ${semGpa}</span>
            </div>
            <div class="sem-body"></div>
        `;

    const body = card.querySelector(".sem-body");
    s.subjects.forEach(sub => {
      const row = document.createElement("div");
      row.className = "sem-subject";
      row.innerHTML = `
                <span>${sub.subject} (${sub.credits}cr) - <strong>${sub.grade}</strong></span>
                <div style="display:flex; gap:8px">
                    <button class="edit-sub" style="background:none; border:none; color:var(--primary); cursor:pointer; font-size:12px">Edit</button>
                    <button class="del-sub" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:12px">X</button>
                </div>
            `;

      row.querySelector(".edit-sub").onclick = () => {
        editCgpaId = sub.id;
        subName.value = sub.subject;
        credits.value = sub.credits;
        grade.value = sub.grade;
        semesterSelector.value = sub.sem;
        addSubBtn.innerText = "Update Result";
        subName.focus();
      };

      row.querySelector(".del-sub").onclick = async () => {
        await deleteDoc(doc(db, "users", currentUser.uid, "cgpa", sub.id));
        loadCGPA();
      };

      body.appendChild(row);
    });

    semesterGrid.appendChild(card);
  });

  const labels = Object.keys(semData).sort();
  const values = labels.map(l => (semData[l].points / semData[l].credits).toFixed(2));

  if (gpaChart) gpaChart.destroy();
  gpaChart = new Chart(gpaChartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "GPA",
        data: values,
        backgroundColor: "#4f46e5",
        borderRadius: 8,
        barThickness: 40
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 10,
          grid: {
            display: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}



// =====================================================
// ⏱️ FOCUS (POMODORO + ACTIVITY)
// =====================================================

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  timerDisplay.innerText = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

const pomodoroCard = document.getElementById("pomodoroCard");
const fullscreenTimerBtn = document.getElementById("fullscreenTimer");

fullscreenTimerBtn.onclick = () => {
  if (!document.fullscreenElement) {
    pomodoroCard.requestFullscreen().catch(err => {
      alert(`Error attempting to enable full-screen mode: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};

document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    fullscreenTimerBtn.innerText = "✖";
    fullscreenTimerBtn.title = "Exit Full Screen";
  } else {
    fullscreenTimerBtn.innerText = "⛶";
    fullscreenTimerBtn.title = "Full Screen";
  }
});

studyModeBtn.onclick = () => {
  isStudyMode = true;
  timeLeft = 25 * 60;
  studyModeBtn.classList.add("active");
  breakModeBtn.classList.remove("active");
  updateTimerDisplay();
};

breakModeBtn.onclick = () => {
  isStudyMode = false;
  timeLeft = 5 * 60;
  breakModeBtn.classList.add("active");
  studyModeBtn.classList.remove("active");
  updateTimerDisplay();
};

startBtn.onclick = () => {
  if (isTimerRunning) {
    clearInterval(timerInterval);
    startBtn.innerText = "Start";
    isTimerRunning = false;
  } else {
    isTimerRunning = true;
    startBtn.innerText = "Pause";
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        startBtn.innerText = "Start";
        alert(isStudyMode ? "Study session finished! Take a break." : "Break over! Back to work.");
        if (isStudyMode) logStudyTime(25);
      }
    }, 1000);
  }
};

resetBtn.onclick = () => {
  clearInterval(timerInterval);
  isTimerRunning = false;
  startBtn.innerText = "Start";
  timeLeft = isStudyMode ? 25 * 60 : 5 * 60;
  updateTimerDisplay();
};

async function logStudyTime(minutes) {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today.getDay()];

  const docRef = doc(db, "users", currentUser.uid, "studyActivity", dateStr);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    await updateDoc(docRef, { minutes: snap.data().minutes + minutes });
  } else {
    await setDoc(docRef, { minutes, day: dayName, timestamp: today.getTime() });
  }
  loadStudyActivity();
}

async function loadStudyActivity() {
  const snap = await getDocs(collection(db, "users", currentUser.uid, "studyActivity"));
  const dataMap = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Get current week range (Sun to Sat)
  const now = new Date();
  const sun = new Date(now);
  sun.setDate(now.getDate() - now.getDay());
  sun.setHours(0, 0, 0, 0);

  const sat = new Date(sun);
  sat.setDate(sun.getDate() + 6);
  sat.setHours(23, 59, 59, 999);

  snap.forEach(d => {
    const data = d.data();
    if (data.timestamp >= sun.getTime() && data.timestamp <= sat.getTime()) {
      const date = new Date(data.timestamp);
      dataMap[dayNames[date.getDay()]] += data.minutes;
    }
  });

  const values = dayNames.map(d => (dataMap[d] / 60).toFixed(1)); // Convert to hours

  if (studyChart) studyChart.destroy();
  studyChart = new Chart(studyChartCanvas, {
    type: "bar",
    data: {
      labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      datasets: [{
        label: "Hours Studied",
        data: values,
        backgroundColor: "#10b981",
        borderRadius: 6
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, title: { display: true, text: "Hours" } } }
    }
  });
}
// =====================================================
// 📁 STORAGE LOGIC
// =====================================================

resourceType.onchange = () => {
  const isFile = resourceType.value === "file";
  fileInputGroup.style.display = isFile ? "block" : "none";
  linkInputGroup.style.display = isFile ? "none" : "block";
};

// --- Modal Helpers ---
const openModal = (id = null, name = "") => {
  editFolderId = id;
  folderNameInput.value = name;
  modalTitle.innerText = id ? "Edit Folder Name" : "Create New Folder";
  confirmFolderBtn.innerText = id ? "Save Changes" : "Create";
  folderModal.style.display = "flex";
  folderNameInput.focus();
};

const closeModal = () => {
  folderModal.style.display = "none";
  editFolderId = null;
  folderNameInput.value = "";
};

createFolderBtn.onclick = () => openModal();
closeFolderModal.onclick = closeModal;

confirmFolderBtn.onclick = async () => {
  const name = folderNameInput.value.trim();
  if (!name) return alert("Please enter a name");

  try {
    if (editFolderId) {
      await updateDoc(doc(db, "users", currentUser.uid, "folders", editFolderId), { name });
    } else {
      await addDoc(collection(db, "users", currentUser.uid, "folders"), {
        name,
        createdAt: serverTimestamp()
      });
    }
    closeModal();
    loadFolders();
  } catch (err) {
    console.error(err);
  }
};

async function loadFolders() {
  currentFolderId = null;
  addItemSection.style.display = "none";
  toggleAddItemBtn.style.display = "none";
  backToStorageBtn.style.display = "none";
  storageGrid.innerHTML = "";
  createFolderBtn.style.display = "block";
  folderBreadcrumb.innerHTML = '<span style="cursor: pointer; color: var(--primary)" id="rootCrumb">Root</span>';
  document.getElementById("rootCrumb").onclick = loadFolders;

  const snap = await getDocs(collection(db, "users", currentUser.uid, "folders"));
  snap.forEach(d => {
    const folder = d.data();
    const card = document.createElement("div");
    card.className = "folder-card";
    card.innerHTML = `
      <button class="folder-menu-btn">⋮</button>
      <div class="folder-dropdown">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn" style="color: #ef4444">Delete</button>
      </div>
      <span class="folder-icon">📁</span>
      <strong style="display:block; margin-bottom:10px">${folder.name}</strong>
    `;

    const menuBtn = card.querySelector(".folder-menu-btn");
    const dropdown = card.querySelector(".folder-dropdown");

    // Toggle dropdown
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      // Close other open dropdowns
      document.querySelectorAll(".folder-dropdown").forEach(el => {
        if (el !== dropdown) el.style.display = "none";
      });
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    };

    // Close dropdown when clicking outside
    const closeDropdowns = () => {
      dropdown.style.display = "none";
    };
    document.addEventListener("click", closeDropdowns);

    const fId = d.id;
    const fName = folder.name;

    card.querySelector(".edit-btn").onclick = (e) => {
      e.stopPropagation();
      dropdown.style.display = "none";
      openModal(fId, fName);
    };

    card.querySelector(".delete-btn").onclick = async (e) => {
      e.stopPropagation();
      dropdown.style.display = "none";
      if (confirm(`Are you sure you want to delete "${fName}"?`)) {
        try {
          await deleteDoc(doc(db, "users", currentUser.uid, "folders", fId));
          loadFolders();
        } catch (err) { alert("Failed to delete folder: " + err.message); }
      }
    };

    card.onclick = (e) => {
      if (!e.target.closest(".folder-menu-btn") && !e.target.closest(".folder-dropdown")) {
        openFolder(fId, fName);
      }
    };

    storageGrid.appendChild(card);
  });
}

async function openFolder(id, name) {
  currentFolderId = id;
  storageGrid.innerHTML = "";
  createFolderBtn.style.display = "none";
  toggleAddItemBtn.style.display = "block";
  backToStorageBtn.style.display = "block";
  addItemSection.style.display = "none";

  folderBreadcrumb.innerHTML = `
    <span style="cursor: pointer; color: var(--primary)" id="backRoot">Root</span> / 
    <span style="font-weight: 700; color: var(--text-light)">${name}</span>
  `;
  document.getElementById("backRoot").onclick = loadFolders;

  loadItems();
}

async function loadItems() {
  const oldContainer = document.getElementById("itemsContainer");
  if (oldContainer) oldContainer.remove();

  const itemsContainer = document.createElement("div");
  itemsContainer.id = "itemsContainer";
  itemsContainer.style.marginTop = "20px";

  const snap = await getDocs(collection(db, "users", currentUser.uid, "folders", currentFolderId, "items"));

  if (snap.empty) {
    itemsContainer.innerHTML = '<div style="text-align:center; padding: 40px; color: #64748b;">No resources yet. Click "+ Add Resource" to get started!</div>';
  }

  snap.forEach(d => {
    const item = d.data();
    const card = document.createElement("div");
    card.className = "resource-item";
    const icon = item.type === "link" ? "🔗" : "📄";

    card.innerHTML = `
      <div class="resource-info">
        <div class="resource-icon">${icon}</div>
        <div>
          <a href="${item.url}" target="_blank">${item.name}</a>
          <span class="resource-type-tag">${item.type}</span>
        </div>
      </div>
      <button class="delete-resource-btn" title="Delete Resource">×</button>
    `;

    const itemId = d.id;
    const itemName = item.name;
    const itemType = item.type;
    const fid = currentFolderId;

    const delBtn = card.querySelector(".delete-resource-btn");
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${itemName}"?`)) {
        try {
          if (itemType === "file") {
            try {
              await deleteObject(ref(storage, `users/${currentUser.uid}/${fid}/${itemName}`));
            } catch (ignore) { }
          }
          await deleteDoc(doc(db, "users", currentUser.uid, "folders", fid, "items", itemId));
          loadItems();
        } catch (err) { alert("Delete failed: " + err.message); }
      }
    };
    itemsContainer.appendChild(card);
  });

  // Ensure itemsContainer spans full width and shows items correctly
  itemsContainer.style.gridColumn = "1 / -1";
  itemsContainer.style.width = "100%";

  storageGrid.appendChild(itemsContainer);
}

saveItemBtn.onclick = async () => {
  const type = resourceType.value;
  let name = resourceName.value;
  let url = resourceUrl.value;

  if (type === "file") {
    const file = fileInput.files[0];
    if (!file) return alert("Please select a file");
    name = file.name;

    saveItemBtn.innerText = "Uploading...";
    saveItemBtn.disabled = true;

    try {
      const storageRef = ref(storage, `users/${currentUser.uid}/${currentFolderId}/${file.name}`);
      await uploadBytes(storageRef, file);
      url = await getDownloadURL(storageRef);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. 💡 Tip: Try adding a Google Drive link as a 'Link' resource if your file is too large or failing to upload.");
      saveItemBtn.innerText = "Save Resource";
      saveItemBtn.disabled = false;
      return;
    }
  } else {
    if (!name || !url) return alert("Please fill all fields");
  }

  await addDoc(collection(db, "users", currentUser.uid, "folders", currentFolderId, "items"), {
    name,
    url,
    type,
    createdAt: serverTimestamp()
  });

  resourceName.value = "";
  resourceUrl.value = "";
  fileInput.value = "";
  saveItemBtn.innerText = "Save Resource";
  saveItemBtn.disabled = false;
  loadItems();
};

toggleAddItemBtn.onclick = () => {
  addItemSection.style.display = "block";
  toggleAddItemBtn.style.display = "none";
};

closeAddItemBtn.onclick = () => {
  addItemSection.style.display = "none";
  toggleAddItemBtn.style.display = "block";
};

backToStorageBtn.onclick = loadFolders;
