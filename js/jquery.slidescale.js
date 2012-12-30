/**
 * jQuery SlideScale Plugin
 * Copyright 2010, Ziling Zhao
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * @author Ziling Zhao <zilingzhao@gmail.com>
 * @version 0.3
 *
 * FIXME centering doesn't seem to be working on stream.html (initially)
 * FIXME weird chrome opacity bug causing pixel shift to the right on transitions.
 * TODO Canvas image resize with data url for images? May improve performance.
 */
(function ($) {

var pathrex = /(?:\/|^)([^\/]+)$/;

// from MDN. Modified.
function cssTransitionsEnabled() {
  var domPrefixes = 'Webkit Moz O ms Khtml'.split(' ');
  var elm = $('<div />').get(0);
   
  if (elm.style.animationName) {
    return true;
  }
   
  for (var ii=0; ii < domPrefixes.length; ii++ ) {
    if (elm.style[ domPrefixes[ii] + 'AnimationName'] !== undefined) {
      return true;
    }
  }
  return false;
}

var CSS_TRANSITIONS_ENABLED = cssTransitionsEnabled();


function preventDefault(eve) {
  eve.preventDefault();
}

$.fn.slidescale = function (options) {
  this.each(function (ii, elem) {
    var elem = $(elem);
    var obj = new $.slidescale(elem, options);
    elem.data('slidescale', obj);
  });

  return this;
};

$.slidescale = function (container, options) {
  this.opts = $.extend({}, $.slidescale.defaults, options);

  this.images = [];

  this.loadedPhotos = {
    bottom: 0,
    high: 0
  };
  this.loadedThumbs = {
    bottom: 0,
    high: 0
  };

  this.container = container
    .addClass('ss')
    .bind('dragstart', preventDefault)
    .bind('selectstart', preventDefault);

  this.list = container.children('ol');
  if (!this.list.size()) {
    this.list = $('<ol />').appendTo(container);
  }

  this.wrapper = $('<div class="ss-list-wrapper" />');

  // list needs to be whatever the thumb height is subtracted from the
  // container height
  this.list
    .addClass('ss-list ss-image-list')
    .appendTo(this.wrapper);

  this.wrapper
    .append('<div class="ss-prev ss-button" />')
    .append('<div class="ss-next ss-button" />')
    .appendTo(container);

  if (!this.opts.css_transitions) {
    this._default_opacity = this.list.find('.ss-button').css('opacity');

    if (this.opts.control_fade_speed) {
      setTimeout($.proxy(function () {
        this.wrapper.find('.ss-button').not('.hover')
        .animate({ opacity: 0 });
      }, this), 5000);
    }
  } else {
    setTimeout($.proxy(function () {
      this.wrapper.find('.ss-button').addClass('ss-ready');
    }, this), 5000);
  }

  this.thumblist = $("<ol />", { "class": "ss-thumb-list ss-image-list" });

  this.bottom = this._constructBottom(this.thumblist)
    .appendTo(this.container).height(this.opts.thumb_height);

  this.curImage = -1;

  this._initImages();

  if (this.opts.images) {
    var imgs = this.opts.images;
    for (var ii = 0; ii < imgs.length; ii++) {
      this.addImage(imgs[ii]);
    }
  }

  this.init();

  // startingIndex only makes sense if we have that to start on
  if (this.images.length > this.opts.startingIndex) {
    // set imageindex after image has loaded
    this.images[this.opts.startingIndex].entry.find('img').one('load',
        $.proxy(function () {
          this.setImageIndex(this.opts.startingIndex);
        }, this));
  }

  this._resizeList();
  this.container.addClass('ready');
};

$.slidescale.prototype = {
init: function () {

  this.container
    .bind('next.ss', $.proxy(this.nextImg, this))
    .bind('prev.ss', $.proxy(this.prevImg, this))
    .delegate('.ss-list-wrapper .ss-next', 'click.ss',
        $.proxy(function (eve) {
          this.container.trigger('next');
        }, this))
    .delegate('.ss-list-wrapper .ss-prev', 'click.ss',
        $.proxy(function (eve) {
          this.container.trigger('prev');
        }, this))
    .delegate('.ss-image-list li', 'click.ss',
        $.proxy(function (eve) {
          var elem = $(eve.currentTarget);
          this.setImageIndex(elem.prevAll().size());
          if (!elem.hasClass('ss-centered')) {
            eve.preventDefault();
          }
        }, this))
    .delegate('.ss-list li', 'unsetCurrent.ss', $.proxy(function (eve) {
      var elem = $(eve.currentTarget);
      var scimg = elem.data('ScImage.ss');

      scimg.entry.removeClass('ss-current ss-centered');
      scimg.getThumb().removeClass('ss-current ss-centered');
      if (scimg.caption) {
        scimg.caption.hide('slide', { direction: "down" }, 'fast');
      }

      if (!this.opts.css_transitions) {
        scimg.entry.animate({ opacity: scimg.opacity });
        scimg.getThumb().animate({ opacity: scimg.opacity });
      }
    }, this))

    .delegate('.ss-list li', 'setCurrent.ss', $.proxy(function (eve) {
      var elem = $(eve.currentTarget);
      var scimg = elem.data('ScImage.ss');

      scimg.entry.addClass('ss-current');
      scimg.getThumb().addClass('ss-current');

      if (scimg.caption) {
        scimg.caption.show('slide', { direction: "down" }, 'fast');
      }

      if (!this.opts.css_transitions) {
        scimg.entry.animate({ opacity: 0 });
        scimg.getThumb().animate({ opacity: 1 });
      }
    }, this))
  ;

  if (!this.opts.css_transitions) {
    this.container
      .delegate('.ss-button', 'mouseout.ss', $.proxy(function (eve) {
        var elem = $(eve.currentTarget);
        elem.removeClass('hover').stop(true);
        if (this.opts.control_fade_speed) {
          elem.animate({ opacity: 0 },
            this.opts.control_fade_speed);
        }
      }, this))
    .delegate('.ss-button', 'mouseenter.ss', $.proxy(function (eve) {
      var elem = $(eve.currentTarget);
      elem.addClass('hover').stop(true)
      if (this.opts.control_fade_speed) {
        elem.animate({ opacity: this._default_opacity },
          this.opts.control_fade_speed);
      }
    }, this))
    .delegate('ol li', 'mouseleave.ss', $.proxy(function (eve) {
      var elem = $(eve.currentTarget).addClass('hover');

      if (elem.hasClass('ss-current')) {
        return;
      }

      if (elem.parent().hasClass('ss-list')) {
        elem = elem.children('.ss-trans-bg');
      }
      elem.stop(true).animate({ opacity: this._default_opacity });
    }, this))
    .delegate('ol li', 'mouseenter.ss', function (eve) {
      var elem = $(eve.currentTarget).addClass('hover');

      if (elem.hasClass('ss-current')) {
        return;
      }

      var opacity = 1;

      if (elem.parent().hasClass('ss-list')) {
        elem = elem.children('.ss-trans-bg');
        opacity = 0;
      }
      elem.stop(true).animate({ opacity: opacity });
    });
  }

  this.list.on('transitionend MSTransitionEnd webkitTransitionEnd oTransitionEnd',
      $.proxy(function(eve) {
        // set centered class on curImate
        var scimg = this.images[this.curImage];
        scimg.entry.addClass('ss-centered');
        scimg.getThumb().addClass('ss-centered');
      }, this));

  $(window)
    .resize($.proxy(this._onResize, this))
    .bind('webkitfullscreen mozfullscreen fullscreen', $.proxy(this._onResize, this));
  ;
},

die: function () {
  this.container
    .unbind('.ss')
    .undelegate('*', '.ss');
},

/**
 * Recenter both the top image and the thumbnail list.
 */
_recenter: function() {
  var scimg = this.images[this.curImage];
  this._center(this.wrapper, scimg.entry, this.list);
  this._center(this.bottom, scimg.getThumb(), this.thumblist);
},

_resizeList: function() {
  var height = this.container.height() - this.opts.thumb_height;
  var margins = this.wrapper.outerHeight(true) - this.wrapper.height();
  this.list.height(height - margins);
},

_onResize: function() {
  this._resizeList();
  this.list.children().each(function(ii, elem) {
    var elem = $(elem);
    var scimg = elem.data('ScImage.ss');
    scimg.resize();
  });

  // recenter everything.
  this._recenter();
},

_constructBottom: function (thumblist) {
  return $('<div class="ss-bottom" />')
    .append(thumblist)
    .append('<br class="clear" />');
},

_initImages: function () {
  this.container.find('ol.ss-list > li').remove().each(
      $.proxy(function (ii, elem) {
        this.addImage($(elem));
      }, this));
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

_recalculateWidthAndHeight: function() {
  // wiggle all the images, to make sure they resize. This is a work around
  // for a chrome bug.
  var images = this.list.find('img');

  // XXX Holy crap this sucks. Since max-height is not being honored as
  // expected on full screen, we have to rejigger everything.
  // TODO img container's are not being touched, their width's are not
  // changing and may need some resizing.
  // TODO if this is required, maybe animationrequestframe is better.
  setTimeout(
      $.proxy(function() {
        images.css({ 'max-height': 'none', 'max-width': 'none' });
        setTimeout(
          $.proxy(function() {
            images.css({ 'max-height': '100%', 'max-width': '100%' });
          }, this), 20);
      }, this), 20);
},

loadEntry: function (scimg) {
  scimg.loadImage();
  this.loadedPhotos.high++;
},

loadThumb: function (scimg) {
  var thumb = scimg.getThumb();
  var img = thumb.find('img');

  this.thumblist.append(thumb);
  this.loadedThumbs.high++;
},

/**
 * Take an image hash, img.url, img.text, add to images list
 */
addImage: function (img) {
  var scimg = new $.slidescale.ScImage(img,
      { photo_dir: this.opts.photo_dir,
        thumb_dir: this.opts.thumb_dir });

  this.images.push(scimg);

  this.list.append(scimg.entry);

  if (this.images.length - 1 < this.curImage + this.opts.load_thumb_num) {
    this.loadThumb(scimg);
  }

  if (this.images.length - 1 < this.curImage + this.opts.load_num) {
    this.loadEntry(scimg);
  }

  scimg.added = true;
},

_center: function (container, entry, list) {
  var offset;

  offset = -entry.position().left;
  offset += container.innerWidth() / 2;
  offset -= entry.outerWidth() / 2;

  if (this.opts.css_transitions) {
    list.css('left', offset);
  } else {
    list.stop(false, true).animate({left: offset}, function () {
      entry.addClass('ss-centered');
    });
  }
},

setImageIndex: function (ii) {
  var scimg, oldscimg, offset, entry, width, loadTop, loadThumbTop;

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
    this.list.queue($.proxy(function (n) {
      var ii;
      for (ii = this.loadedPhotos.high; ii < loadTop; ii++) {
        this.loadEntry(this.images[ii]);
      }
      n();
    }, this));
  }

  this._center(this.bottom, scimg.getThumb(), this.thumblist);
  loadThumbTop = Math.min(this.curImage + this.opts.load_thumb_num +
      this.opts.preload_num, this.images.length);
  if (loadThumbTop > this.loadedThumbs.high) {
    this.thumblist.queue($.proxy(function (n) {
      var ii;
      for (ii = this.loadedThumbs.high; ii < loadThumbTop; ii++) {
        this.loadThumb(this.images[ii]);
      }
      n();
    }, this));
  }
},

/**
 * go full screen, unles we can't. Then do nothing.
 */
makeFullScreen: function() {
  var containerElement = this.container.get(0);
  var fNames = ['requestFullScreen', 'webkitRequestFullScreen',
      'mozRequestFullScreen'];

  for (var ii = 0; ii < fNames.length; ++ii) {
    var fName = fNames[ii];
    if (containerElement[fName]) {
      containerElement[fName]();
      this._recalculateWidthAndHeight();
      return;
    }
  }
}

};

$.slidescale.ScImage = function ScImage(entry, options) {
  var img = null;
  $.extend(this, $.slidescale.ScImage.defaults, options || {});

  this.naturalHeight = 0;
  this.naturalWidth = 0;
  this.naturalThumbHeight = 0;
  this.naturalThumbWidth = 0;

  if (entry instanceof jQuery) {
    img = entry.find('img').remove();
    this.thumb = $('<li />', { html: img })
      if (!this.css_transitions) {
        this.thumb.css('opacity', this.opacity);
      }
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

  this.entry
    .data("ScImage.ss", this);

  this.overlay = $('<div class="ss-image-overlay" />')
    .appendTo(this.entry);

  this.linkOverlay = $('<a class="ss-trans-bg" />');
  if (!this.css_transitions) {
    this.linkOverlay.css('opacity', 1 - this.opacity)
  }
  this.linkOverlay.appendTo(this.overlay);

  if (this.photo_link) {
    this.linkOverlay.attr('href', this.photo_link);
  }

  if (this.caption) {
    this.caption = $('<div class="ss-caption" />').append(this.caption);

    if (this.caption_link) {
      this.caption.wrapInner($('<a />', { href: this.caption_link }));
    }

    // add transparent box to caption
    $("<div class='ss-trans-bg' />")
      .prependTo(this.caption);

    this.overlay.append(this.caption);
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
  var thumbImg;
  if (!this.thumb) {
    thumbImg = $('<img />');

    var deferred = new $.Deferred();
    if (this.thumb_load_cb) {
      deferred.done(this.thumb_load_cb);
    }

    thumbImg.load($.proxy(function(eve) {
      this.naturalThumbWidth = thumbImg.width;
      this.naturalThumbHeight = thumbImg.height;
      deferred.resolve(thumbImg);
    }, this));

    thumbImg.attr('src', this.thumb_path);

    this.thumb = $('<li />');
    if (!this.css_transitions) {
      this.thumb.css('opacity', this.opacity);
    }
    this.thumb.append(thumbImg);
  }
  return this.thumb;
},
_getImage: function(deferred) {
  if (!this.image) {
    this.image = $('<img />');
    if (deferred) {
      this.image.load($.proxy(function(eve) {
        deferred.resolve(this.image);
      }, this));
    }
    if (this.image_load_cb) {
      this.image.load(this.image_load_cb);
    }
    this.image.attr('src', this.photo_path);
  }
  return this.image;
},
/**
 * @return {$.Deferred} called when image is loaded.
 */
loadImage: function() {
  var loaded = new $.Deferred();
  var img = this._getImage(loaded);

  loaded.done($.proxy(function() {
    var imgElement = img.get(0);
    this.naturalHeight = imgElement.naturalHeight || imgElement.height;
    this.naturalWidth = imgElement.naturalWidth || imgElement.width;
    img.addClass('ss-photo');
    this.entry.addClass('ss-loaded');

    this.resize();
  }, this));

  this.entry.prepend(img);

  return loaded;
},
/**
 * Resize things inside of the element.
 * TODO can this be done without js?
 */
resize: function() {
  this.image.position({of: this.entry});

  this.overlay.height(this.image.height());
  this.overlay.width(this.image.width());
  this.overlay.position({of: this.entry});
}
};


$.slidescale.ScImage.defaults = {
  css_transitions: CSS_TRANSITIONS_ENABLED,
  opacity: 0.5,
  photo_dir: "./img/photos",
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
  opacity: 0.5,
  load_num: 7,
  preload_num: 5,
  load_thumb_num: 10,
  thumb_height: 75,
  startingIndex: 0,   // index of image to start on, XXX doesn't work
  control_fade_speed: 800,
  css_transitions: CSS_TRANSITIONS_ENABLED,
  photo_dir: "./img/photos",
  thumb_dir: "./img/thumbs"
};

}(jQuery));
