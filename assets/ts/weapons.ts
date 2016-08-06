$(function() {
    var canvas = <HTMLCanvasElement> document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var reticle = {
        x: 240,
        y: 160,
        sizeX: 10,
        sizeY: 10
    };
    gyro.frequency = 20;
    gyro.startTracking(function (o) {
        //The alpha value seems to change when the gamma value switches between negative and positive
        if (o.gamma > 0) {
            reticle.x = 480 - (Math.floor(o.alpha) / 360) * 480;
            $('#gamma').text('gammaP: ' + Math.floor(o.gamma));
        }
        else {
            reticle.x = 480 - ((Math.floor(o.alpha) / 360) * 480) + 240;
            $('#gamma').text('gammaN: ' + Math.floor(o.gamma));
            //This is dumb figure out why it does this
            if (reticle.x > 480) {
                reticle.x -= 480;
            }
        }

        //Top half
        if (o.gamma > 0) {
            reticle.y = (Math.floor(o.gamma) + 1) / 90 * 160;
        }
        //Bottom half
        else {
            reticle.y = -((Math.floor(Math.abs(o.gamma))) / 90 * 160) + 320;
        }

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 480, 320);

        ctx.fillStyle = "red";
        ctx.fillRect(reticle.x - (reticle.sizeX / 2), reticle.y - (reticle.sizeY / 2), reticle.sizeX, reticle.sizeY);

        $('#alpha').text('alpha: ' + Math.floor(reticle.x));
        $('#beta').text('beta: ' + Math.floor(o.beta));
    });
});
