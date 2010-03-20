(function ($) {
$.fn.slidescale = function (options) {
    this.each(function () {
        var elem = $(this),
            obj = new $.slidescale(elem, options);
        elem.data('slidescale', obj);
    });

    return this;
};

$.slidescale = function (container, options) {
    var ii, imgs, o;

    this.container = container;
    o = this.opts = $.extend({}, $.slidescale.defaults, options);

    this.container.addClass('slidescale')
        .children('ol').addClass('slidescale-list');

    this.images = [];

    this._initImages();

    if (o.images) {
        imgs = o.images;
        for (ii = 0; ii < imgs.length; ii++) {
            this.addImage(imgs[ii]);
        }
    }

    this.curImage = 0;
    this.setImageIndex(o.startingIndex);

};

$.slidescale.defaults = {
    startingIndex: 0                // index of images to start on 
};

$.slidescale.prototype = {

_initImages: function () {
    var that = this;
    this.container.find('ol.slidescale-list > li').each(function () {
        var el = $(this);
        that.addImage({ url: el.find('img').attr('src'),
            text: el.find('caption').text() });
    });
},

/**
 * Take an image hash, img.url, img.text, add to images list
 */
addImage: function (img) {
    this.images.push(img);

    // TODO need to check index and load if needed
},

setImageIndex: function (ii) {
    this.curImage = Math.max(Math.min(this.images.length - 1, ii || 0), 0);

    // TODO all types of crazy effects
}

};

}(jQuery));
