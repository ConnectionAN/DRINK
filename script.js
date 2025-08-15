document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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

    // App State
    let orderData = JSON.parse(localStorage.getItem('beverageOrderApp')) || null;

    // --- Functions ---

    // 儲存狀態到 localStorage
    function saveState() {
        localStorage.setItem('beverageOrderApp', JSON.stringify(orderData));
    }
    
    // 渲染 UI
    function render() {
        if (orderData) {
            starterSection.classList.add('hidden');
            joinerSection.classList.remove('hidden');
            orderStarterInfo.textContent = `開團人：${orderData.starterName}`;
            menuDisplay.innerHTML = `<p>菜單：<a href="${orderData.menuUrl}" target="_blank">點此查看</a></p><img src="${orderData.menuUrl}" alt="Menu">`;
        } else {
            starterSection.classList.remove('hidden');
            joinerSection.classList.add('hidden');
            orderStarterInfo.textContent = '';
            menuDisplay.innerHTML = '';
            outputSection.innerHTML = '';
        }
    }

    // 開始新訂單
    starterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const starterName = document.getElementById('starter-name').value;
    const fileInput = document.getElementById('menu-uploader');

    // 檢查使用者是否真的有選擇檔案
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0]; // 獲取被選擇的第一個檔案
        const reader = new FileReader(); // 建立一個檔案讀取器

        // 這是最重要的部分：定義當檔案成功讀取完成後，要做什麼事
        reader.onload = (event) => {
            // event.target.result 裡面會是圖片的 Base64 Data URL
            const menuDataUrl = event.target.result;
            
            // 將圖片資料和其他開團資訊一起打包
            orderData = {
                starterName: starterName,
                menuUrl: menuDataUrl, // 注意：這裡現在存的是 Base64 資料，而不是網址
                orders: []
            };
            
            // 存檔並更新畫面 (這兩步和之前一樣)
            saveState();
            render();
            starterForm.reset();
        };

        // **啟動**檔案讀取器，並告訴它將檔案讀取為 Data URL 格式
        reader.readAsDataURL(file);

    } else {
        alert('請選擇要上傳的菜單圖片！');
    }
});

    // 加入一筆訂單
    joinerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newOrder = {
            name: document.getElementById('joiner-name').value,
            drink: document.getElementById('drink-name').value,
            price: parseInt(document.getElementById('drink-price').value),
            sugar: document.getElementById('drink-sugar').value,
            ice: document.getElementById('drink-ice').value,
        };

        orderData.orders.push(newOrder);
        saveState();
        alert(`${newOrder.name}，您的訂單 [${newOrder.drink}] 已加入！`);
        joinerForm.reset();
        outputSection.innerHTML = ''; // 清空上次的匯出結果
    });
    
    // 匯出店家用清單
    exportStoreBtn.addEventListener('click', () => {
        if (!orderData || orderData.orders.length === 0) {
            alert('目前沒有任何訂單！');
            return;
        }

        const grouped = {};
        orderData.orders.forEach(order => {
            const key = `${order.drink}|${order.sugar}|${order.ice}`;
            if (!grouped[key]) {
                grouped[key] = { ...order, quantity: 0 };
            }
            grouped[key].quantity++;
        });

        let outputText = "========= 給店家的訂單 =========\n";
        let totalDrinks = 0;
        let grandTotal = 0;
        
        for (const key in grouped) {
            const item = grouped[key];
            const subtotal = item.price * item.quantity;
            totalDrinks += item.quantity;
            grandTotal += subtotal;
            outputText += `品項：${item.drink} (${item.sugar}, ${item.ice})\n`;
            outputText += `      - ${item.quantity} 杯, 單價 $${item.price}, 小計 $${subtotal}\n\n`;
        }

        outputText += `--------------------------------\n`;
        outputText += `總計杯數：${totalDrinks} 杯\n`;
        outputText += `總金額：$${grandTotal}\n`;
        outputText += `================================`;

        outputSection.textContent = outputText;
    });

    // 匯出取餐用清單
    exportPickupBtn.addEventListener('click', () => {
        if (!orderData || orderData.orders.length === 0) {
            alert('目前沒有任何訂單！');
            return;
        }

        let outputText = "========= 取餐核對清單 =========\n";
        orderData.orders.forEach(order => {
            outputText += `姓名：${order.name.padEnd(10, ' ')} | 飲料：${order.drink} (${order.sugar}, ${order.ice})\n`;
        });
        outputText += `================================`;
        
        outputSection.textContent = outputText;
    });
    
    // 重設訂單
    resetOrderBtn.addEventListener('click', () => {
        if (confirm('確定要清空所有訂單資料嗎？此動作無法復原！')) {
            orderData = null;
            localStorage.removeItem('beverageOrderApp');
            render();
        }
    });

    // --- Initial Load ---
    render();
});
