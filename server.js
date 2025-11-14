const express = require('express');
const axios = require('axios');
const app = express();

// Render hoặc Glitch sẽ tự cấp Port
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
            // Lấy 50 tin
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
            <title>RADA FULL CLICK</title>
            <style>
                /* --- CẤU TRÚC CHUNG --- */
                body { 
                    background-color: #121212; color: #e0e0e0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0; padding: 15px; 
                    display: flex; flex-direction: column; align-items: center; 
                    height: 100vh; box-sizing: border-box;
                    overflow: hidden;
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

                /* --- PHẦN 1: SPOTLIGHT --- */
                #spotlight-section {
                    width: 100%; max-width: 500px;
                    height: 160px;
                    background: #1e1e1e;
                    border-radius: 12px;
                    border: 1px solid #333;
                    margin-bottom: 20px;
                    display: flex; flex-direction: column; justify-content: center; align-items: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                    overflow: hidden;
                }
                .waiting-state { color: #666; font-size: 1.5em; display: flex; align-items: center; gap: 10px; }
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

                /* --- PHẦN 2: LỊCH SỬ (CLICKABLE) --- */
                .history-label { 
                    width: 100%; max-width: 500px; color: #777; font-weight: bold; margin-bottom: 5px; font-size: 0.9em; text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 5px;
                }
                .history-container {
                    width: 100%; max-width: 500px;
                    flex-grow: 1; overflow-y: auto;
                    background: #181818; border-radius: 8px;
                }
                .history-container::-webkit-scrollbar { width: 6px; }
                .history-container::-webkit-scrollbar-track { background: #111; }
                .history-container::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }

                /* Đổi từ div thường sang thẻ a nên cần reset style */
                .history-item {
                    padding: 12px;
                    border-bottom: 1px solid #2a2a2a;
                    display: flex; align-items: center;
                    font-size: 0.95em;
                    color: #ccc;
                    text-decoration: none; /* Bỏ gạch chân */
                    transition: background 0.2s;
                    cursor:
