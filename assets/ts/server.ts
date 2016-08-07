import {ShipNodes, Robot} from "./server/ship";
const electron = require('electron');
const os = require('os');
const fs = require('fs');
const app = electron.app;
const WebSocketServer = require('websocket').server;
const path = require('path');
const electronWindow = require('electron-window');
const compression = require('compression');
const minify = require('express-minify');
const express = require('express');
const http = require('http');

let server;
let mainWindow; // reference kept for GC

var host_url;
let PORT = 8000;
const MINIFY_ASSETS = !fs.statSync('typings').isDirectory() || false;

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
		req.role = req.params.role;
		res.render(req.role, {role: req.role}, function(err, html) {
			if (!err) {
				return res.send(html);
			} else {
				// Not a view, skip this resolver
				next();
			}
		});
	});

	//Start server
	server.server = http.createServer(server);
	server.server.listen(PORT, function(){
		// Print out our actual IP Address so they know what to tell their friends :D
		console.log("Listening on "+host_url);
	});


	class Game {
		public lights_on;
		public paused;
		private state;
		private ship;
		constructor() {
			this.lights_on = true;
			this.paused = false;
			this.state = {
				'captain': {},
				'engineer': {},
				'navigation': {},
				'robotics': {},
				'weapons': {},
			};
		}
		setRoleState(role, id, value) {
			this.state[role][id] = value;
			broadcast({'event': 'state', 'id': id, 'value': value}, role);
		}
		getRoleState(role, id) {
			return this.state[role][id];
		}
		getRoleStates(role) {
			return this.state[role] || {};
		}

		public initShip(shipName: string) {
			this.ship = new ShipNodes(shipName);
			this.ship.createRobots(3);
		}
		public getShipRobots(): Robot[] {
			return this.ship.robots;
		}
		public moveRobot(id:number, coord) {
			var robot = this.ship.robots[id];
			if(!robot) return;
			robot.left = coord[0];
			robot.top = coord[1];
			broadcast({'event': 'robots', 'id': id, 'value': [robot]}, 'robotics');
		}
	}
	var game = new Game();
	game.initShip('ship1');

	var wsServer = new WebSocketServer({
		httpServer: server.server
	});
	var activeSocks = [];
	function broadcast(data, role='') {
		activeSocks.forEach(function(connection) {
			if(role && connection.role != role) return;
			connection.send(JSON.stringify(data));
		});
	}
	wsServer.on('request', function(request) {
		var connection = request.accept(null, request.origin);

		// This is the most important callback for us, we'll handle
		// all messages from users here.
		connection.on('message', function(raw_message) {
			if (raw_message.type === 'utf8') {
				var msg = JSON.parse(raw_message.utf8Data);
				console.log("Got a message!", msg);

				switch(msg.event) {
					case 'init':
						activeSocks.push(connection);
						connection.role = msg.role;

						connection.send(JSON.stringify({'event': 'lights_on', 'value': game.lights_on}));
						connection.send(JSON.stringify({'event': 'pause', 'value': game.paused}));
						var role_state = game.getRoleStates(connection.role);
						for(let index of Object.keys(role_state)) {
							connection.send(JSON.stringify({'event': 'state', 'id': index, 'value': role_state[index]}));
						}
						switch(connection.role) {
							case 'robotics': {
								connection.send(JSON.stringify({'event': 'robots', 'value': game.getShipRobots()}));
								break;
							}
						}
						break;
					case 'state':
						console.log("They set " + msg.id + " to " + msg.value);
						game.setRoleState(connection.role, msg.id, msg.value);
						switch(msg.id) {
							case 'main_power_system':
								game.lights_on = msg.value;
								broadcast({'event': 'lights_on', 'value': game.lights_on});
								break;
							case 'flush_gravity':
								broadcast({'event': 'vibrate', 'value': 300});
								break;
							case 'pause':
								game.paused = msg.value;
								broadcast({'event': 'pause', 'value': game.paused});
								break;
						}
						break;
					case 'moveRobot':
						game.moveRobot(msg.id, msg.value);
						break;
					default:
						console.log("Unknown event: " + msg.event);
				}
			}
		});

		connection.on('close', function(connection) {
			console.log("We lost ws, jim", connection);
			var i = activeSocks.indexOf(connection);
			if(i > -1) {
				activeSocks.splice(i, 1);
			}
		});
	});
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

