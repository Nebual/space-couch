import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

import './Overview.scss';

export default function Overview() {
	const baseUrl = `https://${window.location.host}${
		window.location.port !== '443' ? ':' + window.location.port : ''
	}/`;

	const [qrCodeImgTag, setQrCodeData] = useState(null);
	useEffect(() => {
		(async () => {
			setQrCodeData(await QRCode.toDataURL(baseUrl));
		})();
	});
	return (
		<div className="container-overview">
			<h1>Project Space Couch</h1>
			<img className="qrcode" src={qrCodeImgTag} alt="qrcode" />
		</div>
	);
}
