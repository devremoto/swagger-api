const { execSync } = require('child_process');
const os = require('os');

const port = process.env.PORT || 3000;
const debugPort = process.env.DEBUG_PORT || 9229;
killPort(port)
killPort(debugPort)

function isPortInUse(port) {
    if (os.platform() === 'win32') {
        // Windows
        try {
            execSync(`netstat -ano | findstr :${port}`);
            return true; // Port is in use
        } catch (error) {
            return false; // Port is not in use
        }
    } else {
        // Unix-like systems (Linux, macOS)
        try {
            execSync(`lsof -i:${port}`);
            return true; // Port is in use
        } catch (error) {
            return false; // Port is not in use
        }
    }
}

function killPort(port) {
    if (isPortInUse(port)) {
        if (os.platform() === 'win32') {
            // Windows
            try {
                execSync(`powershell Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force -ErrorAction SilentlyContinue`);
                console.log('Process on port', port, 'has been stopped.');
            } catch (error) {
                console.log('No process found on port', port);
            }
        } else {
            // Unix-like systems (Linux, macOS)
            try {
                execSync(`kill $(lsof -t -i:${port})`);
                console.log('Process on port', port, 'has been killed.');
            } catch (error) {
                console.log('No process found on port', port);
            }
        }
    } else {
        console.log('No process found on port', port);
    }
}

