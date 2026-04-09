const fs = require('fs');
const axios = require('axios');

const URLS = {
    // gid가 포함된 최종 CSV 주소로 교체하세요.
    sheet1: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRjkerfUM4Af5iYw4IBlHSdQHRP61U18YAeNoKzL3_1-0GdiQdLtcPMeGgu_nhGqDMbnIaZBpvpfow6/pub?output=csv',
    sheet2: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ8hV7tT_22c1L85H_Lc0LRmL5NrQcpyuC_xlVK1u53NTjAXNqgPoVngczVuOY60DfOEMa_g9EpDl0J/pub?output=csv'
};

function parseCSV(text) {
    // 1. \r\n과 \n을 모두 대응하도록 수정 (중요!)
    const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
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
        // 2. 값의 앞뒤 공백 및 잔여 따옴표 완벽 제거
        return result.map(v => v.replace(/^"|"$/g, '').trim());
    });
}

const transformRows = (rows) => rows.map(row => ({
    date: row[0] || '',
    prd_name: row[1] || '',
    origin: row[2] || '0',
    sale_price: row[3] || '0',
    percent: row[4] || '',
    thum_url: row[5] || '',
    channel: row[6] || '',
    link: row[7] || '',
    tag: row[8] || ''
}));

async function updateData() {
    try {
        console.log('Fetching multi-sheet data...');
        const [res1, res2] = await Promise.all([
            axios.get(URLS.sheet1),
            axios.get(URLS.sheet2)
        ]);

        const combined = {
            sheet1: transformRows(parseCSV(res1.data).slice(1)),
            sheet2: transformRows(parseCSV(res2.data).slice(1))
        };

        fs.writeFileSync('./data.json', JSON.stringify(combined, null, 2));
        console.log(`Success: sheet1(${combined.sheet1.length}), sheet2(${combined.sheet2.length}) items updated!`);
    } catch (error) {
        console.error('Update failed:', error.message);
        process.exit(1);
    }
}

updateData();
