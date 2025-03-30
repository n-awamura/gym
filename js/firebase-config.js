import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";

// Firebase 設定
const firebaseConfig = {
    apiKey: "AIzaSyAWXaYp94kpW-iXxWmirXW-WGE07--I8u0",
    authDomain: "daoxiang-gym.firebaseapp.com",
    projectId: "daoxiang-gym",
    storageBucket: "daoxiang-gym.firebasestorage.app",
    messagingSenderId: "317940321857",
    appId: "1:317940321857:web:94d3f6216577599bfc00c0",
    measurementId: "G-Q7VFRWV7GX"
};

// 初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// ✅ グローバルに代入（login.htmlやindex.html等からアクセス可能にする）
window.auth = auth;
window.db = db;
window.analytics = analytics;

// 必要に応じてexport（使うなら）
export { app, auth, db, analytics };
