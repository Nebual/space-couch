require('electron-window').parseArgs();

var qr_container = document.getElementById('qr_container');

var qrCode = require('qrcode-npm');
var qr = qrCode.qrcode(4, 'M');
qr.addData(window.__args__.role_url);
qr.make();
qr_container.innerHTML = qr.createImgTag(4);