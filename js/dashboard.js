// =====================================================
// ✅ IMPORTS MUST BE FIRST
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
// ✅ DOM ELEMENTS (DECLARE ONLY ONCE)
// =====================================================

// sections
const scheduleSection = document.getElementById("scheduleSection");
const plannerSection  = document.getElementById("plannerSection");
const cgpaSection     = document.getElementById("cgpaSection");

// nav
const scheduleTab = document.getElementById("scheduleTab");
const plannerTab  = document.getElementById("plannerTab");
const cgpaTab     = document.getElementById("cgpaTab");
const logoutBtn   = document.getElementById("logoutBtn");
const themeBtn    = document.getElementById("themeToggle");

// schedule
const titleInput = document.getElementById("title");
const timeInput  = document.getElementById("time");
const addBtn     = document.getElementById("addBtn");
const list       = document.getElementById("list");

// planner
const taskInput = document.getElementById("taskInput");
const taskBtn   = document.getElementById("taskBtn");
const taskList  = document.getElementById("taskList");
const priority  = document.getElementById("priority");

// cgpa
const subName   = document.getElementById("subName");
const credits   = document.getElementById("credits");
const grade     = document.getElementById("grade");
const addSubBtn = document.getElementById("addSubBtn");
const cgpaList  = document.getElementById("cgpaList");
const cgpaResult= document.getElementById("cgpaResult");

const userText  = document.getElementById("user");

let currentUser;


// =====================================================
// 🌗 THEME
// =====================================================

function setTheme(mode){
  document.body.classList.toggle("dark", mode==="dark");
  themeBtn.innerText = mode==="dark" ? "☀︎" : "☾";
  localStorage.setItem("theme", mode);
}

const saved = localStorage.getItem("theme");
if(saved) setTheme(saved);
else if(window.matchMedia('(prefers-color-scheme: dark)').matches)
  setTheme("dark");

themeBtn.onclick = ()=>{
  const dark = document.body.classList.contains("dark");
  setTheme(dark ? "light" : "dark");
};


// =====================================================
// 📌 NAVIGATION
// =====================================================

const sections = {
  schedule: scheduleSection,
  planner: plannerSection,
  cgpa: cgpaSection
};

function show(name){
  Object.values(sections).forEach(s => s.classList.remove("active"));
  sections[name].classList.add("active");
}

scheduleTab.onclick = () => show("schedule");
plannerTab.onclick  = () => show("planner");
cgpaTab.onclick     = () => show("cgpa");


// =====================================================
// 🔐 AUTH
// =====================================================

onAuthStateChanged(auth,(user)=>{
  if(!user) location.href="index.html";

  currentUser = user;
  userText.innerText = user.email;

  loadSchedule();
  loadPlanner();
  loadCGPA();
});

logoutBtn.onclick = ()=>signOut(auth);



// =====================================================
// 📅 SCHEDULE (FINAL WORKING)
// =====================================================

let editId = null;

addBtn.onclick = async () => {

  const checkboxes =
    document.querySelectorAll("#scheduleSection input[type=checkbox]");

  const days = [];
  checkboxes.forEach(cb => cb.checked && days.push(cb.value));

  if(days.length === 0) days.push("One-time");

  const title = titleInput.value.trim();
  const time  = timeInput.value;

  if(!title || !time) return;

  if(editId){
    await updateDoc(doc(db,"users",currentUser.uid,"schedule",editId),
      {title,time,days});
    editId=null;
    addBtn.innerText="Add";
  }
  else{
    await addDoc(collection(db,"users",currentUser.uid,"schedule"),
      {title,time,days});
  }

  titleInput.value="";
  timeInput.value="";
  loadSchedule();
};


async function loadSchedule(){

    list.innerHTML = "";
  
    const snap = await getDocs(
      collection(db,"users",currentUser.uid,"schedule")
    );
  
    const tasks = [];
  
    snap.forEach(d=>{
      const data = d.data();
  
      tasks.push({
        id: d.id,
        title: data.title,
        time: data.time,
        days: data.days || ["Others"] // ⭐ SAFE DEFAULT
      });
    });
  
  
    const week = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  
    const todayIndex = new Date().getDay();
  
    const orderedWeek = [
      ...week.slice(todayIndex),
      ...week.slice(0,todayIndex)
    ];
  
  
    const used = new Set();
  
  
    // ===== WEEK TASKS =====
    orderedWeek.forEach(day=>{
  
      const dayTasks = tasks.filter(t => t.days.includes(day));
  
      if(!dayTasks.length) return;
  
      const heading=document.createElement("h4");
      heading.innerText=day;
  
      if(day === week[todayIndex])
        heading.style.color="dodgerblue";
  
      list.appendChild(heading);
  
      dayTasks.forEach(data=>{
        used.add(data.id);
        renderScheduleItem(data);
      });
    });
  
  
    // ===== OTHERS =====
    const others = tasks.filter(t=>!used.has(t.id));
  
    if(others.length){
  
      const heading=document.createElement("h4");
      heading.innerText="Others";
      list.appendChild(heading);
  
      others.forEach(renderScheduleItem);
    }
  }
  
  
  // reusable item renderer
  function renderScheduleItem(data){
  
    const li=document.createElement("li");
    li.innerText=`${data.title} - ${data.time} `;
  
    const edit=document.createElement("button");
    edit.innerText="Edit";
    edit.onclick=()=>{
      editId=data.id;
      titleInput.value=data.title;
      timeInput.value=data.time;
      addBtn.innerText="Update";
    };
  
    const del=document.createElement("button");
    del.innerText="Delete";
    del.onclick=()=>deleteDoc(doc(db,"users",currentUser.uid,"schedule",data.id)).then(loadSchedule);
  
    li.append(edit,del);
    list.appendChild(li);
  }
  



// =====================================================
// 📝 PLANNER (same logic)
// =====================================================

taskBtn.onclick=async()=>{
  if(!taskInput.value) return;

  await addDoc(collection(db,"users",currentUser.uid,"planner"),{
    text:taskInput.value,
    priority:priority.value,
    done:false
  });

  taskInput.value="";
  loadPlanner();
};

async function loadPlanner(){
  taskList.innerHTML="";
  const snap=await getDocs(collection(db,"users",currentUser.uid,"planner"));
  snap.forEach(d=>{
    const li=document.createElement("li");
    li.innerText=d.data().text;
    taskList.appendChild(li);
  });
}



// =====================================================
// 📊 CGPA
// =====================================================

const gradeMap={O:10,"A+":9,A:8,"B+":7,B:6,C:5};

addSubBtn.onclick=async()=>{
  await addDoc(collection(db,"users",currentUser.uid,"cgpa"),{
    subject:subName.value,
    credits:Number(credits.value),
    grade:grade.value
  });
  loadCGPA();
};

async function loadCGPA(){

  cgpaList.innerHTML="";
  let total=0, creditSum=0;

  const snap=await getDocs(collection(db,"users",currentUser.uid,"cgpa"));

  snap.forEach(d=>{
    const data=d.data();
    total+=gradeMap[data.grade]*data.credits;
    creditSum+=data.credits;

    const li=document.createElement("li");
    li.innerText=`${data.subject} - ${data.credits} - ${data.grade}`;
    cgpaList.appendChild(li);
  });

  cgpaResult.innerText="CGPA: "+(creditSum?(total/creditSum).toFixed(2):0);
}
