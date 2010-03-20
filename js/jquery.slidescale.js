(function ($) {

var pathrex = /\/([^\/])*$/;

$.fn.slidescale = function (options) {
    this.each(function () {
        var elem = $(this),
            obj = new $.slidescale(elem, options);
        elem.data('slidescale', obj);
    });

    return this;
};

function ScImage(entry, options) {
    if ($.isPlainObject(entry)) {
        options = entry;
        entry = null;
    } else {
        this.thumb = entry.find('img');
        this.caption = entry.find('caption');

        this.name = this.thumb.attr('src').match(pathrex)[1];
        this.entry = entry;
    }
    $.extend(this, options || {}, ScImage.defaults);

    if (!this.entry) {
        this.entry = $('<li></li>');
    }

    if (this.entry.hasClass('ss-current')) {
    }
}

$.slidescale = function (container, options) {
    var ii, imgs, o;

    this.container = container;
    o = this.opts = $.extend({}, $.slidescale.defaults, options);

    this.container.addClass('ss')
        .children('ol').addClass('ss-list');

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
    startingIndex: 0,                // index of images to start on 
    photos: "./img/photos",
    thumbs: "./img/thumbs"
};

$.slidescale.prototype = {

_initImages: function () {
    var that = this;
    this.container.find('ol.ss-list > li').each(function () {
        that.addImage($(this));
    });
},

/**
 * Take an image hash, img.url, img.text, add to images list
 */
addImage: function (img) {
    this.images.push(new ScImage(img));

    // TODO need to check index and load if needed
},

setImageIndex: function (ii) {
    var scimg, oldscimg;

    oldscimg = this.images[this.curImage];

    this.curImage = Math.max(Math.min(this.images.length - 1, ii || 0), 0);

    scimg = this.images[this.curImage];

    oldscimg.entry.removeClass('ss-current');
    scimg.entry.addClass('ss-current');

    // TODO all types of crazy effects
}

};

}(jQuery));
