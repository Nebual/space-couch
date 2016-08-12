import {Robot} from "./server/ship";
const NODE_SIZE = 64;

$(function() {

	function setRobots(robots:Robot[]):void {
		for (let robot of robots) {
			var $robot = $('.robot').filter('[data-sync="robot_'+robot.id+'"]');
			if(!$robot.length) {
				// We don't have this one yet, create it
				$robot = $('<div class="robot" data-sync="robot_'+robot.id+'"><i class="fa fa-circle-o-notch fa-spin"></i></div>').appendTo($('.ship'));
			}
			$robot.css({'left': robot.left * NODE_SIZE, 'top': robot.top * NODE_SIZE});
		}
	}
	function moveRobot(id, path) {
		let $robot = $('.robot').filter('[data-sync="robot_'+id+'"]');
		let prevNode = path.shift(); // Pop off the current location
		for(let node of path) {
			let distance = Math.sqrt(Math.pow(prevNode[0]-node[0], 2) + Math.pow(prevNode[1]-node[1], 2));
			($robot as any).animate({left: node[0] * NODE_SIZE, top: node[1] * NODE_SIZE}, {duration: 800*distance, easing: 'linear'});
			prevNode = node;
		}
	}
	$(document).on('sock-message', function(e, data) {
		switch(data.event) {
			case 'robots':
				setRobots(data.value);
				break;
			case 'robotPath':
				moveRobot(data.id, data.value);
				break;
		}
	});

	var $selectedRobot:JQuery;
	$('.ship').on('click', function(e:JQueryInputEventObject) {
		if ($selectedRobot) {
			clientNet.send('moveRobot', $selectedRobot.data('sync').substr(6), [Math.floor(e.pageX/NODE_SIZE), Math.floor(e.pageY/NODE_SIZE)]);

			$selectedRobot.removeClass('selected');
			$selectedRobot = null;
		}

		let $clicked = $(e.target);
		if ($clicked.hasClass('robot')) {
			$selectedRobot = $clicked;
			$selectedRobot.addClass('selected');
			console.log('Selected', $selectedRobot);
			e.stopPropagation();
		}
	});
});
