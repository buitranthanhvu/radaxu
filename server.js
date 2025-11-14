const express = require('express');
const axios = require('axios');
const app = express();

// Render hoặc Glitch sẽ tự cấp Port, hoặc dùng 3000 nếu chạy máy cá nhân
const PORT = process.env.PORT || 3000;
const DATA_URL = 'https://shopee.vintrasolution.net/data.json';

// Lấy hết tin từ 100 xu để Client tự lọc
const SERVER_MIN_FILTER = 100; 

function parseItem(item) {
    if (!item || !item.xu) return null;
    const numberStr = item.xu.replace(/\D/g, '');
    const coinValue = parseInt(numberStr) || 0;
    
    return {
        xu: coinValue,
        originalText: item.xu,
        shop: item.shop || "Shop Bí Ẩn",
        // Giả sử meta chứa time/view, nếu không có thì để trống
        meta: item.meta || "", 
        link: item.link || item.url || item.href || "https://shopee.vn/live" 
    };
}

app.get('/api/check-xu', async (req, res) => {
    try {
        const timestamp = new Date().getTime();
        const response = await axios.get(`${DATA_URL}?t=${timestamp}`);
        const data = response.data;
        let rawHistory = [];

        if (Array.isArray(data) && data.length > 0) {
            const allItems = data.map(raw => parseItem(raw)).filter(i => i !== null);
            // Lấy 50 tin để danh sách lịch sử dài dài chút cho đẹp
            rawHistory = allItems.filter(item => item.xu >= SERVER_MIN_FILTER).slice(0, 50);
        }
        res.json({ history: rawHistory }); 
    } catch (error) {
        res.status(500).json({ error: error.message, history: [] });
    }
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RADA GIAO DIỆN MỚI</title>
            <style>
                /* --- CẤU TRÚC CHUNG --- */
                body { 
                    background-color: #121212; color: #e0e0e0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0; padding: 15px; 
                    display: flex; flex-direction: column; align-items: center; 
                    height: 100vh; box-sizing: border-box;
                    overflow: hidden; /* Chặn cuộn trang chính */
                }

                /* --- HEADER CONTROL --- */
                .control-header {
                    display: flex; gap: 10px; align-items: center; margin-bottom: 15px;
                    background: #1e1e1e; padding: 8px 15px; border-radius: 20px; border: 1px solid #333;
                }
                .input-xu {
                    background: #000; border: 1px solid #ff9800; color: #fff;
                    padding: 5px; font-size: 16px; width: 70px; text-align: center;
                    font-weight: bold; border-radius: 5px;
                }
                .btn-sound { cursor: pointer; background: none; border: none; font-size: 1.2em; }

                /* --- PHẦN 1: SPOTLIGHT (TIN MỚI NHẤT) --- */
                #spotlight-section {
                    width: 100%; max-width: 500px;
                    height: 160px; /* Chiều cao cố định */
                    background: #1e1e1e;
                    border-radius: 12px;
                    border: 1px solid #333;
                    margin-bottom: 20px;
                    display: flex; flex-direction: column; justify-content: center; align-items: center;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                    position: relative;
                    overflow: hidden;
                }

                /* Trạng thái CHỜ */
                .waiting-state { color: #666; font-size: 1.5em; display: flex; align-items: center; gap: 10px; }
                
                /* Trạng thái CÓ XU */
                .active-state { 
                    width: 100%; height: 100%; 
                    display: flex; flex-direction: column; justify-content: space-between; 
                    padding: 15px; box-sizing: border-box;
                    background: linear-gradient(135deg, #3e2723 0%, #1e1e1e 100%);
                    border: 2px solid #ff5722;
                }
                .spotlight-top { display: flex; justify-content: space-between; align-items: flex-start; }
                .spotlight-shop { font-size: 1.1em; color: #ffccbc; font-weight: bold; max-width: 70%; }
                .spotlight-xu { font-size: 3em; color: #ffff00; font-weight: 900; line-height: 1; text-shadow: 0 0 15px #ff9800; }
                .spotlight-meta { font-size: 0.9em; color: #aaa; margin-top: 5px; }
                
                .btn-spotlight {
                    background: #ff5722; color: white; text-decoration: none; text-align: center;
                    padding: 10px; border-radius: 6px; font-weight: bold; font-size: 1.2em; text-transform: uppercase;
                    margin-top: 10px; animation: pulse 1.5s infinite;
                }
                @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }

                /* --- PHẦN 2: LỊCH SỬ (DANH SÁCH CUỘN) --- */
                .history-label { 
                    width: 100%; max-width: 500px; color: #777; font-weight: bold; margin-bottom: 5px; font-size: 0.9em; text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 5px;
                }
                
                .history-container {
                    width: 100%; max-width: 500px;
                    flex-grow: 1; /* Chiếm hết phần còn lại */
                    overflow-y: auto; /* Cho phép cuộn dọc */
                    background: #181818;
                    border-radius: 8px;
                }

                /* Tùy chỉnh thanh cuộn cho đẹp */
                .history-container::-webkit-scrollbar { width: 6px; }
                .history-container::-webkit-scrollbar-track { background: #111; }
                .history-container::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }

                .history-item {
                    padding: 12px;
                    border-bottom: 1px solid #2a2a2a;
                    display: flex; align-items: center;
                    font-size: 0.95em;
                    color: #ccc;
                }
                .history-item:hover { background: #222; }
                
                /* Style từng thành phần trong dòng lịch sử */
                .h-xu { color: #ffff00; font-weight: bold; min-width: 70px; margin-right: 10px; }
                .h-shop { color: #fff; font-weight: 600; margin-right: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;}
                .h-meta { color: #666; font-size: 0.85em; margin-left: auto; } /* Đẩy sang phải cùng */

            </style>
        </head>
        <body>

            <div class="control-header">
                <span style="color:#888; font-size:0.9em">Lọc Xu >=</span>
                <input type="number" id="min-xu-input" class="input-xu" value="600" oninput="updateFilter()">
                <button class="btn-sound" id="btn-sound" onclick="activateAudio()" title="Bật âm thanh">🔇</button>
                <button onclick="testVoice()" style="margin-left:10px; background:none; border:1px solid #444; color:#666; padding:2px 8px; border-radius:4px; cursor:pointer">Test</button>
            </div>

            <div id="spotlight-section">
                <div class="waiting-state">🕒 Chờ xíu nhaaa...</div>
            </div>

            <div class="history-label">Lịch sử (Các tin phù hợp)</div>
            <div class="history-container" id="history-list">
                </div>

            <script>
                let lastSignature = ""; 
                let currentData = []; 
                let userMinXu = 600; 
                let audioOn = false;

                function activateAudio() { 
                    playTing(); 
                    audioOn = true; 
                    document.getElementById('btn-sound').innerText = '🔊';
                    document.getElementById('btn-sound').style.color = '#4CAF50';
                }
                
                function updateFilter() { 
                    userMinXu = parseInt(document.getElementById('min-xu-input').value) || 0; 
                    renderUI(); // Render lại ngay khi sửa số
                }

                function renderUI() {
                    const spotlight = document.getElementById('spotlight-section');
                    const historyList = document.getElementById('history-list');
                    
                    // 1. LỌC DỮ LIỆU
                    const filteredList = currentData.filter(item => item.xu >= userMinXu);

                    // 2. XỬ LÝ PHẦN SPOTLIGHT (Tin mới nhất)
                    if (filteredList.length > 0) {
                        const topItem = filteredList[0];
                        
                        // Hiển thị giao diện "CÓ XU"
                        spotlight.innerHTML = \`
                            <div class="active-state">
                                <div class="spotlight-top">
                                    <div class="spotlight-shop">\${topItem.shop}</div>
                                    <div class="spotlight-xu">\${topItem.xu}</div>
                                </div>
                                <div class="spotlight-meta">\${topItem.meta}</div>
                                <a href="\${topItem.link || 'https://shopee.vn/live'}" target="_blank" class="btn-spotlight">VÀO LIVE NGAY</a>
                            </div>
                        \`;

                        // Kiểm tra âm thanh
                        const sig = topItem.shop + topItem.xu + topItem.meta;
                        if (sig !== lastSignature) {
                            if(audioOn) { playTing(); setTimeout(() => readXu(topItem.xu), 300); }
                            lastSignature = sig;
                        }

                    } else {
                        // Hiển thị giao diện "CHỜ"
                        spotlight.innerHTML = '<div class="waiting-state">🕒 Chờ xíu nhaaa...</div>';
                    }

                    // 3. XỬ LÝ PHẦN LỊCH SỬ (Các tin còn lại hoặc toàn bộ filtered list)
                    // Ở đây tôi hiển thị toàn bộ list đã lọc để bạn dễ check
                    let html = '';
                    if (filteredList.length === 0) {
                        html = '<div style="padding:20px; text-align:center; color:#444; font-style:italic">Chưa có tin nào >= ' + userMinXu + ' xu</div>';
                    } else {
                        filteredList.forEach(item => {
                            html += \`
                                <div class="history-item">
                                    <span class="h-xu">[\${item.xu} xu]</span>
                                    <span class="h-shop">\${item.shop}</span>
                                    <span class="h-meta">\${item.meta}</span>
                                </div>
                            \`;
                        });
                    }
                    historyList.innerHTML = html;
                }

                // --- ÂM THANH ---
                function playTing() {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator(); const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = 'sine'; osc.frequency.setValueAtTime(1000, ctx.currentTime);
                    gain.gain.setValueAtTime(0.5, ctx.currentTime); 
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.5);
                    osc.start(); osc.stop(ctx.currentTime+0.5);
                }
                function readXu(n) { 
                    if('speechSynthesis' in window) { 
                        window.speechSynthesis.cancel(); 
                        const u = new SpeechSynthesisUtterance(n+" xu"); 
                        u.lang='vi-VN'; u.rate=1.1; u.volume=1; 
                        window.speechSynthesis.speak(u); 
                    } 
                }
                function testVoice() { playTing(); setTimeout(() => readXu(1234), 500); }

                // --- MAIN LOOP ---
                async function checkServer() {
                    try {
                        const res = await fetch('/api/check-xu'); 
                        const json = await res.json();
                        if (json.history) { currentData = json.history; }
                        renderUI();
                    } catch (e) { console.log(e); }
                }
                setInterval(checkServer, 1000); // Quét mỗi 1 giây cho đỡ lag
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => { console.log('Server chạy tại port ' + PORT); });
