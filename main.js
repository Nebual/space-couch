const electron = require('electron');
const os = require('os');
const app = electron.app;
const WebSocketServer = require('websocket').server;
const path = require('path');
const window = require('electron-window');
const express = require('express');
const exphbs = require('express-handlebars');

let mainWindow; // reference kept for GC

var host_url;
let PORT = 8000;

function echoSingleFile(response, name) {
		'use strict';
		var content_type = 'text/plain';
		if(name.indexOf('.css') !== -1) {
			content_type = 'text/css';
		}
		response.writeHead(200, {'content-type' : content_type});
		response.end(fs.readFileSync(name, 'utf8'));
}

app.on('ready', function() {

	var ifaces = os.networkInterfaces();
	Object.keys(ifaces).forEach(function (ifname) {
		ifaces[ifname].forEach(function (iface) {
			if ('IPv4' !== iface.family || iface.internal !== false) {
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				return;
			}
			host_url = "http://"+iface.address+":"+PORT+"/";
		});
	});

	mainWindow = window.createWindow({width: 800, height: 600});
	const indexPath = path.resolve(__dirname, 'index.html');
	mainWindow.showUrl(indexPath, {
		'role_url': host_url + 'role/'
	}, () => {
		console.log('window is now visible!');
		//mainWindow.webContents.openDevTools();
	});

	mainWindow.on('closed', function () {
		mainWindow = null; // let GC run its course
	});

	//Staic file server
	var server = express();
	server.use(express.static(path.join(__dirname + '/assets')));
	server.set('view engine', 'ejs');

	server.get('/', function(req, res){
		res.render('index', {title: 'Title data'});
	});

	server.get('/:role', function(req, res){
		var role = req.params.role;
		res.render(role);
	});

	//Start server
	server.listen(8000, function(){
		// Print out our actual IP Address so they know what to tell their friends :D
		console.log("Listening on "+host_url);
	});

	//Websocket server
	var wsServer = new WebSocketServer({
		httpServer: server
	});
	var activeSocks = [];
	function broadcast(data) {
		'use strict';
		activeSocks.forEach(function(connection) {
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
						break;
					case 'state':
						console.log("They set " + msg.id + " to " + msg.value);
						broadcast({'event': 'state', 'id': msg.id, 'value': msg.value});
						switch(msg.id) {
							case 'main_power_system':
								broadcast({'event': 'main_power_system', 'value': msg.value});
								break;
							case 'flush_gravity':
								broadcast({'event': 'vibrate', 'value': 300});
								break;
						}
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

