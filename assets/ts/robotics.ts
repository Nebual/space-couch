import {Robot} from "./server/ship";
const NODE_SIZE = 64;

function setNodeState(left: number, top: number, type: string, state: boolean) {
	let id = type+'_'+left+'x'+top;
	let $obj = $('.'+type).filter(`[data-sync="${id}"]`);
	if(!state && $obj.length) {
		$obj.remove();
	} else if(state && !$obj.length) {
		$(`<div class="${type}" data-sync="${id}"></div>`)
			.css({'left': left * NODE_SIZE, 'top': top * NODE_SIZE})
			.appendTo($('.ship'));
	}
}
$(function() {

	function setRobots(robots:Robot[]):void {
		for (let robot of robots) {
			var $robot = $('.robot').filter('[data-sync="robot_'+robot.id+'"]');
			if(!$robot.length) {
				// We don't have this one yet, create it
				$robot = $('<div class="robot" data-sync="robot_'+robot.id+'"><i class="fa fa-circle-o-notch fa-spin"></i><i class="fa fa-cog fa-spin robot__busy"></i></div>').appendTo($('.ship'));
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
	$(document).on('sock-init', function(e) {
		$('.fire, .robot, .sparks').remove();
	});
	$(document).on('sock-message', function(e, data) {
		switch(data.event) {
			case 'state':
				if(data.id.substr(0, 6) === 'robot_') {
					let $robot = $('.robot').filter('[data-sync="'+data.id+'"]');
					$robot.toggleClass('busy', data.value);
				}
				break;
			case 'robots':
				setRobots(data.value);
				break;
			case 'robotPath':
				moveRobot(data.id, data.value);
				break;
			case 'nodeState':
				setNodeState(data.value.left, data.value.top, data.id, data.value.state);
				break;
		}
	});

	let $robotActions = $('#robot-actions');
	var $selectedRobot:JQuery;
	$('.ship').on('click', function(e:JQueryInputEventObject) {
		let $clicked = $(e.target);
		if ($selectedRobot) {
			if($robotActions.hasClass('active')) return; // Don't do anything here if the menu is open

			if ($clicked.is($selectedRobot)) { // double click
				let position = $selectedRobot.offset();
				$robotActions.css({left: position.left, top: position.top});
				$('.radial-overlay').toggleClass('active', !$robotActions.hasClass('active'));
				setTimeout(() => {
					// Delayed so the transition works
					$robotActions.toggleClass('active');
				}, 0);

				e.stopPropagation();
				return;
			}
			clientNet.send('moveRobot', $selectedRobot.data('sync').substr(6), [Math.floor(e.pageX/NODE_SIZE), Math.floor(e.pageY/NODE_SIZE)]);

			$selectedRobot.removeClass('selected');
			$selectedRobot = null;
		}

		if ($clicked.hasClass('robot')) {
			$selectedRobot = $clicked;
			$selectedRobot.addClass('selected');
			console.log('Selected', $selectedRobot);
			e.stopPropagation();
		}
	});
	$robotActions.find('li').click(function() {
		let type = $(this).data('type');
		if(!type) return;

		clientNet.send('robotAction', $selectedRobot.data('sync').substr(6), type);
		$('.radial-overlay').trigger('click');
	});
	$('.radial-overlay').click(function() {
		$('.radial-overlay, .radial-menu').removeClass('active');
		$selectedRobot.removeClass('selected');
		$selectedRobot = null;
	});
});
