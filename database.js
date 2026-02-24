const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'users.json');

function initDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }));
    }
}

function getUsers() {
    try {
        initDB();
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data).users;
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users }, null, 2));
}

function addUser(userData) {
    try {
        const users = getUsers();
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers(users);
        return newUser;
    } catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
}

function findUser(email, password) {
    try {
        const users = getUsers();
        return users.find(u => u.email === email && u.password === password);
    } catch (error) {
        console.error('Error finding user:', error);
        throw error;
    }
}

function userExists(email) {
    const users = getUsers();
    return users.some(u => u.email === email);
}

function exportToExcel() {
    try {
        const users = getUsers();

        const excelData = users.map(user => ({
            'ID': user.id,
            'Name': user.name,
            'Email': user.email,
            'Phone': user.phone || 'N/A',
            'Address': user.address || 'N/A',
            'Password': user.password,
            'Created At': new Date(user.createdAt).toLocaleString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

        const excelPath = path.join(__dirname, 'users_data.xlsx');
        XLSX.writeFile(workbook, excelPath);

        console.log('✅ Excel file updated: users_data.xlsx');
        return excelPath;
    } catch (error) {
        console.error('❌ Excel export error:', error);
        throw error;
    }
}

module.exports = { initDB, getUsers, addUser, findUser, userExists, exportToExcel };