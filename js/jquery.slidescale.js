/**
 * jQuery SlideScale Plugin
 * Copyright 2010, Ziling Zhao
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * @author Ziling Zhao <zilingzhao@gmail.com>
 * @version 0.1
 *
 * TODO Disable selection from double click
 * FIXME centering doesn't seem to be working on stream.html (initially)
 */
(function ($) {

var pathrex = /(?:\/|^)([^\/]+)$/;

function preventDefault(eve) {
    eve.preventDefault();
}

$.fn.slidescale = function (options) {
    this.each(function () {
        var elem = $(this),
            obj = new $.slidescale(elem, options);
        elem.data('slidescale', obj);
    });

    return this;
};

$.slidescale = function (container, options) {
    var ii, imgs, o,
        that = this,
        $this = $(this);

    o = this.opts = $.extend({}, $.slidescale.defaults, options);

    this.container = container
        .addClass('ss')
        .bind('dragstart', preventDefault)
        .bind('selectstart', preventDefault)
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
        .width(o.gallery_width)
        .append('<div class="ss-prev ss-button" />')
        .append('<div class="ss-next ss-button" />')
        .appendTo(container)
        .find('.ss-button').css('opacity', o.opacity);

    if (o.control_fade_speed) {
        setTimeout(function () {
                that.wrapper.find('.ss-button').not('.hover')
                    .animate({ opacity: 0 });
            }, 5000);
    }

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
    var that = this;
    var c = this.container;

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
                var elem = $(this);
                elem.removeClass('hover').stop(true);
                if (that.opts.control_fade_speed) {
                    elem.animate({ opacity: 0 },
                        that.opts.control_fade_speed);
                }
            })
        .delegate('.ss-button', 'mouseenter.ss', function (eve) {
                var elem = $(this);
                elem.addClass('hover').stop(true)
                if (that.opts.control_fade_speed) {
                    elem.animate({ opacity: that.opts.opacity },
                        that.opts.control_fade_speed);
                }
            })

        .delegate('ol li', 'mouseleave.ss', function (eve) {
                var elem = $(this).addClass('hover'), opacity;

                if (elem.hasClass('ss-current')) {
                    return;
                }

                if (elem.parent().hasClass('ss-list')) {
                    elem = elem.children('.ss-trans-bg');
                }
                elem.stop(true).animate({ opacity: that.opts.opacity });
            })
        .delegate('ol li', 'mouseenter.ss', function (eve) {
                var elem = $(this).addClass('hover'), opacity = 1;

                if (elem.hasClass('ss-current')) {
                    return;
                }

                if (elem.parent().hasClass('ss-list')) {
                    elem = elem.children('.ss-trans-bg');
                    opacity = 0;
                }
                elem.stop(true).animate({ opacity: opacity });
            })

        .delegate('.ss-thumb-list li, .ss-list li', 'click.ss', function (eve) {
                that.setImageIndex($(this).prevAll().size());
            })

        .delegate('.ss-list li', 'click.ss', function (eve) {
                var elem = $(this);
                if (!elem.hasClass('ss-centered')) {
                    eve.preventDefault();
                }
            })

        .delegate('.ss-list li', 'unsetCurrent.ss', function (eve) {
                var elem = $(this);
                var scimg = elem.data('ScImage.ss');

                scimg.entry.removeClass('ss-current ss-centered');
                scimg.getThumb().removeClass('ss-current ss-centered');
                if (scimg.caption) {
                    scimg.caption.hide('slide', { direction: "down" }, 'fast');
                }

                scimg.overlay.animate({ opacity: scimg.opacity });
                scimg.getThumb().animate({ opacity: scimg.opacity });
            })

        .delegate('.ss-list li', 'setCurrent.ss', function (eve) {
                var elem = $(this);
                var scimg = elem.data('ScImage.ss');

                scimg.entry.addClass('ss-current');
                scimg.getThumb().addClass('ss-current');

                if (scimg.caption) {
                    scimg.caption.show('slide', { direction: "down" }, 'fast');
                }

                scimg.overlay.animate({ opacity: 0 });
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

    function widthResize() {
        var width = that.list.width() + scimg.entry.outerWidth(true);
        that.list.width(width);
    }

    scimg.loadImage(widthResize);
    this.loadedPhotos.high++;
},

loadThumb: function (scimg) {
    var that = this;
    var thumb = scimg.getThumb();
    var img = thumb.find('img');

    this.thumblist.append(thumb);
    this.loadedThumbs.high++;

    function widthResize() {
        that.thumblist.width(that.thumblist.width() +
            scimg.getThumb().outerWidth(true));
    }

    if (img.get(0).complete) {
        widthResize();
    }

    img.one('load', widthResize);
},

/**
 * Take an image hash, img.url, img.text, add to images list
 */
addImage: function (img) {
    var scimg = new $.slidescale.ScImage(img, {
            photo_dir: this.opts.photo_dir,
            thumb_dir: this.opts.thumb_dir });
    var o = this.opts;
    var that = this;

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

    list.stop(false, true).animate({left: offset}, function () {
                entry.addClass('ss-centered');
            });
},

setImageIndex: function (ii) {
    var scimg, oldscimg, offset, entry, width, loadTop, loadThumbTop;
    var that = this;

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

$.slidescale.ScImage = function ScImage(entry, options) {
    var img;
    $.extend(this, $.slidescale.ScImage.defaults, options || {});
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

        this.entry.append(this.caption);
    }

    this.entry
        .data("ScImage.ss", this);

    this.overlay = $('<a class="ss-trans-bg" />')
        .css('opacity', 1 - this.opacity)
        .appendTo(this.entry);

    if (this.photo_link) {
        this.overlay.attr('href', this.photo_link);
    }

    this.image = undefined;

    if (!this.thumb_path) {
        this.thumb_path = [this.thumb_dir, this.name].join("/");
    }

    if (!this.photo_path) {
        this.photo_path = [this.photo_dir, this.name].join("/");
    }
};

$.slidescale.ScImage.prototype = {
getThumb: function () {
    var thumb_img;
    if (!this.thumb) {
        thumb_img = $('<img />');
        if (this.thumb_load_cb) {
            thumb_img.load(this.thumb_load_cb);
        }
        thumb_img.attr('src', this.thumb_path);

        this.thumb = $('<li />').css('opacity', this.opacity);
        this.thumb.append(thumb_img);
    }
    return this.thumb;
},
getImage: function (onLoad) {
    if (!this.image) {
        this.image = $('<img />', {
                "class": "ss-photo"});
        if (onLoad) {
            this.image.load(onLoad);
        }
        if (this.image_load_cb) {
            this.image.load(this.image_load_cb);
        }
        this.image.attr('src', this.photo_path);
    }
    return this.image;
},
loadImage: function (onLoad) {
    var that = this;
    var img = this.getImage(onLoad);

    this.entry.prepend(img);
    this.entry.addClass('ss-loaded');
}
};


$.slidescale.ScImage.defaults = {
    photo_dir: "./img/photos",
    opacity: 0.5,
    name: undefined,
    thumb_dir: "./img/thumbs",
    photo_link: undefined,
    caption_link: undefined,
    thumb_path: undefined,
    thumb_load_cb: null,
    image_load_cb: null,
    photo_path: undefined
};


$.slidescale.defaults = {
    images: [],
    gallery_height: 300,
    gallery_width: 800,
    opacity: 0.5,
    load_num: 7,
    preload_num: 5,
    load_thumb_num: 10,
    thumb_height: 75,
    startingIndex: 0,   // index of image to start on, XXX doesn't work
    control_fade_speed: 0,
    photo_dir: "./img/photos",
    thumb_dir: "./img/thumbs"
};

}(jQuery));
