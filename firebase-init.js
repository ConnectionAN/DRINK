// firebase-init.js

// 從 Firebase SDK (軟體開發套件) 中，匯入我們需要的功能
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";

// --- ↓↓↓ 請將這個 firebaseConfig 物件，換成您自己的設定碼 ↓↓↓ ---
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBk4PL8o5X5WsJNeqcN2VVdnImjXHwZG44",
    authDomain: "drink-order-pwa.firebaseapp.com",
    projectId: "drink-order-pwa",
    storageBucket: "drink-order-pwa.firebasestorage.app",
    messagingSenderId: "274697616333",
    appId: "1:274697616333:web:da5c4c5a7c4b560a6ca284",
    measurementId: "G-C8BKXVG7K1"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
// --- ↑↑↑ 請將這個 firebaseConfig 物件，換成您自己的設定碼 ↑↑↑ ---


// 初始化 Firebase 應用程式
const app = initializeApp(firebaseConfig);

// 建立並匯出 Firestore 資料庫的連線物件，讓其他檔案可以使用
export const db = getFirestore(app);
