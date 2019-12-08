declare var gyro: gyro;
interface gyro {
	getOrientation();
	eulerToQuaternion(e);
	calibrate();
	hasFeature(feature: string);
	getFeatures();
	setupListeners();
	removeListeners();
}
