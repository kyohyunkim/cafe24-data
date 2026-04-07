const fs = require('fs');
const axios = require('axios');

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRjkerfUM4Af5iYw4IBlHSdQHRP61U18YAeNoKzL3_1-0GdiQdLtcPMeGgu_nhGqDMbnIaZBpvpfow6/pub?output=csv';

// 1. CSV 파싱 함수
function parseCSV(text) {
    const rows = text.split('\n').filter(r => r.trim() !== '');
    return rows.map(row => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let char of row) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result.map(v => v.replace(/^"|"$/g, '').trim());
    });
}

// 2. 메인 실행 함수
async function updateData() {
    try {
        console.log('Fetching Google Sheet data...');
        const response = await axios.get(SHEET_CSV_URL);
        const rows = parseCSV(response.data).slice(1); // 헤더 제외

        // 데이터 가공 (기존의 transform 로직 적용)
        const formattedData = rows.map(row => ({
            date: row[0],
            prd_name: row[1],
            origin: row[2],
            sale_price: row[3],
            percent: row[4],
            thum_url: row[5],
            channel: row[6],
            link: row[7],
            tag: row[8]
        }));

        // 최종 data.json 파일로 저장
        fs.writeFileSync('./data.json', JSON.stringify(formattedData, null, 2));
        console.log('Success: data.json has been updated!');
    } catch (error) {
        console.error('Error updating data:', error.message);
        process.exit(1);
    }
}

updateData();