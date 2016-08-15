(function($) {

    function rangeSlider(elem, config) {
        let $elem = $(elem);
        var self = this;

        this._rangeOffset = 0;
        this._range = document.createElement('div');
        this._dragger = document.createElement('span');
        this._cachePosition = 0;
        this._rangeWidth = 0;
        this._draggerWidth = 0;

        var defaults = {
            value: 37, // set default value on initiation from `0` to `100` (percentage based)
            vertical: false, // vertical or horizontal?
            rangeClass: "", // add extra custom class for the range slider track
            draggerClass: "", // add extra custom class for the range slider dragger
            drag: function (v) { /* console.log(v); */
            } // function to return the range slider value into something
        };

        for (var i in defaults) {
            if (typeof config[i] == "undefined") config[i] = defaults[i];
        }
        this._config = config;

        function getPos(el) {
            var left = 0, top = 0;
            if (el.offsetParent) {
                do {
                    left += el.offsetLeft;
                    top += el.offsetTop;
                } while (el = el.offsetParent);
            } else {
                left = el.offsetLeft;
                top = el.offsetTop;
            }
            return [left, top];
        }

        function addEventTo(el, ev, fn) {
            if (el.addEventListener) {
                var evts = ev.split(' ');
                for (var i = 0, iLen = evts.length; i < iLen; i++) {
                    el.addEventListener(evts[i], fn, false);
                }

            } else if (el.attachEvent) {
                el.attachEvent('on' + ev, fn);
            } else {
                el['on' + ev] = fn;
            }
        }

        var isVertical = config.vertical;

        $elem.addClass('range-slider').addClass('range-slider-' + (isVertical ? 'vertical' : 'horizontal'));
        self._range.className = ('range-slider-track ' + config.rangeClass).replace(/ +$/, "");
        self._dragger.className = ('dragger ' + config.draggerClass).replace(/ +$/, "");

        addEventTo(self._range, "mousedown touchstart", function (e) {
            let target = getTarget(e);
            if(!target) return;

            self._rangeWidth = self._range[!isVertical ? 'offsetWidth' : 'offsetHeight'];
            self._rangeOffset = getPos(self._range)[!isVertical ? 0 : 1];
            self._draggerWidth = self._dragger[!isVertical ? 'offsetWidth' : 'offsetHeight'];
            $elem.addClass('active');
            updateDragger(e, target);
            return false;
        });

        addEventTo(document, "mousemove touchmove", function (e) {
            let target = getTarget(e);
            if(!target) return;

            updateDragger(e, target);
        });

        addEventTo(document, "mouseup touchend", function (e) {
            let target = getTarget(e);
            if(!target) return;

            $elem.removeClass('active');
        });

        addEventTo(window, "resize", function (e) {
            var woh = self._dragger[!isVertical ? 'offsetWidth' : 'offsetHeight'];
            self._dragger.style[!isVertical ? 'left' : 'top'] = (((self._cachePosition / 100) * self._range[!isVertical ? 'offsetWidth' : 'offsetHeight']) - (woh / 2)) + 'px';
            $elem.removeClass('active');
        });

        function getTarget(e) {
            if (e.changedTouches) {
                for (var i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].target === self._dragger) {
                        return e.changedTouches[i];
                    }
                }
            } else {
                return e;
            }
        }

        function updateDragger(e, target) {
            e = e || window.event;
            let currentX = target.pageX;
            let currentY = target.pageY;

            var pos = !isVertical ? currentX : currentY;
            if (!pos) {
                pos = !isVertical ? currentX + document.body.scrollLeft + document.documentElement.scrollLeft : currentY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            if ($elem.hasClass('active') && pos >= self._rangeOffset && pos <= (self._rangeOffset + self._rangeWidth)) {
                let newPos = ((pos - self._rangeOffset) / self._rangeWidth) * 100;
                self.setValue(newPos);
                config.drag(Math.round(newPos), e);
            }
            e.preventDefault();
            e.stopPropagation();
        }

        function initDragger() {
            var woh = self._dragger[!isVertical ? 'offsetWidth' : 'offsetHeight'];
            self._cachePosition = ((config.value / 100) * self._range[!isVertical ? 'offsetWidth' : 'offsetHeight']);
            self._dragger.style[!isVertical ? 'left' : 'top'] = (self._cachePosition - (woh / 2)) + 'px';
            self._rangeWidth = self._range[!isVertical ? 'offsetWidth' : 'offsetHeight'];
            self._draggerWidth = self._dragger[!isVertical ? 'offsetWidth' : 'offsetHeight'];
            config.drag(config.value);
        }

        self._range.appendChild(self._dragger);
        elem.appendChild(self._range);

        initDragger();
    }
    $.extend( rangeSlider.prototype, {
        getValue: function() : number {
            return Math.round(this._cachePosition);
        },
        setValue: function(newPercent:number) : void {
            this._cachePosition = newPercent;
            this._dragger.style[!this._config.vertical ? 'left' : 'top'] = (((newPercent / 100) * this._rangeWidth) - (this._draggerWidth / 2)) + 'px';
        }
    } );

    $.fn.rangeSlider = function (options) {
        return this.each(function() {
            if (!$.data(this, "rangeSlider")) {
                $.data(this, "rangeSlider", new rangeSlider(this, options));
            }
        });
    };

})(jQuery);
