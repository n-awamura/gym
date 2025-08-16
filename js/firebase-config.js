// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js"; // getAuthをインポート

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWXaYp94kpW-iXxWmirXW-WGE07--I8u0",
  authDomain: "daoxiang-gym.firebaseapp.com",
  projectId: "daoxiang-gym",
  storageBucket: "daoxiang-gym.firebasestorage.app",
  messagingSenderId: "317940321857",
  appId: "1:317940321857:web:94d3f6216577599bfc00c0",
  measurementId: "G-Q7VFRWV7GX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // authを初期化

export { db, auth }; // dbとauthをエクスポート
