$(function() {
    function calculateAngle(o){
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

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var container = document.getElementById("weaponsCanvas");
    var DEFAULT_WIDTH = window.innerWidth;
    var DEFAULT_HEIGHT = window.innerHeight;
    canvas.width = DEFAULT_WIDTH;
    canvas.height = DEFAULT_HEIGHT;
    container.appendChild(canvas);
    var reticle = {
        x: 0,
        y: 0,
        sizeX: 10,
        sizeY: 10
    };
    gyro.frequency = 20;

    reticle.x = DEFAULT_WIDTH/2 - reticle.sizeX/2;
    reticle.y = DEFAULT_HEIGHT/2 - reticle.sizeY/2;

    var numBgLayers = 12;
    var baseStartNum = 16;
    var CIRCLE_THRESHOLD = 1.12;
    var baseStarRadius = 1.5;
    var bgLayers = [];

    var getRandomInt = function( min, max ) {
        return Math.floor( Math.random( ) * ( max - min + 1 )) + min;
    }

    for(var i = numBgLayers; i > 0; i--){
        var stars = [];

        for(var j = 0; j < baseStartNum * i; j++){
            var star = {
                x: getRandomInt(0, DEFAULT_WIDTH),
                y: getRandomInt(0, DEFAULT_HEIGHT),
                radius: Math.round(baseStarRadius / i * 100) / 100
            }
            stars.push(star);
        }
        bgLayers.push(stars);
    }

    console.log(bgLayers);

    function clearScreen(){
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
    }

    function update(o){
        var angle = Util.calculateAngle(o);
        $('#gamma').text('CG: ' + angle.g);
        $('#alpha').text('CA: ' + angle.a);
    }

    function render(){
        clearScreen();

        ctx.fillStyle = '#FFF';
        for(var i = 0; i < bgLayers.length; i++){
            for(var j = 0; j < bgLayers[i].length; j++){
                var star = bgLayers[i][j];

                if(star.radius >= CIRCLE_THRESHOLD){
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI, false);
                    ctx.fill();
                }
                else{
                    var pixelSize = star.radius * 3;
                    ctx.fillRect(star.x, star.y, pixelSize, pixelSize);
                }
            }
        }

        //Aiming reticle
        ctx.fillStyle = "red";
        ctx.fillRect(reticle.x - (reticle.sizeX / 2), reticle.y - (reticle.sizeY / 2), reticle.sizeX, reticle.sizeY);
    }

    gyro.startTracking(function (o) {
        update(o);

        render();
    });
});
