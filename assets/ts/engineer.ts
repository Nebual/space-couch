$(function() {
    var $console = $('.console');
    $(document).on('sock-message', function(e, data) {
        $console.text($console.text() + (new Date()).toLocaleTimeString() + ': ' + JSON.stringify(data) + "\n");
        $console.scrollTop($console.prop("scrollHeight"));
    });

    $('.range-slider').each(function(i) {
        rangeSlider(this, {
            vertical: $(this).data('vertical') ? true : false,
            drag: function(v) {
                console.log("Power", v);
            }
        });
    });

    var $cards = $('.card');
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
});
