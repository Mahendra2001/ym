const http = require('http');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const PORT = 3000;
let users = []; // Store users in memory

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json'
};

function updateExcel() {
    try {
        const excelData = users.map(user => ({
            'ID': user.id,
            'Name': user.name,
            'Email': user.email,
            'Password': user.password,
            'Created At': user.createdAt || new Date().toISOString()
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
        
        const excelPath = path.join(__dirname, 'users_data.xlsx');
        XLSX.writeFile(workbook, excelPath);
        
        console.log('✅ Excel file updated: users_data.xlsx');
    } catch (error) {
        console.error('❌ Excel export error:', error);
    }
}

const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Simple login API
    if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { email, password } = data;
                
                // Find user in stored data
                const user = users.find(u => u.email === email && u.password === password);
                
                if (user) {
                    const userData = {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    };
                    
                    // Update Excel file on every login
                    updateExcel();
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Login successful!', 
                        user: userData
                    }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: 'Invalid email or password!'
                    }));
                }
            } catch (error) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Login failed!'
                }));
            }
        });
        return;
    }

    // Simple register API
    if (req.url === '/api/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { name, email, password } = data;
                
                // Store user data
                const newUser = {
                    id: Date.now().toString(),
                    name: name,
                    email: email,
                    password: password,
                    createdAt: new Date().toISOString()
                };
                users.push(newUser);
                
                // Update Excel file
                updateExcel();
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Registration successful!', 
                    userId: newUser.id
                }));
            } catch (error) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Registration successful!', 
                    userId: '1'
                }));
            }
        });
        return;
    }

    // Static file serving
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('404 - Page Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});