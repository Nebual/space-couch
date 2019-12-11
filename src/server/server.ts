import { Game } from './Game';
import { ServerNet } from './ServerNet';
import { Express } from 'express';
import { Server as HttpServer } from 'http';
import throttle from './throttle';
const os = require('os');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const minify = require('express-minify');
const express = require('express');
const http = require('http');
const repl = require('repl');
const argv = require('minimist')(process.argv.slice(2));

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
	// Handles any requests that don't match the ones above
	server.get('/*', (req, res) => {
		res.sendFile(path.join(staticPath, 'index.html'));
	});

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

function initGame(): Game {
	try {
		let saveName = argv['load-last'] ? 'last_save.json' : argv['load'];
		if (saveName) {
			console.log(`Loading save ${saveName}...`);
			return Game.load(saveName);
		}
	} catch (e) {
		console.log('Failed to load last_save.json\n  ', e.message);
	}

	return Game.fromJSON({});
}

if (require.main === module) {
	const server: Express = initExpress();
	const httpServer = initHttpServer(server, PORT);
	let game: Game = initGame();
	const serverNet = new ServerNet(game, httpServer);

	const reloadServer = () => {
		const gameState = JSON.stringify(game);
		Object.keys(require.cache)
			.filter(key => /.*build-server.*/.test(key))
			.forEach(key => delete require.cache[key]);
		game = require('./Game').Game.fromJSON(JSON.parse(gameState));
		serverNet.setGame(game);
	};
	if (argv['watch']) {
		const chokidar = require('chokidar');
		const watcher = chokidar.watch('./build-server/');
		watcher.on('ready', () => {
			watcher.on('all', () => {
				throttle('reloadServer', reloadServer, 100);
			});
		});
	}
	const saveOnShutdown = e => {
		console.log('Writing exit save to last_save.json');
		game.save('last_save.json');
		process.exit(2);
	};
	process.on('SIGINT', saveOnShutdown);
	process.on('SIGTERM', saveOnShutdown);

	if (DEV && os.platform() !== 'win32') {
		let replInstance = repl.start({ prompt: 'node> ' });
		replInstance.context.game = game;
		replInstance.context.server = server;
		replInstance.context.reload = reloadServer;
	}
}

module.exports = {
	getHostUrl,
	initExpress,
	initHttpServer,
};
