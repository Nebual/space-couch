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
	$(document).on('sock-message', function(e, data) {
		switch(data.event) {
			case 'robots':
				setRobots(data.value);
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
