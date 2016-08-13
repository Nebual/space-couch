class Util {
	public static calculateAngle(o){
		var g = 0;
		var a = 0;
		//The alpha value seems to change when the gamma value switches between negative and positive
		if (o.gamma >= 0) {
			a = Math.floor(o.alpha);
		}
		else {
			var alpha = Math.floor(o.alpha);
			if(alpha >= 0 && alpha < 180){
				a = alpha + 180;
			}
			else{
				a = alpha - 180;
			}
		}

		//Top half
		if (o.gamma >= 0) {
			g = Math.floor(o.gamma);
		}
		//Bottom half
		else {
			g = 180 - Math.abs(Math.floor(o.gamma));
		}

		return {g: Math.floor(g),a: Math.floor(a)};
	}
}
