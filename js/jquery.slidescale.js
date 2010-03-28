/**
 * jquery.slidescale.js
 * @author Ziling Zhao <zilingzhao@gmail.com>
 *
 * FIXME IE8 Transparency currenty totally borked
 * TODO incremental photo loading
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
    $.extend(this, ScImage.defaults, options || {});
    if (entry instanceof jQuery) {
        img = entry.find('img').remove();
        this.thumb = $('<li />', { html: img }).css('opacity', this.opacity);
        this.caption = entry.find('p').remove();

        this.name = img.attr('src').match(pathrex)[1];
        this.entry = entry;
    } else {
        options = $.extend(this, entry);
        entry = null;
    }

    if (typeof(this.text) !== "string") {
        this.text = "";
    }

    if (this.text && !this.caption) {
        this.caption = $('<p />').text(this.text);
    }

    this.added = !!this.entry;
    if (!this.added) {
        this.entry = $('<li />');
    }

    if (this.caption) {
        this.caption = $('<div class="ss-caption" />').append(this.caption);

        if (this.caption_link) {
            this.caption.wrapInner($('<a />', { href: this.caption_link }));
        }

        // add transparent box to caption
        $("<div class='ss-trans-bg' />")
            .prependTo(this.caption);

        this.entry.append(this.caption)
    }

    this.entry
        .css('opacity', this.opacity)
        .data("ScImage.ss", this);

    this.image = undefined;
}

ScImage.prototype = {
getThumb: function () {
    if (!this.thumb) {
        this.thumb = $('<li />', {
            html: $('<img />', {
                src: this.thumb_path ? this.thumb_path :
                    [this.thumb_dir, this.name].join("/")
            })
        }).css('opacity', this.opacity);
    }
    return this.thumb;
},
getImage: function () {
    if (!this.image) {
        this.image = $('<img />', { "class": "ss-photo",
                src: this.photo_path ? this.photo_path :
                    [this.photo_dir, this.name].join("/") });
    }
    return this.image;
},
loadImage: function () {
    var that = this,
        img = this.getImage();

    this.entry.prepend(img);
    this.entry.addClass('ss-loaded');
}
};

$.slidescale = function (container, options) {
    var ii, imgs, o, that = this,
        $this = $(this);

    o = this.opts = $.extend({}, $.slidescale.defaults, options);

    this.container = container
        .addClass('ss')
        .width(o.gallery_width);

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
        .find('.ss-button').css('opacity', o.opacity);

    setTimeout(function () {
            that.wrapper.find('.ss-button').not('.hover')
                .animate({ opacity: 0 });
        }, 5000);

    this.thumblist = $("<ol />", { "class": "ss-thumb-list" });

    this.bottom = this._constructBottom(this.thumblist)
        .appendTo(this.container).height(o.thumb_height);

    this.images = [];

    this.loadedPhotos = {
        low: 0,
        high: 0
    };
    this.loadedThumbs = {
        low: 0,
        high: 0
    };

    this.curImage = -1;

    this._initImages();

    if (o.images) {
        imgs = o.images;
        for (ii = 0; ii < imgs.length; ii++) {
            this.addImage(imgs[ii]);
        }
    }

    this.init();

    // startingINdex only makes sense if we have that to start on
    if (this.images.length > o.startingIndex) {
        // set imageindex after image has loaded
        this.images[o.startingIndex].entry.find('img').one('load', function () {
                that.setImageIndex(o.startingIndex);
            });
    }
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
                    .clearQueue().animate({ opacity: that.opts.opacity });
            })

        .delegate('ol li', 'mouseleave.ss', function (eve) {
                var elem = $(this).addClass('hover');

                if (elem.hasClass('ss-current')) {
                    return;
                }

                elem.clearQueue().animate({ opacity: that.opts.opacity });
            })
        .delegate('ol li', 'mouseenter.ss', function (eve) {
                var elem = $(this).addClass('hover');

                if (elem.hasClass('ss-current')) {
                    return;
                }

                elem.clearQueue().animate({ opacity: 1 });
            })

        .delegate('.ss-thumb-list li, .ss-list li', 'click.ss', function (eve) {
                that.setImageIndex($(this).prevAll().size());
            })

        .delegate('.ss-list li', 'click.ss', function (eve) {
                var elem = $(this), scimg;
                if (elem.hasClass('ss-centered')) {
                    elem.trigger('changeLocation');
                }
            })
        .delegate('.ss-list li', 'changeLocation.ss', function (eve) {
                var scimg = $(this).data('ScImage.ss');
                if (scimg.photo_link) {
                    location.href = scimg.photo_link;
                }
            })

        .delegate('.ss-list li', 'unsetCurrent.ss', function (eve) {
                var elem = $(this),
                    scimg = elem.data('ScImage.ss');

                scimg.entry.removeClass('ss-current ss-centered');
                scimg.getThumb().removeClass('ss-current ss-centered');
                if (scimg.caption) {
                    scimg.caption.hide('slide', { direction: "down" }, 'fast');
                }

                scimg.entry.animate({ opacity: scimg.opacity });
                scimg.getThumb().animate({ opacity: scimg.opacity });
            })

        .delegate('.ss-list li', 'setCurrent.ss', function (eve) {
                var elem = $(this),
                    scimg = elem.data('ScImage.ss');

                scimg.entry.addClass('ss-current');
                scimg.getThumb().addClass('ss-current');

                if (scimg.caption) {
                    scimg.caption.show('slide', { direction: "down" }, 'fast');
                }

                scimg.entry.animate({ opacity: 1 });
                scimg.getThumb().animate({ opacity: 1 });
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
    this.container.find('ol.ss-list > li').remove().each(function () {
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

loadEntry: function (scimg) {
    var that = this;

    scimg.loadImage();
    scimg.image.one('load', function () {
        that.list.width(that.list.width() +
            scimg.entry.outerWidth(true));
    });

    this.loadedPhotos.high++;
},

loadThumb: function (scimg) {
    var that = this, 
        thumb = scimg.getThumb();

    this.thumblist.append(thumb);
    this.loadedThumbs.high++;

    thumb.find('img').one('load', function () {
        that.thumblist.width(that.thumblist.width() +
            scimg.getThumb().outerWidth(true));
    });
},

/**
 * Take an image hash, img.url, img.text, add to images list
 */
addImage: function (img) {
    var scimg = new ScImage(img, {
            photo_dir: this.opts.photo_dir,
            thumb_dir: this.opts.thumb_dir }),
        o = this.opts,
        that = this;

    this.images.push(scimg);

    this.list.append(scimg.entry);

    if (this.images.length - 1 < this.curImage + o.load_thumb_num) {
        this.loadThumb(scimg);
    }

    if (this.images.length - 1 < this.curImage + o.load_num) {
        this.loadEntry(scimg);
    }

    scimg.added = true;
},

_center: function (container, entry, list) {
    var offset;

    offset = -entry.position().left;
    offset += container.innerWidth() / 2;
    offset -= entry.outerWidth() / 2;

    list.clearQueue().animate({left: offset}, function () {
                entry.addClass('ss-centered');
            });
},

setImageIndex: function (ii) {
    var scimg, oldscimg, offset, entry, width, loadTop, loadThumbTop,
        that = this;

    ii = Math.max(Math.min(this.images.length - 1, ii || 0), 0);

    if (ii === this.curImage) {     // no change
        return;
    }

    this.curImage = ii;
    scimg = this.images[this.curImage];

    oldscimg = this.list.find('.ss-current').trigger('unsetCurrent');
    scimg.entry.trigger('setCurrent');


    this._center(this.wrapper, scimg.entry, this.list);
    loadTop = Math.min(this.curImage + this.opts.load_num +
            this.opts.preload_num, this.images.length);
    if (loadTop > this.loadedPhotos.high) {
        this.list.queue(function (n) {
            var ii;
            for (ii = that.loadedPhotos.high; ii < loadTop; ii++) {
                that.loadEntry(that.images[ii]);
            }
            n();
        });
    }

    this._center(this.bottom, scimg.getThumb(), this.thumblist);
    loadThumbTop = Math.min(this.curImage + this.opts.load_thumb_num +
            this.opts.preload_num, this.images.length);
    if (loadThumbTop > this.loadedThumbs.high) {
        this.thumblist.queue(function (n) {
            var ii;
            for (ii = that.loadedThumbs.high; ii < loadThumbTop; ii++) {
                that.loadThumb(that.images[ii]);
            }
            n();
        });
    }
}

};

ScImage.defaults = {
    photo_dir: "./img/photos",
    opacity: 0.5,
    thumb_dir: "./img/thumbs",
    photo_link: undefined,
    caption_link: undefined,
    thumb_path: undefined,
    photo_path: undefined
};


$.slidescale.defaults = {
    gallery_height: 300,
    gallery_width: 800,
    opacity: 0.5,
    load_num: 7,
    preload_num: 5,
    load_thumb_num: 10,
    thumb_height: 75,
    startingIndex: 0,                // index of images to start on
    photo_dir: "./img/photos",
    thumb_dir: "./img/thumbs"
};

}(jQuery));
