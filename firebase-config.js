import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7MG147ACFr6x3G3bDWn_7J5AfUePokQA",
  authDomain: "brittle-90fd8.firebaseapp.com",
  projectId: "brittle-90fd8",
  storageBucket: "brittle-90fd8.firebasestorage.app",
  messagingSenderId: "269430451707",
  appId: "1:269430451707:web:ae4f9b76af33265edbaf5e",
  measurementId: "G-VKHSLW9VEB"
};

// 파이어베이스 앱 초기화
const app = initializeApp(firebaseConfig);

// 파이어베이스 데이터베이스(Firestore) 객체 가져오기
const db = getFirestore(app);

export { db };
