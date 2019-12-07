import { Game } from './Game';
import { ServerNet } from './ServerNet';
import { Express } from 'express';
import { Server as HttpServer } from 'http';
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
const MINIFY_ASSETS = false; // webpack handles it

const staticPath = path.resolve(__dirname, '..', 'build');

function getHostUrl(port: number) {
	const ifaces = os.networkInterfaces();
	let foundUrl = '';
	Object.keys(ifaces).forEach(function(ifname) {
		if (foundUrl) {
			return true;
		}
		ifaces[ifname].forEach(function(iface) {
			if (foundUrl) {
				return true;
			}
			if ('IPv4' !== iface.family || iface.internal !== false) {
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				return;
			}
			if (!foundUrl) {
				foundUrl = 'http://' + iface.address + ':' + port + '/';
			}
		});
	});
	return foundUrl;
}

function initExpress() {
	let server = express();
	server.use(compression());
	if (MINIFY_ASSETS) {
		server.use(minify());
	}
	server.use(
		express.static(staticPath, {
			maxAge: 1000 * 60 * 5,
		})
	);

	return server;
}

function initHttpServer(expressServer: Express, port: number): HttpServer {
	let httpServer = http.createServer(expressServer);
	httpServer.listen(port, function() {
		// Print out our actual IP Address, so they know what to tell their friends :D
		console.log('Listening on ' + getHostUrl(port));
	});
	return httpServer;
}

function initGameServer(httpServer: HttpServer) {
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
		let replInstance = repl.start({ prompt: 'node> ' });
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
