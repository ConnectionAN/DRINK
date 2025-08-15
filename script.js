// 全新的 script.js

// 從我們的 firebase-init.js 匯入 db 連線物件
import { db } from './firebase-init.js';
// 從 Firebase SDK 匯入所有我們會用到的 Firestore 指令
import { doc, setDoc, addDoc, getDoc, deleteDoc, onSnapshot, collection, query } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";

// --- DOM Elements (這部分和之前一樣) ---
const starterSection = document.getElementById('starter-section');
const joinerSection = document.getElementById('joiner-section');
const starterForm = document.getElementById('starter-form');
const joinerForm = document.getElementById('joiner-form');
const exportStoreBtn = document.getElementById('export-store-btn');
const exportPickupBtn = document.getElementById('export-pickup-btn');
const resetOrderBtn = document.getElementById('reset-order-btn');
const outputSection = document.getElementById('output-section');
const orderStarterInfo = document.getElementById('order-starter-info');
const menuDisplay = document.getElementById('menu-display');

// 我們用一個固定的文件ID來代表「當前這一團」
const orderDocId = "live-order";

// --- Firestore 即時監聽器 (這是整個應用的新核心！) ---
// 設定一個監聽器，持續監聽 "orders" 集合中 "live-order" 這份文件的變化
const unsub = onSnapshot(doc(db, "orders", orderDocId), (docSnap) => {
    // 每次雲端資料有變化，這段程式碼就會自動執行
    if (docSnap.exists()) {
        // 文件存在，代表已開團
        const orderData = docSnap.data();
        
        // 更新UI
        starterSection.classList.add('hidden');
        joinerSection.classList.remove('hidden');
        orderStarterInfo.textContent = `開團人：${orderData.starterName}`;
        menuDisplay.innerHTML = `<p>菜單：</p><img src="${orderData.menuUrl}" alt="Menu">`;

        // 監聽子集合 "drinks" 的變化來更新訂單列表
        listenToDrinks(orderData);
        
    } else {
        // 文件不存在，代表尚未開團或已重設
        starterSection.classList.remove('hidden');
        joinerSection.classList.add('hidden');
        orderStarterInfo.textContent = '';
        menuDisplay.innerHTML = '';
        outputSection.innerHTML = '';
    }
});

function listenToDrinks(orderData) {
    const drinksQuery = query(collection(db, `orders/${orderDocId}/drinks`));
    onSnapshot(drinksQuery, (querySnapshot) => {
        const drinks = [];
        querySnapshot.forEach((doc) => {
            drinks.push(doc.data());
        });
        orderData.orders = drinks; // 將最新的飲料列表附加到 orderData 上
        
        // 將更新後的 orderData 傳給匯出函式使用
        bindExportButtons(orderData);
    });
}


// --- 事件監聽器 (現在改為操作 Firestore) ---

// 開始新訂單
starterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const starterName = document.getElementById('starter-name').value;
    const fileInput = document.getElementById('menu-uploader');

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            const menuDataUrl = event.target.result;
            const newOrderData = {
                starterName: starterName,
                menuUrl: menuDataUrl
            };
            try {
                // 在 "orders" 集合中，建立一個 ID 為 "live-order" 的文件
                await setDoc(doc(db, "orders", orderDocId), newOrderData);
                starterForm.reset();
            } catch (error) {
                console.error("開團失敗: ", error);
                alert("開團失敗，請檢查網路連線或稍後再試。");
            }
        };
        reader.readAsDataURL(file);
    } else {
        alert('請選擇要上傳的菜單圖片！');
    }
});

// 加入一筆訂單
joinerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newDrink = {
        name: document.getElementById('joiner-name').value,
        drink: document.getElementById('drink-name').value,
        price: parseInt(document.getElementById('drink-price').value),
        sugar: document.getElementById('drink-sugar').value,
        ice: document.getElementById('drink-ice').value,
    };

    try {
        // 在 "live-order" 文件下的 "drinks" 子集合中新增一筆飲料資料
        await addDoc(collection(db, `orders/${orderDocId}/drinks`), newDrink);
        alert(`${newDrink.name}，您的訂單 [${newDrink.drink}] 已加入！`);
        joinerForm.reset();
        outputSection.innerHTML = '';
    } catch (error) {
        console.error("點餐失敗: ", error);
        alert("點餐失敗，請檢查網路連線或稍後再試。");
    }
});

// 重設訂單
resetOrderBtn.addEventListener('click', async () => {
    if (confirm('確定要清空雲端所有訂單資料嗎？此動作會影響所有人且無法復原！')) {
        try {
            // 刪除 "live-order" 這份文件，這會觸發 onSnapshot 讓所有人的畫面重設
            await deleteDoc(doc(db, "orders", orderDocId));
            // 由於 onSnapshot 會自動清空畫面，這裡不需要再手動操作 UI
        } catch (error) {
            console.error("重設失敗: ", error);
            alert("重設失敗，請檢查網路連線或稍後再試。");
        }
    }
});

// 將匯出按鈕與最新的 orderData 綁定
function bindExportButtons(orderData) {
    // 為了避免重複綁定，先移除舊的監聽器再新增
    exportStoreBtn.replaceWith(exportStoreBtn.cloneNode(true));
    document.getElementById('export-store-btn').addEventListener('click', () => {
        // ... (店家清單的邏輯和之前幾乎一樣) ...
        // ... 只是現在資料來源是傳入的 orderData ...
        if (!orderData || !orderData.orders || orderData.orders.length === 0) {
            alert('目前沒有任何訂單！'); return;
        }
        const grouped = {};
        orderData.orders.forEach(order => {
            const key = `${order.drink}|${order.sugar}|${order.ice}`;
            if (!grouped[key]) { grouped[key] = { ...order, quantity: 0 }; }
            grouped[key].quantity++;
        });

        let outputText = "========= 給店家的訂單 =========\n";
        let totalDrinks = 0; let grandTotal = 0;
        for (const key in grouped) {
            const item = grouped[key];
            const subtotal = item.price * item.quantity;
            totalDrinks += item.quantity;
            grandTotal += subtotal;
            outputText += `品項：${item.drink} (${item.sugar}, ${item.ice})\n`;
            outputText += `      - ${item.quantity} 杯, 單價 $${item.price}, 小計 $${subtotal}\n\n`;
        }
        outputText += `--------------------------------\n總計杯數：${totalDrinks} 杯\n總金額：$${grandTotal}\n================================`;
        outputSection.textContent = outputText;
    });

    exportPickupBtn.replaceWith(exportPickupBtn.cloneNode(true));
    document.getElementById('export-pickup-btn').addEventListener('click', () => {
        // ... (取餐清單的邏輯和之前幾乎一樣) ...
        if (!orderData || !orderData.orders || orderData.orders.length === 0) {
            alert('目前沒有任何訂單！'); return;
        }
        let outputText = "========= 取餐核對清單 =========\n";
        orderData.orders.forEach(order => {
            outputText += `姓名：${order.name.padEnd(10, ' ')} | 飲料：${order.drink} (${order.sugar}, ${order.ice})\n`;
        });
        outputText += `================================`;
        outputSection.textContent = outputText;
    });
}
