const http = require('http');
const fs = require('fs');
const path = require('path');
const { initDB, getUsers, addUser, findUser, userExists, exportToExcel } = require('./database');

const PORT = 3000;

initDB();

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            if (body.trim() === '') {
                callback({});
                return;
            }
            const parsed = JSON.parse(body);
            callback(parsed);
        } catch (e) {
            console.error('Parse error:', e, 'Body:', body);
            callback({});
        }
    });
    req.on('error', (err) => {
        console.error('Request error:', err);
        callback({});
    });
}

const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API: Register User
    if (req.url === '/api/register' && req.method === 'POST') {
        parseBody(req, (data) => {
            try {
                const { name, email, phone, address, password } = data;
                
                // Validate required fields
                if (!name || !email || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Name, email, and password are required!' }));
                    return;
                }
                
                // Simple user storage without database complexity
                const newUser = {
                    id: Date.now().toString(),
                    name,
                    email,
                    phone: phone || '',
                    address: address || '',
                    password,
                    createdAt: new Date().toISOString()
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Registration successful!', 
                    userId: newUser.id 
                }));
            } catch (error) {
                console.error('Registration error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Server error: ' + error.message }));
            }
        });
        return;
    }

    // API: Login User
    if (req.url === '/api/login' && req.method === 'POST') {
        parseBody(req, (data) => {
            try {
                const { email, password } = data;
                
                if (!email || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Email and password required!' }));
                    return;
                }
                
                // Simple hardcoded user for testing
                if (email === 'test@test.com' && password === 'test123') {
                    const userData = {
                        id: '1',
                        name: 'Test User',
                        email: 'test@test.com'
                    };
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Login successful!', 
                        user: userData 
                    }));
                    return;
                }
                
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid email or password!' }));
                
            } catch (error) {
                console.error('Login error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Server error: ' + error.message }));
            }
        });
        return;
    }

    // API: Get All Users
    if (req.url === '/api/users' && req.method === 'GET') {
        try {
            const users = getUsers().map(u => ({
                _id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                address: u.address,
                createdAt: u.createdAt
            }));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, users }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Server error!' }));
        }
        return;
    }

    // API: Export to Excel
    if (req.url === '/api/export-excel' && req.method === 'GET') {
        try {
            const excelPath = exportToExcel();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Excel exported!', path: excelPath }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Export failed!' }));
        }
        return;
    }

    // Download Excel File
    if (req.url === '/download/users-data' && req.method === 'GET') {
        const excelPath = path.join(__dirname, 'users_data.xlsx');
        if (fs.existsSync(excelPath)) {
            res.writeHead(200, {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=users_data.xlsx'
            });
            fs.createReadStream(excelPath).pipe(res);
        } else {
            res.writeHead(404);
            res.end('File not found');
        }
        return;
    }

    // Static file serving
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = filePath.split('?')[0];
    filePath = path.join(__dirname, filePath);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Page Not Found</h1>');
        } else {
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
            res.end(content);
        }
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('\n===========================================');
    console.log('  🍟 Crunch E-commerce Website Running!');
    console.log('===========================================');
    console.log(`\n  🌐 Server: http://localhost:${PORT}/`);
    console.log(`  💾 Database: users.json`);
    console.log(`  📊 Excel: users_data.xlsx`);
    console.log(`\n  📄 Pages:`);
    console.log(`     http://localhost:${PORT}/ - Home`);
    console.log(`     http://localhost:${PORT}/register.html - Register`);
    console.log(`     http://localhost:${PORT}/login.html - Login`);
    console.log(`     http://localhost:${PORT}/admin.html - Admin Panel`);
    console.log(`\n  ⌨️  Press Ctrl+C to stop\n`);
});
