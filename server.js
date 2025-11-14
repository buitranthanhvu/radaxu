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
            <title>RADA FIX LAYOUT</title>
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

                /* --- SPOTLIGHT --- */
                #spotlight-section {
                    display: flex; 
                    width: 100%; max-width: 500px; 
                    /* TĂNG CHIỀU CAO LÊN 200px ĐỂ KHÔNG BỊ MẤT NÚT */
                    height: 200px; 
                    background: #1e1e1e; border-radius: 12px; border: 1px solid #333;
                    margin-bottom: 20px; flex-direction: column; justify-content: center; align-items: center;
                    overflow: hidden; transition: all 0.3s ease;
                }

                .waiting-state { 
                    color: #555; font-size: 1.5em; display: flex; align-items: center; gap: 10px; 
                    font-weight: bold; letter-spacing: 1px;
                }

                .active-state { 
                    width: 100%; height: 100%; padding: 15px; box-sizing: border-box;
                    display: flex; flex-direction: column; justify-content: space-between; /* Căn đều trên dưới */
                    background: linear-gradient(135deg, #bf360c 0%, #1e1e1e 100%);
                    border: 2px solid #ff5722;
                    animation: flashEffect 0.3s ease-out;
                }
                @keyframes flashEffect { from { opacity: 0.5; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

                .spotlight-top { display: flex; justify-content: space-between; align-
