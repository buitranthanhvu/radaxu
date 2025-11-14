const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;
const DATA_URL = 'https://shopee.vintrasolution.net/data.json';
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
            <title>RADA NO TING</title>
            <style>
                body { 
                    background-color: #121212; color: #e0e0e0; font-family: sans-serif;
                    margin: 0; padding: 15px; display: flex; flex-direction: column; align-items: center; 
                    height: 100vh; box-sizing: border-box; overflow: hidden;
                }
                .control-header {
                    display: flex; gap: 10px; align-items: center; margin-bottom: 15px;
                    background: #1e1e1e; padding: 8px 15px; border-radius: 20px; border: 1px solid #333;
                }
                .input-xu {
                    background: #000; border: 1px solid #ff9800; color: #fff;
                    padding: 5px; font-size: 16px; width: 70px; text-align: center; font-weight: bold; border-radius: 5px;
                }

                /* --- SPOTLIGHT FIX MOBILE --- */
                #spotlight-section {
                    display: flex; 
                    width: 100%; max-width: 500px; 
                    min-height: 180px; 
                    height: auto; 
                    background: #1e1e1e; border-radius: 12px; border: 1px solid #333;
                    margin-bottom: 20px; flex-direction: column; justify-content: center; align-items: center;
                    overflow: hidden; transition: all 0.3s ease;
                }

                .waiting-state { 
                    color: #555; font-size: 1.5em; display: flex; align-items: center; gap: 10px; 
                    font-weight: bold; letter-spacing: 1px; padding: 20px;
                }

                .active-state { 
                    width: 100%; 
                    padding: 20px 15px; box-sizing: border-box;
                    display: flex; flex-direction: column; 
                    gap: 10px;
                    background: linear-gradient(135deg, #bf360c 0%, #1e1e1e 100%);
                    border: 2px solid #ff5722;
                    animation: flashEffect 0.3s ease-out;
                }
                @keyframes flashEffect { from { opacity: 0.5; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

                .spotlight-top { display: flex; justify-content: space-between; align-items: flex-start; }
                .spotlight-shop { font-size: 1.2em; color: #fff; font-weight: bold; max-width: 60%; line-height: 1.3; word-wrap: break-word;}
                .spotlight-xu { font-size: 3.5em; color: #ffff00; font-weight: 900; line-height: 1; text-shadow: 0 0 20px #ffeb3b; }
                .spotlight-meta { font-size: 0.9em; color: #ddd; } 
                
                .btn-spotlight {
                    background: #fff; color: #d84315; text-decoration: none; text-align: center;
                    padding: 12px; border-radius: 8px; font-weight: 900; font-size: 1.3em; text-transform: uppercase;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    display: block; width: 100%; box-sizing: border-box;
                    margin-top: 5px;
                }

                /* LỊCH SỬ */
                .history-label { width: 100%; max-width: 500px; color: #777; font-weight: bold; margin-bottom: 5px; font-size: 0.9em; border-bottom: 1px solid #333; padding-bottom: 5px; }
                .history-container {
                    width: 100%; max-width: 500px; flex-grow: 1; overflow-y: auto;
                    background: #181818; border-radius: 8px;
                }
                .history-item {
                    padding: 12px; border-bottom: 1px solid #2a2a2a; display: flex; align-items: center;
                    font-size: 0.95em; color: #ccc; text-decoration: none; transition: background 0.2s; cursor: pointer;
                }
                .history-item:hover { background: #252525; }
                .h-xu { color: #ffff00; font-weight: bold; min-width: 70px; margin-right: 10px; }
                .h-shop { color: #fff; font-weight: 600; margin-right: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;}
                .h-meta { color: #666; font-size: 0.85em; margin-left: auto; }
            </style>
        </head>
        <body>

            <div class="control-header">
                <span style="color:#888; font-size:0.9em">Lọc Xu >=</span>
                <input type="number" id="min-xu-input" class="input-xu" value="600" oninput="updateFilter()">
                <button id="btn-sound" onclick="activateAudio()" style="margin-left:10px; background:none; border:none; cursor:pointer; font-size:1.2em">🔇</button>
                <button onclick="testVoice()" style="margin-left:10px; background:none; border:1px solid #444; color:#666; padding:2px 8px; border-radius:4px; cursor:pointer">Test</button>
            </div>

            <div id="spotlight-section">
                <div class="waiting-state">🕒 Cô đơn trên sofa</div>
            </div>

            <div class="history-label">Lịch sử (Click để vào)</div>
            <div class="history-container" id="history-list"></div>

            <script>
                let lastSignature = ""; 
                let currentData = []; 
                let userMinXu = 600; 
                let audioOn = false;
                let spotlightTimeout;

                function activateAudio() { 
                    // Chỉ bật biến cờ, không phát tiếng nữa
                    audioOn = true; 
                    document.getElementById('btn-sound').innerText = '🔊'; 
                }
                
                function updateFilter() { userMinXu = parseInt(document.getElementById('min-xu-input').value) || 0; renderUI(); }

                function renderUI() {
                    const spotlight = document.getElementById('spotlight-section');
                    const historyList = document.getElementById('history-list');
                    const filteredList = currentData.filter(item => item.xu >= userMinXu);

                    if (filteredList.length > 0) {
                        const topItem = filteredList[0];
                        const currentSig = topItem.shop + topItem.xu + topItem.meta;

                        if (currentSig !== lastSignature) {
                            let spotHtml = '<div class="active-state">';
                            spotHtml += '<div class="spotlight-top">';
                            spotHtml += '<div class="spotlight-shop">' + topItem.shop + '</div>';
                            spotHtml += '<div class="spotlight-xu">' + topItem.xu + '</div>';
                            spotHtml += '</div>';
                            spotHtml += '<div class="spotlight-meta">' + topItem.meta + '</div>';
                            spotHtml += '<a href="' + (topItem.link || 'https://shopee.vn/live') + '" target="_blank" class="btn-spotlight">VÀO LIVE NGAY</a>';
                            spotHtml += '</div>';
                            spotlight.innerHTML = spotHtml;

                            // CHỈ ĐỌC SỐ XU, KHÔNG TING, ÂM LƯỢNG NHỎ
                            if(audioOn) { 
                                readXu(topItem.xu); 
                            }
                            
                            lastSignature = currentSig;

                            if (spotlightTimeout) clearTimeout(spotlightTimeout);
                            spotlightTimeout = setTimeout(() => {
                                spotlight.innerHTML = '<div class="waiting-state">🕒 Cô đơn trên sofa</div>';
                            }, 1000); 
                        }
                    }

                    let listHtml = '';
                    if (filteredList.length === 0) {
                        listHtml = '<div style="padding:20px; text-align:center; color:#444">Không có tin >= ' + userMinXu + ' xu</div>';
                    } else {
                        for (let i = 0; i < filteredList.length; i++) {
                            const item = filteredList[i];
                            listHtml += '<a href="' + (item.link || 'https://shopee.vn/live') + '" target="_blank" class="history-item">';
                            listHtml += '<span class="h-xu">[' + item.xu + ' xu]</span>';
                            listHtml += '<span class="h-shop">' + item.shop + '</span>';
                            listHtml += '<span class="h-meta">' + item.meta + '</span>';
                            listHtml += '</a>';
                        }
                    }
                    historyList.innerHTML = listHtml;
                }

                function readXu(n) { 
                    if('speechSynthesis' in window) { 
                        window.speechSynthesis.cancel(); 
                        const u = new SpeechSynthesisUtterance(n + " xu"); 
                        u.lang='vi-VN'; 
                        u.rate = 1.1; 
                        
                        // --- CHỈNH ÂM LƯỢNG TẠI ĐÂY ---
                        u.volume = 0.8; // 50% âm lượng
                        
                        window.speechSynthesis.speak(u); 
                    } 
                }

                function testVoice() { 
                    readXu(100000); 
                }

                async function checkServer() {
                    try {
                        const res = await fetch('/api/check-xu'); 
                        const json = await res.json();
                        if (json.history) { currentData = json.history; }
                        renderUI();
                    } catch (e) { console.log(e); }
                }
                setInterval(checkServer, 1000);
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => { console.log('Server running on ' + PORT); });

