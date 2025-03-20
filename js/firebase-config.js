// firebase-config.js

// 必要な Firebase モジュールのインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";

// Firebase の設定情報
const firebaseConfig = {
  apiKey: "AIzaSyAWXaYp94kpW-iXxWmirXW-WGE07--I8u0",
  authDomain: "daoxiang-gym.firebaseapp.com",
  projectId: "daoxiang-gym",
  storageBucket: "daoxiang-gym.firebasestorage.app",
  messagingSenderId: "317940321857",
  appId: "1:317940321857:web:f3302fa4b87aa4d8fc00c0",
  measurementId: "G-Q7VFRWV7GX"
};

// Firebase の初期化
const app = initializeApp(firebaseConfig);

// 各種サービスの初期化
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// グローバルに利用するために window オブジェクトに設定（必要に応じて）
window.auth = auth;
window.db = db;
window.analytics = analytics;

// エクスポート（必要に応じて）
export { app, auth, db, analytics };
