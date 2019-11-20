const electron = require('electron');
const os = require('os');
const path = require('path');
const electronWindow = require('electron-window');
const repl = require('repl');

const {
    getHostUrl,
    initExpress,
    initHttpServer,
    initGameServer,
} = require('./server');

let game;
let server;
let mainWindow; // reference kept for GC

const PORT = 8000;
const DEV: boolean = (process.env.NODE_ENV || 'development') === 'development';

var path_to_root = path.resolve(__dirname, '..', '..');

electron.app.on('ready', function() {

    mainWindow = electronWindow.createWindow({width: 800, height: 600});
    mainWindow.showUrl(path.resolve(path_to_root, 'index.html'), {
        'role_url': getHostUrl(PORT)
    }, () => {
        console.log('window is now visible!');
        //mainWindow.webContents.openDevTools();
    });

    mainWindow.on('closed', function () {
        mainWindow = null; // let GC run its course
    });

    server = initExpress();
    let httpServer = initHttpServer(server, PORT);
    game = initGameServer(httpServer);

    if(DEV && os.platform() !== 'win32') {
        let replInstance = repl.start({'prompt': 'node> '});
        replInstance.on('exit', () => {
            if (electron && electron.app) {
                electron.app.quit();
            }
        });
        replInstance.context.game = game;
        replInstance.context.server = server;
    }
});

// Quit when all windows are closed.
electron.app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        electron.app.quit();
    }
});
