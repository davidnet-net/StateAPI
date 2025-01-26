//*
// StateAPI
// Gives information about the server
//
// Requires the acpi & speedtest-cli package to be installed
// Only supports linux!
// *\\

// Services
import OS from 'os';
import Disk from 'diskusage';
import Docker from 'dockerode';
import Axios from 'axios';
import { exec } from 'child_process';

// Modules
import { Api, RegisterNode, State } from './DN-Node.js';

// Main
Api.get('/', (req, res) => {
    res.redirect('https://davidnet.net/Errors/Lost');
});

Api.get('/Cpu', (req, res) => {
    const cpuInfo = OS.cpus();
    res.json(cpuInfo);
});

Api.get('/Ram', async (req, res) => {
    const Total = (OS.totalmem() / (1024 ** 3)).toFixed(2) + ' GB';
    const Free = (OS.freemem() / (1024 ** 3)).toFixed(2) + ' GB';
    const Used = ((OS.totalmem() - OS.freemem()) / (1024 ** 3)).toFixed(2) + ' GB';

    res.json({
        Total: Total,
        Free: Free,
        Used: Used,
    });
});

Api.get('/Disk', async (req, res) => {
    const { Total, Free } = await Disk.check('/');
    const Used = Total - Free;

    res.json({
        Total: (Total / (1024 ** 3)).toFixed(2) + ' GB',
        Free: (Free / (1024 ** 3)).toFixed(2) + ' GB',
        Used: (Used / (1024 ** 3)).toFixed(2) + ' GB',
    });
});

Api.get('/IP', async (req, res) => {
    try {
        const Interfaces = OS.networkInterfaces();
        let Internal = '';
        for (const iface of Object.values(Interfaces)) {
            for (const addr of iface) {
                if (addr.family === 'IPv4' && !addr.internal) {
                    Internal = addr.address;
                    break;
                }
            }
            if (Internal) break;
        }

        const Response = await Axios.get('http://davidnet.net/API/MyIp.php');
        const External = Response.data.ip;
        res.json({
            Internal: Internal,
            External: External,
        });
    } catch (error) {
        console.error('Error fetching external IP:', error.response ? error.response.data : error.message);
        res.status(500).send('Error fetching IP addresses');
    }
});

Api.get('/Containers', async (req, res) => {
    try {
        const Containers = await Docker.listContainers({ all: false }); // Haal alleen actieve containers op
        res.json(Containers);
    } catch (err) {
        console.error("Error fetching active containers:", err);
        res.status(500).json({ error: 'Failed to get active containers' });
    }
});

Api.get('/Nodes', (req, res) => {
    exec("ps aux | grep '[n]ode'", (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error}`);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const Processes = stdout.split('\n').map(line => {
            const parts = line.trim().split(/\s+/);
            return {
                User: parts[0],
                Pid: parts[1],
                Command: parts.slice(10).join(' '),
            };
        }).filter(proc => proc.command); // Remove empty lines

        res.json(Processes);
    });
});

Api.get('/Speedtest', (req, res) => {
    exec('speedtest-cli --json', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing speedtest-cli: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        try {
            const result = JSON.parse(stdout);
            res.json({
                download_speed_mbps: (result.download / 1_000_000).toFixed(2),
                upload_speed_mbps: (result.upload / 1_000_000).toFixed(2),
                ping_ms: result.ping,
                server: result.server.name,
                location: result.server.country
            });
        } catch (parseError) {
            console.error(`Failed to parse JSON: ${parseError.message}`);
            res.status(500).json({ error: 'Failed to parse speedtest-cli output' });
        }
    });
});

Api.get('/Temperature', (req, res) => {
    exec('vcgencmd measure_temp', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing vcgencmd measure_temp: ${error}`);
            return res.status(500).json({ error: 'Error executing vcgencmd measure_temp' });
        }

        res.send({
            stdout
        })
    });
});

// Register
RegisterNode(2000);
