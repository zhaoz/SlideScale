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
        this.thumb = entry.find('img').remove();
        this.caption = entry.find('p');

        this.name = this.thumb.attr('src').match(pathrex)[1];
        this.entry = entry;
    }
    $.extend(this, options || {}, ScImage.defaults);

    if (!this.thumb) {
        this.thumb = $('<img />', {
                    src: [this.thumbpath, this.img].join("/")
                });
    }
    if (!this.caption) {
        this.caption = $('<p />').text(this.text);
    }

    this.added = !!this.entry;
    if (!this.added) {
        this.entry = $('<li />').append(this.caption);
        console.log(this.entry);
    }
}

ScImage.defaults = {
    photopath: "./img/photos",
    thumbpath: "./img/thumbs"
};

$.slidescale = function (container, options) {
    var ii, imgs, o,
        $this = $(this);

    this.container = container;
    this.list = this.container.children('ol');
    o = this.opts = $.extend({}, $.slidescale.defaults, options);

    this.thumblist = $("<ol />", { "class": "ss-thumb-list" })
        .appendTo(this.container);

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

    $(this)
        .bind('next', $.proxy(this, this.nextImg))
        .bind('prev', $.proxy(this, this.prevImg));
};

$.slidescale.defaults = {
    startingIndex: 0,                // index of images to start on 
    photopath: "./img/photos",
    thumbpath: "./img/thumbs"
};

$.slidescale.prototype = {

_initImages: function () {
    var that = this;
    this.container.find('ol.ss-list > li').each(function () {
        that.addImage($(this));
    });
},

prevImg: function (eve) {
    eve.preventDefault();
    this.setImageIndex(this.curImage - 1);
},

nextImg: function (eve) {
    eve.preventDefault();
    this.setImageIndex(this.curImage + 1);
},

/**
 * Take an image hash, img.url, img.text, add to images list
 */
addImage: function (img) {
    var scimg = new ScImage(img);
    this.images.push(scimg);

    if (!scimg.added) {
        console.info(scimg.entry);
        this.list.append(scimg.entry);
    }

    this.thumblist.append(scimg.thumb);

    // TODO need to check index and load if needed
},

setImageIndex: function (ii) {
    var scimg, oldscimg;

    oldscimg = this.images[this.curImage];

    ii = Math.max(Math.min(this.images.length - 1, ii || 0), 0);

    if (ii === this.curImage) {     // no change
        return;
    }

    this.curImage = ii;
    scimg = this.images[this.curImage];

    // TODO all types of crazy effects
    oldscimg.entry.removeClass('ss-current');
    scimg.entry.addClass('ss-current');
}

};

}(jQuery));
