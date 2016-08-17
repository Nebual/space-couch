'use strict';

$(function() {
    let initial_load = true;
    $(document.body).css('overflow-y', 'hidden'); // prevents "pull down to refresh"

    var $console = $('.console');
    $(document).on('sock-message', function(e, data) {
        $console.text($console.text() + (new Date()).toLocaleTimeString() + ': ' + JSON.stringify(data) + "\n");
        $console.scrollTop($console.prop("scrollHeight"));
    });

    $('.range-slider').each(function(i) {
        var $slider = $(this);
        $slider.rangeSlider({
            vertical: $slider.data('vertical') ? true : false,
            drag: function(v) {
                if(initial_load) return;
                let ang: number = 2 * v;
                throttle($slider.data('sync'), function () {
                    clientNet.sendState($slider.data('sync'), $slider.data('rangeSlider').getValue());
                    if($slider.data('sync') == 'power2') {
                        $('output').val(Math.floor(ang / 240 * 100) + '°C');
                    }
                }, 250);
                if($slider.data('sync') == 'power2') {
                    $('.indicator, .indicator + i').css({
                        transform: 'rotate(' + (ang - 120) + 'deg)'
                    });
                }
            }
        });
    });

    var $cards = $('.card');
    $cards.filter(':not(:first-child())').hide();
    var hammertime = new Hammer(document.body, {
        recognizers: [
            // RecognizerClass, [options], [recognizeWith, ...], [requireFailure, ...]
            [Hammer.Swipe,{ direction: Hammer.DIRECTION_HORIZONTAL }],
        ]
    });
    hammertime.on("swipeleft", function(event) {
        var $target = $(event.target);
        if(!$target.hasClass('card')) {
            $target = $target.parent('.card');
        }

        var rightIndex = $cards.index($target)+1;
        if(rightIndex >= $cards.length) return; //rightIndex = 0;
        $target.hide();
        $($cards[rightIndex]).show();
        $($cards[rightIndex]).trigger('card-shown');
    });
    hammertime.on("swiperight", function(event) {
        var $target = $(event.target);
        if(!$target.hasClass('card')) {
            $target = $target.parent('.card');
        }

        var leftIndex = $cards.index($target)-1;
        if(leftIndex < 0) return; //leftIndex = $cards.length - 1;
        $target.hide();
        $($cards[leftIndex]).show();
        $($cards[leftIndex]).trigger('card-shown');
    });
    $cards.on('card-shown', function() {
        if($(this).find('.console')) {
            $console.scrollTop($console.prop("scrollHeight"));
        }
    });
    initial_load = false;
});
