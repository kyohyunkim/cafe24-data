const fs = require('fs');
const axios = require('axios');

const URLS = {
    sheet1: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSuGnGQb0WGZk5myNrkVF2d-OLRsAPEd8HY9PM-cVsuC5xiBDCN3tSrRaZWgUJqA2hQmFFHA3OiOWyb/pub?output=csv',
    sheet2: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSuEEqzyzg0p3rSb0wl1uAYlAZtjKAPg5Gy-k3BCgpjGNV2wZMUa1ZFKbYqSU6e3rMzfHWFlqRZkRvC/pub?output=csv'
};

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

const transformRows = (rows) => rows.map(row => ({
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
        console.log('Success: All sheets updated!');
    } catch (error) {
        console.error('Update failed:', error.message);
        process.exit(1);
    }
}

updateData();