declare var gyro:gyro;
interface gyro {
    eulerToQuaternion(e);
    frequency:number;
    getOrientation();
    calibrate();
    startTracking(func:any);
    stopTracking();
    hasFeature(feature:string);
    getFeatures();
}
