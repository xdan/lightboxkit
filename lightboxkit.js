/*global Image*/
(function (global, factory) {
    "use strict";

    if (typeof module === "object" && typeof module.exports === "object") {
        if (global.document) {
            module.exports = factory(global, true);
        } else {
            module.exports = function (w) {
                if (!w.document) {
                    throw new Error("Lightbox requires a window with a document");
                }
                return factory(w);
            };
        }
    } else {
        factory(global);
    }
}(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
    'use strict';
    var sfx = 'lightboxkit-',
        defaultOptions = {
            showTitle: true
        },
        box,
        dialog,
        image,
        spinner,
        content,
        closer,
        caption,
        lightboxkit,
        width = 800,
        height = 600,
        next,
        prev,

        groups = {},
        group,
        currentInGroup,

        iopen = false,
        timer,
        animate = function (element, key, from, to, duration) {
            var start = new Date().getTime(),
                delta = function (progress) {
                    return progress;
                },
                callee = function () {
                    var now = (new Date().getTime()) - start,
                        progress = now / duration,
                        result = (to - from) * delta(progress) + from;

                    element.style[key] = result;

                    if (progress < 1) {
                        timer = setTimeout(callee, 10);
                    }
                };
 
            clearTimeout(timer);
            timer = setTimeout(callee, 10);
        },
        ready = function (callback) {
            var fired = false,
                handler = function () {
                    if (!fired) {
                        fired = true;
                        callback();
                    }
                },
                readyStateChange = function () {
                    if (document.readyState === "complete") {
                        handler();
                    }
                };

            if (document.readyState === "complete") {
                setTimeout(handler, 1);
            } else if (document.addEventListener) {
                document.addEventListener("DOMContentLoaded", handler, false);
                window.addEventListener("load", handler, false);
            } else {
                document.attachEvent("onreadystatechange", readyStateChange);
                window.attachEvent("onload", handler);
            }
        },

        extend = function () {
            var i, k, new_options = {}, keys;
            for (i = 0; i < arguments.length; i += 1) {
                if (typeof arguments[i] === 'object') {
                    keys = Object.keys(arguments[i]);
                    for (k = 0; k < keys.length; k += 1) {
                        new_options[keys[k]] = arguments[i][keys[k]];
                    }
                }
            }
            return new_options;
        },

        find = function (el, selector) {
            return el.querySelectorAll ? Array.prototype.slice.call(el.querySelectorAll(selector) || []) : [];
        },

        hasClass = function (el, className) {
            if (el.classList) {
                return el.classList.contains(className);
            }
            return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
        },

        addClass = function (el, className) {
            if (el.classList) {
                el.classList.add(className);
            } else if (!hasClass(el, className)) {
                el.className += " " + className;
            }
        },

        removeClass = function (el, className) {
            if (el.classList) {
                el.classList.remove(className);
            } else if (hasClass(el, className)) {
                var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
                el.className = el.className.replace(reg, ' ');
            }
        },

        close = function (e) {
            removeClass(box, sfx + 'open');
            removeClass(document.body, sfx + 'modal-page');
            setTimeout(function () {
                box.style.display = 'none';
            }, 100);
            iopen = false;
            e.preventDefault();
        },

        vsize = function () {
            var w = window,
                d = document,
                e = d.documentElement,
                g = d.getElementsByTagName('body')[0],
                x = e.clientWidth || w.innerWidth || g.clientWidth,
                y = e.clientHeight || w.innerHeight || g.clientHeight;

            return {
                width: x - 46,
                height: y - 46
            };
        },

        calcSize = function () {
            if (!iopen) {
                return;
            }

            var ws = vsize(),
                w = width,
                h = height,
                top = 0,
                ratio =  width / height;

            if (w > ws.width || h > ws.height) {
                if (ratio > 1) {
                    w = ws.width;
                    h = w / ratio;
                    if (h > ws.height) {
                        h = ws.height;
                        w = h * ratio;
                    } else {
                        top = (ws.height - h) / 2;
                    }
                } else {
                    h = ws.height;
                    w = h * ratio;
                    if (w > ws.width) {
                        w = ws.width;
                        h = w / ratio;
                    }
                }
            }

            if (h < ws.height) {
                top = (ws.height - h) / 2;
            }

            dialog.style.top = parseInt(top, 10) + 'px';
            dialog.style.width = parseInt(w, 10) + 'px';
            dialog.style.height = parseInt(h, 10) + 'px';
        },

        loadImage = function (url, callback) {
            var native = new Image(),
                fired = false,
                onload = function () {
                    if (!fired) {
                        fired = true;
                        addClass(spinner, sfx + 'hidden');
                        animate(content, 'opacity', 0, 1, 300);
                        callback(native.naturalWidth, native.naturalHeight);
                    }
                };

            removeClass(spinner, sfx + 'hidden');
            animate(content, 'opacity', 1, 0, 300);

            native.setAttribute('src', url);

            native.addEventListener('load', onload);

            if (native.complete) {
                onload();
            }
        },

        toggleNavigation = function () {
            if (group !== undefined && groups[group] && groups[group].length > 1) {
                removeClass(next, sfx + 'hidden');
                removeClass(prev, sfx + 'hidden');
            } else {
                addClass(next, sfx + 'hidden');
                addClass(prev, sfx + 'hidden');
            }
        },

        loadContent = function (elm) {
            if (elm.options && elm.options.showTitle) {
                caption.innerText = elm.options.title || elm.getAttribute('title');
                caption.style.display = 'block';
            } else {
                caption.style.display = 'none';
            }

            toggleNavigation();

            var href = elm.options.href || elm.getAttribute('href');

            loadImage(href, function (w, h) {
                width = w;
                height = h;
                image.setAttribute('src', href);
                image.setAttribute('width', width);
                image.setAttribute('height', height);
                removeClass(image, sfx + 'hidden');
                calcSize();
            });
        },

        initBox = function () {
            if (box === undefined) {
                var html = '<div class="' + sfx + 'modal-dialog ' + sfx + 'modal-dialog-lightbox ' + sfx + 'slidenav-position" style="margin-left: auto; margin-right: auto; width: 703px; height: 527px; top: 0px;">\
                        <a href="#" class="' + sfx + 'modal-close ' + sfx + 'close ' + sfx + 'close-alt"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAyklEQVQ4T2NkIBMwkqmPAUVjaGgoMwcHB8fixYu/IhsYGxvL/ePHjx+rV6/+CxOHa0xISBBgZWVdyMjIaPHv3z//OXPmnAApSklJsWBiYtr4////E79//45fsGDBB5A4XGNaWtoUBgaGbKiJr0CaQWyQJgYGBjGo+NRZs2bloGiEmYyk6BtUMReyYTCXoPgRi2aYl8AugGlCsRGmIiUlJYSJiWk5AwMDC1Tsz79//yLnzJmzBjnAKLeRbD+SHapkxyPI42SlHFLTLABVhYMPB3G+jgAAAABJRU5ErkJggg=="></a>\
                        <div class="' + sfx + 'lightbox-content" style="opacity: 1;">\
                            <img class="' + sfx + 'main-image ' + sfx + 'responsive-width ' + sfx +  'hidden" src="">\
                            <a href="#" class="' + sfx + 'slidenav ' + sfx + 'slidenav-contrast ' + sfx + 'slidenav-previous ' + sfx + 'hidden-touch" data-lightbox-previous=""><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAABmElEQVRoQ+3YPUoEQRCG4fcTNBSPYGCgZzDwAKLe00wwUTRSExEDwURQjEzMNBEDWwZ2QcZF9qerqxhr45minv6KoXrFP/vpn3lJ8NATz4Qz4YGdQI70wAL9xcmEM+GBnUCO9MACzY9WqJEupawA+8Am8AwcSvqsOXVhwCPswQi7BBTgqTY6BHgCdhzqF3At6aRWyu7gP7Cd8QM4l3QzCPAU2EtJV7WwXR23hD2wbmAvrAvYE9sc7I1tCo6AbQaOgm0CjoQ1B0fDmoIjYs3AUbEm4MhYK/A2sAMs93bg7l7b7cYXNXfjWWtV36VLKRvALrDWa6a7374AR5JeZ2201vPVwV1jkdEm4MhoM3BUtCk4ItocHA3dBBwJ3QwcBd0UHAHdHPwDvQestl5OXMCeaDewF9oV7IF2B0+BvpV0HPryME9zowtH/0P2BpxKup+n5qR3QiQ8bqyHfgfOJN3Vwpr8AbBoc6WUdWALeJD0uGi9/vuhEq6NCz/SCTY4gRxpg0MNVTITDhWHQTOZsMGhhiqZCYeKw6CZb/2h2T1yZfGyAAAAAElFTkSuQmCC"></a>\
                            <a href="#" class="' + sfx + 'slidenav ' + sfx + 'slidenav-contrast ' + sfx + 'slidenav-next ' + sfx + 'hidden-touch" data-lightbox-next=""><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAABkElEQVRoQ+3Zu0oEQRCF4b9EFA3ERzAw0FAQI0EQM/HympqaiuE+gKF4ewbNBGkZmGDZFXShqvvQWxMPtf3VKZZqxliyx5bMS4J7TzwTzoQ760COdGeBznEy4Uy4sw7kSHcWaP5puY90KWUNuAT2gHfg1sy+VCbHFTxir0bsClCAVyW0N/gEOAZWpxKVQnuDD4AzYHNmhGXQruABWUo5BE6BDUW0O1gdHQJWRoeBVdGhYEV0OFgNXQX8D/QbcFNjI6sGVkFXBSugq4Nbo5uAW6KbgVuhm4JH9NG4e6/P7N7fwMTMHjzv0k3BpZQt4BrYgbkvmR/AnZk9dwH+A/sJ3JvZoyd2qNUk4VbYJuCW2Org1tiqYAVsNbAKtgpYCRsOVsOGghWxYWBVbAhYGesOVsdGgH/7tjT8TthuvOiu7bpLl1J2gXNge+ogMlj3hMf77YC+AIarnxQ2BDyih/vtPvBkZi+Ljl3k+64jHXlQr9oJ9uqkap1MWDUZr3Nlwl6dVK2TCasm43WuTNirk6p1fgCjeto9UkA6aQAAAABJRU5ErkJggg=="></a>\
                        </div>\
                        <div class="' + sfx + 'modal-spinner"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAC4klEQVRIS9VWPWgUQRR+390Wh8g10RQacJnZK7QzKNooiAYVIaIhVlqEiIpaBgLiD4gokVgIihi0itgpGAzGnzTGRiKxUhF3xhMuCidBzFmccLdPJsyGzV1yd5srglvufu/75r3vvbcDivlks9mNpVLpqAlzHOeB67qf4lAgDlgpdZiZhwC0mDhmngFwQkr5uFGeuIKviGh3Bfm4lHJP04K+77c6jpN0XfdHSOb7/hSAzVFyZn7veV67KXW5XB5i5u32+4TjOL2u636N4qsyZGZHaz3MzF0AkkQ0xsw9nufllVJ3iOgkEYVxTER3mfkSET0D0F6R6RshxC4ApfB9laBSqoeIbhHRKuvTXwD9Usqb+Xx+9ezs7D0iOmAJRtPp9PFCodAdjYmI/iKibinleC3B00R0g4hSFlRm5mue511YyielVGVMCP0N4IgQ4sWSgsY7AE+JaKsFfQmC4FAmk/mwlGA2m20vlUojANZXYD4nk8n9UR8X7VJTukKh0Gu8YuaHxr96XWisYObrANZYK3IATkkpR2s2TT3iWt+tx3OVSafTk62trX8q8bHmsJnDVHlo58h05zoAV4UQw80IaK2PMfM5IvqeTCbPhitwPkPf958A6LT1n3Ycp9N13anliFY2ETOPeJ530HBFBccA7LWCPxOJRJcQYmI5glrrHUEQPAKw1vI99zxv3wJBrXUHMw8y83oA96WU/csRC2OUUgPM3AtgGkCfEOLlAsFmyOPErlyXxjllM9hFMwz9NPsUwJVGR8SOwnkiKkZ9q7tplFKTRLQl3KUAOoQQ32plprXewMymMTIW905KGe7j+dBFM1wJQfO/G7QlvRgtqdb6TBAEZoNQIpEwG+l2eHxb0sumpETUV7m4Y49FLpdrKRaLrwFssgP9MZVK7Wxra5tptJFijYW5fiil3oZXCWaeklJui14h6gnHEjRktoPnthCAgXCD1BOq+ls0GtAsLnaG/53gP2xBUyx2O7HbAAAAAElFTkSuQmCC"></div>\
                        <div class="' + sfx + 'modal-caption">Title</div>\
                    </div>',

                    nextSlide = function () {
                        if (group && groups[group] && currentInGroup !== undefined) {
                            currentInGroup = hasClass(this, sfx + 'slidenav-previous') ? currentInGroup - 1 : currentInGroup + 1;
                            if (currentInGroup < 0) {
                                currentInGroup = groups[group].length - 1;
                            } else if (currentInGroup >= groups[group].length) {
                                currentInGroup = 0;
                            }
                            var elm = groups[group][currentInGroup];
                            loadContent(elm);
                        }
                    };

                box = document.createElement('div');
                addClass(box, sfx + 'modal');
                box.innerHTML = html;

                dialog = find(box, '.' + sfx + 'modal-dialog')[0];
                image = find(box, '.' + sfx + 'main-image')[0];
                spinner = find(box, '.' + sfx + 'modal-spinner')[0];
                content = find(box, '.' + sfx + 'lightbox-content')[0];
                closer = find(box, '.' + sfx + 'modal-close')[0];
                prev = find(box, '.' + sfx + 'slidenav-previous')[0];
                next = find(box, '.' + sfx + 'slidenav-next')[0];
                caption = find(box, '.' + sfx + 'modal-caption')[0];

                dialog.addEventListener('click', function (e) {
                    e.stopPropagation();
                });

                box.addEventListener('click', close);
                closer.addEventListener('click', close);
                window.addEventListener('resize', calcSize);

                prev.addEventListener('click', nextSlide);
                next.addEventListener('click', nextSlide);

                document.body.appendChild(box);
            }
        },

        open = function (el) {
            initBox();

            box.style.display = 'block';

            iopen = true;

            setTimeout(function () {
                addClass(document.body, sfx + 'modal-page');
                addClass(box, sfx + 'open');
                calcSize();
            }, 100);

            loadContent(el);
        };

    lightboxkit = function (selector, options) {
        var elms = find(window.document, selector);
        if (elms.length) {
            elms.forEach(function (el) {
                var data = el.getAttribute('data-lightboxkit');

                options = extend(defaultOptions, options);

                if (data) {
                    try {
                        data = JSON.parse(data.replace(/'/g, '"'));
                        options = extend(options, data);
                    } catch (ignore) {
                    }
                }

                el.options = options;

                if (options.group !== undefined) {
                    if (groups[options.group] === undefined) {
                        groups[options.group] = [];
                    }
                    groups[options.group].push(el);
                }

                el.addEventListener('click', function (e) {
                    group = options.group;

                    if (group !== undefined && groups[group] !== undefined) {
                        groups[group].forEach(function (elm, index) {
                            if (elm === el) {
                                currentInGroup = index;
                            }
                        });
                    }

                    open(el);
                    e.preventDefault();
                });
            });
        }
    };

    lightboxkit.defaultOptions = defaultOptions;

    if (typeof define === "function" && define.amd) {
        define("lightboxkit", [], function () {
            return lightboxkit;
        });
    }

    if (!noGlobal) {
        window.lightboxkit = lightboxkit;
    }

    ready(function () {
        lightboxkit('[data-lightboxkit]');
    });

    return lightboxkit;
}));