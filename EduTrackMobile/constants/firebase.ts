import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
export const storage = getStorage(app);
