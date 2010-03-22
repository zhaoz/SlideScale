/**
 * jquery.slidescale.js
 * @author Ziling Zhao <zilingzhao@gmail.com>
 */
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
        this.caption = entry.find('p').remove();

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
        this.caption = $('<p />').text(this.text);
    }
    this.caption = $('<div class="ss-caption" />').append(this.caption);

    // add transparent box to caption
    $("<div class='ss-trans-bg' />")
        .css('opacity', 0.3)
        .appendTo(this.caption);

    this.added = !!this.entry;
    if (!this.added) {
        this.entry = $('<li />');
    }
    this.entry.append(this.caption);

    this.image = undefined;
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
    var ii, imgs, o, that = this,
        $this = $(this);

    o = this.opts = $.extend({}, $.slidescale.defaults, options);

    this.container = container
        .addClass('ss')
        .width(o.gallery_width);

    $('<div class="ss-wrapper" />').css('opacity', 0.5)
        .appendTo(container);

    this.list = container.children('ol');
    if (!this.list.size()) {
        this.list = $('<ol />').appendTo(container);
    }

    this.wrapper = $('<div class="ss-list-wrapper" />');

    this.list
        .addClass('ss-list')
        .height(o.gallery_height)
        .appendTo(this.wrapper);

    this.wrapper
        .append('<div class="ss-prev ss-button" />')
        .append('<div class="ss-next ss-button" />')
        .appendTo(container)
        .find('.ss-button').css('opacity', 0.5);

    setTimeout(function () {
            that.wrapper.find('.ss-button').not('.hover')
                .animate({ opacity: 0 });
        }, 2000);

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

    this.curImage = -1;
    this.init();

    this.setImageIndex(o.startingIndex);
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
init: function () {
    var that = this,
        c = this.container;

    this.container
        .bind('next.ss', $.proxy(this, 'nextImg'))
        .bind('prev.ss', $.proxy(this, 'prevImg'))
        .delegate('.ss-list-wrapper .ss-next', 'click.ss', function (eve) {
                $(c).trigger('next');
            })
        .delegate('.ss-list-wrapper .ss-prev', 'click.ss', function (eve) {
                $(c).trigger('prev');
            })
        .delegate('.ss-button', 'mouseout.ss', function (eve) {
                $(this).removeClass('hover')
                    .clearQueue().animate({ opacity: 0 });
            })
        .delegate('.ss-button', 'mouseenter.ss', function (eve) {
                $(this).addClass('hover')
                    .clearQueue().animate({ opacity: 0.5 });
            })

        .delegate('.ss-thumb-list li', 'click', function (eve) {
                that.setImageIndex($(this).prevAll().size());
            })
    ;
},

die: function () {
    this.container
        .unbind('.ss')

        // XXX does * worK?
        .undelegate('*', '.ss');
},

_constructBottom: function (thumblist) {
    return $('<div class="ss-bottom" />')
        .append(thumblist)
        .append('<br class="clear" />');
},

_initImages: function () {
    var that = this;
    this.container.find('ol.ss-list > li').each(function () {
            that.addImage($(this));
        });
},

prevImg: function (eve) {
    if (eve) {
        eve.preventDefault();
    }
    this.setImageIndex(this.curImage - 1);
},

nextImg: function (eve) {
    if (eve) {
        eve.preventDefault();
    }
    this.setImageIndex(this.curImage + 1);
},

/**
 * Take an image hash, img.url, img.text, add to images list
 */
addImage: function (img) {
    var scimg = new ScImage(img,
            { photopath: this.photopath, thumbpath: this.thumbpath }),
        bigImg;

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

    // this is wider than it needs to be... we don't care, but it can 
    // probably be optimized.
    this.list.width(this.list.width() + scimg.entry.outerWidth());
    this.thumblist.width(this.thumblist.width() + scimg.thumb.outerWidth());
},

_center: function (container, entry, list) {
    var offset;

    offset = -entry.position().left;
    offset += container.innerWidth() / 2;
    offset -= entry.outerWidth() / 2;

    list.animate({left: offset});
},

setImageIndex: function (ii) {
    var scimg, oldscimg, offset, entry, width;

    oldscimg = this.images[this.curImage];

    ii = Math.max(Math.min(this.images.length - 1, ii || 0), 0);

    if (ii === this.curImage) {     // no change
        return;
    }

    this.curImage = ii;
    scimg = this.images[this.curImage];

    // TODO all types of crazy effects
    if (oldscimg) {
        oldscimg.entry.removeClass('ss-current');
        oldscimg.thumb.removeClass('ss-current');
        oldscimg.caption.hide('slide', { direction: "down" }, 'fast');
    }

    entry = scimg.entry;
    entry.addClass('ss-current');
    scimg.thumb.addClass('ss-current');


    this._center(this.wrapper, entry, this.list);
    this._center(this.bottom, scimg.thumb, this.thumblist);

    // show caption
    scimg.caption.show('slide', { direction: "down" }, 'fast');
}

};

}(jQuery));
