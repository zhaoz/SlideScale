(function ($) {
$.fn.slidescale = function (options) {
    this.each(function () {
        var elem = $(this),
            obj = $.slidescale(elem, options);
        elem.data('slidescale', obj);
    });

    return this;
};

$.slidescale = function (container, options) {
    this.container = container;
    this.opts = $.extend({}, $.slidescale.defaults, options);

    this.container.addClass('slidescale')
        .children('ol').addClass('slidescale-list');
};

$.slidescale.defaults = {
};

$.slidescale.prototype = {
};

}(jQuery));
