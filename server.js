const express = require('express');
const axios = require('axios');
const app = express();

// QUAN TRỌNG: Render sẽ cấp Port qua biến môi trường này
const PORT = process.env.PORT || 3000;
const DATA_URL = 'https://shopee.vintrasolution.net/data.json';

// Mặc định lọc từ 100 xu để client tự xử lý tiếp
const SERVER_MIN_FILTER = 100; 

function parseItem(item) {
    if (!item || !item.xu) return null;
    const numberStr = item.xu.replace(/\D/g, '');
    const coinValue = parseInt(numberStr) || 0;
    
    return {
        xu: coinValue,
        originalText: item.xu,
        shop: item.shop || "Shop Bí Ẩn",
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
            rawHistory = allItems.filter(item => item.xu >= SERVER_MIN_FILTER).slice(0, 30);
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
            <title>RADA RENDER VIP</title>
            <style>
                body { 
                    background-color: #000; color: #e0e0e0; font-family: sans-serif; 
                    margin: 0; padding: 10px; display: flex; flex-direction: column; align-items: center; 
                }
                .header { text-align: center; margin-bottom: 10px; border-bottom: 1px solid #333; width: 100%; max-width: 600px; padding-bottom: 10px; }
                .control-box { background: #222; padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 10px; border: 1px solid #444; }
                .input-xu { background: #000; border: 1px solid #ff5722; color: #fff; padding: 8px; font-size: 18px; width: 100px; text-align: center; font-weight: bold; border-radius: 4px; }
                .label-input { font-weight: bold; color: #ccc; }
                .list-container { width: 100%; max-width: 600px; margin-top: 10px; }
                .item-row { display: flex; justify-content: space-between; align-items: center; background: #2a1200; margin-bottom: 10px; padding: 15px; border-radius: 8px; border: 2px solid #ff5722; box-shadow: 0 0 10px rgba(255, 87, 34, 0.2); transition: all 0.3s; }
                .shop-info { display: flex; flex-direction: column; }
                .shop-name { font-weight: bold; color: #ffab91; font-size: 18px; text-transform: uppercase; }
                .meta-info { font-size: 12px; color: #888; margin-top: 3px; }
                .right-side { text-align: right; display: flex; align-items: center; gap: 15px; }
                .xu-tag { color: #ffff00; font-size: 32px; font-weight: 900; text-shadow: 0 0 10px #ff9800; }
                .btn-go { background: #ff5722; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 18px; text-transform: uppercase; }
                .empty-msg { text-align:center; color: #555; margin-top: 50px; font-style: italic; }
                .btn-active { display:block; margin: 10px auto; background: #4CAF50; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; }
            </style>
        </head>
        <body>
            <div class="header">
                <h3 style="margin:0; color: #ff5722">RADA RENDER</h3>
                <div id="status" style="font-size: 0.8em; color: #666">...</div>
                <button class="btn-active" id="btn-active" onclick="activateAudio()">🔊 BẤM ĐỂ BẬT LOA</button>
                <div class="control-box">
                    <span class="label-input">🔔 Báo khi Xu >= </span>
                    <input type="number" id="min-xu-input" class="input-xu" value="500" oninput="updateFilter()">
                </div>
                <button onclick="testVoice()" style="margin-top:5px; background:none; border:none; color:#555; cursor:pointer; font-size:0.8em">Test Giọng</button>
            </div>
            <div class="list-container" id="list-area"><div class="empty-msg">Đang tải...</div></div>
            <script>
                let lastSignature = ""; let currentData = []; let userMinXu = 500; let audioOn = false;
                
                function activateAudio() { playTing(); audioOn = true; document.getElementById('btn-active').style.display='none'; }
                function updateFilter() { userMinXu = parseInt(document.getElementById('min-xu-input').value) || 0; renderAndCheckAlert(); }
                
                function renderAndCheckAlert() {
                    const container = document.getElementById('list-area');
                    const filteredList = currentData.filter(item => item.xu >= userMinXu);
                    if (filteredList.length === 0) { container.innerHTML = '<div class="empty-msg">Không có kèo >= ' + userMinXu + ' xu.</div>'; return; }
                    let html = '';
                    for (let i = 0; i < filteredList.length; i++) {
                        const item = filteredList[i];
                        html += '<div class="item-row"><div class="shop-info"><div class="shop-name">' + item.shop + '</div><div class="meta-info">' + item.meta + '</div></div><div class="right-side"><div class="xu-tag">' + item.xu + '</div><a href="' + (item.link||"https://shopee.vn/live") + '" target="_blank" class="btn-go">VÀO</a></div></div>';
                    }
                    container.innerHTML = html;
                    if (filteredList.length > 0) {
                        const best = filteredList[0];
                        const sig = best.shop + best.xu + best.meta;
                        if (sig !== lastSignature) {
                            if(audioOn) { playTing(); setTimeout(() => readXu(best.xu), 300); }
                            lastSignature = sig;
                        }
                    }
                }
                function playTing() {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator(); const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.frequency.setValueAtTime(1200, ctx.currentTime);
                    gain.gain.setValueAtTime(1.0, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.5);
                    osc.start(); osc.stop(ctx.currentTime+0.5);
                }
                function readXu(n) { if('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(n+" xu"); u.lang='vi-VN'; u.rate=1.1; u.volume=1; window.speechSynthesis.speak(u); } }
                function testVoice() { playTing(); setTimeout(() => readXu(999), 500); }
                async function checkServer() {
                    try {
                        const now = new Date(); document.getElementById('status').innerText = "Cập nhật: " + now.toLocaleTimeString();
                        const res = await fetch('/api/check-xu'); const json = await res.json();
                        if (json.history) { currentData = json.history; }
                        renderAndCheckAlert();
                    } catch (e) { console.log(e); }
                }
                setInterval(checkServer, 500);
            </script>
        </body>
        </html>
    `);
});


app.listen(PORT, () => { console.log('Running on port ' + PORT); });
