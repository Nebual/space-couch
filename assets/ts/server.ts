import {Game} from "./server/Game";
import {ServerNet} from "./server/ServerNet";
import {Express} from "express";
const electron = require('electron');
const os = require('os');
const fs = require('fs');
const app = electron.app;
const path = require('path');
const electronWindow = require('electron-window');
const compression = require('compression');
const minify = require('express-minify');
const express = require('express');
const http = require('http');
const repl = require('repl');

let game : Game;
let server : Express;
let mainWindow; // reference kept for GC

var host_url;
let PORT = 8000;
const DEV: boolean = (process.env.NODE_ENV || 'development') === 'development';
const MINIFY_ASSETS = !fs.statSync('typings').isDirectory() || !DEV;

var path_to_root = path.resolve(__dirname, '..', '..');

app.on('ready', function() {

	var ifaces = os.networkInterfaces();
	Object.keys(ifaces).forEach(function (ifname) {
		if(host_url){
			return true;
		}
		ifaces[ifname].forEach(function (iface) {
			if(host_url){
				return true;
			}
			if ('IPv4' !== iface.family || iface.internal !== false) {
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				return;
			}
			if(!host_url){
				host_url = "http://"+iface.address+":"+PORT+"/";
			}
		});
	});

	mainWindow = electronWindow.createWindow({width: 800, height: 600});
	mainWindow.showUrl(path.resolve(path_to_root, 'index.html'), {
		'role_url': host_url
	}, () => {
		console.log('window is now visible!');
		//mainWindow.webContents.openDevTools();
	});

	mainWindow.on('closed', function () {
		mainWindow = null; // let GC run its course
	});

	//Staic file server
	server = express();
	server.use(compression());
	if(MINIFY_ASSETS) {
		server.use(minify());
	}
	server.use(express.static(path.join(path_to_root, 'assets'), { maxAge: 1000*60*60*24*7 }));
	server.use(express.static(path.join(path_to_root, 'generated')));
	server.set('view engine', 'ejs');

	server.get('/', function(req, res){
		res.render('index', {title: 'Title data', role: 'list'});
	});

	server.get('/:role', function(req, res, next){
		let role = req.params.role;
		res.render(role, {role: role}, function(err, html) {
			if (!err) {
				return res.send(html);
			} else {
				// Not a view, skip this resolver
				next();
			}
		});
	});

	//Start server
	let httpServer = http.createServer(server);
	httpServer.listen(PORT, function(){
		// Print out our actual IP Address so they know what to tell their friends :D
		console.log("Listening on "+host_url);
	});

	game = new Game();
	game.net = new ServerNet(game, httpServer);
	game.initShip('ship1');

	if(DEV && os.platform() !== 'win32') {
		let replInstance = repl.start({'prompt': 'node> '});
		replInstance.on('exit', () => {
			app.quit();
		});
		replInstance.context.game = game;
		replInstance.context.server = server;
	}
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

