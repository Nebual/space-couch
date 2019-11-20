import {Game} from "./server/Game";
import {ServerNet} from "./server/ServerNet";
import {Express} from "express";
const os = require('os');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const minify = require('express-minify');
const express = require('express');
const http = require('http');
const repl = require('repl');

let PORT = 8000;
const DEV: boolean = (process.env.NODE_ENV || 'development') === 'development';
const MINIFY_ASSETS = !fs.statSync('typings').isDirectory() || !DEV;

var path_to_root = path.resolve(__dirname, '..', '..');

function getHostUrl(port) {
	var ifaces = os.networkInterfaces();
	let foundUrl = '';
	Object.keys(ifaces).forEach(function (ifname) {
		if(foundUrl){
			return true;
		}
		ifaces[ifname].forEach(function (iface) {
			if(foundUrl){
				return true;
			}
			if ('IPv4' !== iface.family || iface.internal !== false) {
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				return;
			}
			if(!foundUrl){
				foundUrl = "http://"+iface.address+":"+port+"/";
			}
		});
	});
	return foundUrl;
}

function initExpress() {
	let server = express();
	server.use(compression());
	if(MINIFY_ASSETS) {
		server.use(minify());
	}
	server.use(express.static(path.join(path_to_root, 'assets'), { maxAge: 1000*60*60*24*7 }));
	server.use(express.static(path.join(path_to_root, 'generated')));
	server.set('view engine', 'ejs');

	server.get('/', function(req, res){
		res.render('partials/commonpage', {role: 'list'});
	});

	server.get('/:role', function(req, res, next){
		let role = req.params.role;
		res.render('partials/commonpage', {role: role}, function(err, html) {
			if (!err) {
				return res.send(html);
			} else {
				// Not a view, skip this resolver
				next();
			}
		});
	});
	return server;
}

function initHttpServer(expressServer, port) {
	let httpServer = http.createServer(expressServer);
	httpServer.listen(port, function () {
		// Print out our actual IP Address, so they know what to tell their friends :D
		console.log("Listening on " + getHostUrl(port));
	});
	return httpServer;
}

function initGameServer(httpServer) {
	let game = new Game();
	game.net = new ServerNet(game, httpServer);
	game.initShip('ship1');
	return game;
}


if (require.main === module) {
	let server: Express = initExpress();
	let httpServer = initHttpServer(server, PORT);
	let game: Game = initGameServer(httpServer);

	if (DEV && os.platform() !== 'win32') {
		let replInstance = repl.start({'prompt': 'node> '});
		replInstance.context.game = game;
		replInstance.context.server = server;
	}
}

module.exports = {
	getHostUrl,
	initExpress,
	initHttpServer,
	initGameServer,
};
