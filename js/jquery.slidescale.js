(function ($) {

var pathrex = /(?:\/|^)([^\/]+)$/;

$.fn.slidescale = function (options) {
    this.each(function () {
        var elem = $(this),
            obj = new $.slidescale(elem, options);
        elem.data('slidescale', obj);
    });

    return this;
};

function ScImage(entry, options) {
    var img;
    if ($.isPlainObject(entry)) {
        options = entry;
        entry = null;
    } else {
        img = entry.find('img').remove();
        this.thumb = $('<li />', { html: img });
        this.caption = entry.find('p');

        this.name = img.attr('src').match(pathrex)[1];
        this.entry = entry;
    }
    $.extend(this, options || {}, ScImage.defaults);

    if (!this.thumb) {
        this.thumb = $('<li />', {
            html: $('<img />', { src: [this.thumbpath, this.name].join("/") })
        });
    }
    if (!this.caption) {
        this.caption = $('<p class="ss-caption"/>').text(this.text);
    }

    this.added = !!this.entry;
    if (!this.added) {
        this.entry = $('<li />').append(this.caption);
    }

    this.image = null;
}

ScImage.prototype = {
getImage: function () {
    this.image = $('<img />', { "class": "ss-photo",
            src: [this.photopath, this.name].join("/") });
    return this.image;
}
};

ScImage.defaults = {
    photopath: "./img/photos",
    thumbpath: "./img/thumbs"
};

$.slidescale = function (container, options) {
    var ii, imgs, o, wrapper,
        $this = $(this);

    o = this.opts = $.extend({}, $.slidescale.defaults, options);

    this.container = container
        .addClass('ss')
        .width(o.gallery_width);
    this.list = container.children('ol');
    if (!this.list.size()) {
        this.list = $('<ol />').appendTo(container);
    }

    wrapper = $('<div class="ss-list-wrapper" />');

    this.list
        .addClass('ss-list')
        .height(o.gallery_height)
        .appendTo(wrapper);

    wrapper
        .append('<div class="ss-prev ss-button">&lt;</div>')
        .append('<div class="ss-next ss-button">&gt;</div>')
        .appendTo(container);

    this.thumblist = $("<ol />", { "class": "ss-thumb-list" });

    this.bottom = this._constructBottom(this.thumblist)
        .appendTo(this.container).height(o.thumb_height);

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
    gallery_height: 300,
    gallery_width: 800,
    thumb_height: 75,
    startingIndex: 0,                // index of images to start on 
    photopath: "./img/photos",
    thumbpath: "./img/thumbs"
};

$.slidescale.prototype = {
_constructBottom: function (thumblist) {
    return $('<div class="ss-bottom" />')
        .append('<div class="ss-prev ss-button">&lt;</div>')
        .append(thumblist)
        .append('<div class="ss-next ss-button">&gt;</div>')
        .append('<br class="clear" />');
},

_initImages: function () {
    var that = this;
    this.container.find('ol.ss-list > li').each(function () {
            that.addImage($(this));
        })
        .find("p").addClass('ss-caption');
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
    var scimg = new ScImage(img), bigImg;
    this.images.push(scimg);

    if (!scimg.added) {
        this.list.append(scimg.entry);
    }

    this.thumblist.append(scimg.thumb);

    // TODO need to check index and load if needed
    if (!scimg.image) {
        bigImg = scimg.getImage();
        scimg.entry.append(bigImg);
    }
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
