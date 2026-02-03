import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCYRwQxnOsUHQrqyfUS-hyr_c5cQj2lrMY",
    authDomain: "edutrack-1.firebaseapp.com",
    projectId: "edutrack-1",
    storageBucket: "edutrack-1.firebasestorage.app",
    messagingSenderId: "319510113342",
    appId: "1:319510113342:web:f6e24dd06d76e67346356f",
    measurementId: "G-B48L44DM9R"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
