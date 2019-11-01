(function ( $ ) {
    var keys = {
        ESC: 27,
        TAB: 9,
        ENTER: 13,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    };

    function Autocomplete(inputField, options) {
        var self = this;

        self.inputField = $(inputField);
        self.selected = -1;
        self.options = $.extend(true, {}, Autocomplete.defaults, options);
        self.initialize();
    }

    Autocomplete.defaults = {
        timeout: 200, // ajax timeout
        cache: true,
        highlight: true,
        loadingString: 'Loading...',
        maxResults: 15,
        minLength: 3,
        language: 'cs',
        autoSubmit: true
    };

    Autocomplete.prototype = {
        initialize: function () {
            var self = this;
            var options = self.options;
            self.inputField.attr('autocomplete', 'off');
            self.container = $('<div/>')
                .addClass('autocomplete-results')
                .css({
                    'display': 'none',
                    'position': 'absolute',
                    'z-index': 5000
                })
                .html('<i class="item loading">' + options.loadingString + '</i>');
            self.container.appendTo('body');

            $(window).resize(function () {
                self.fixPosition();
            });

            self.inputField.blur(function(e) { // TODO
                if (e.target.acitem) { //TODO: what is acitem?
                    setTimeout(self.hide, 200);
                } else {
                    self.hide();
                }
            });

            self.inputField.focus(function() {
                if (self.inputField.val().length === 0) {
                    self.search();
                }
            });

            self.inputField.click(function() {
                self.search();
            });

            self.inputField.keyup(function(event) {
                self.onKeyUp(event);
            });

            self.inputField.keydown(function(event) {
                self.onKeyDown(event);
            });
        },
        fixPosition: function() {
            var input = this.inputField;
            offset = input.offset();
            height = input.outerHeight();
            width = input.outerWidth();
            this.container.css({
                top: offset.top + height + "px",
                left: offset.left + "px",
                minWidth: width - 24,
                maxWidth: input.closest('form').width(),
            });
        },
        clearCache: function() {
            this.cache = {};
        },
        hide: function() {
            this.container.hide();
        },
        show: function () {
            this.container.show();
        },
        isVisible: function() {
            this.container.is(':visible');
        },
        destroy: function () {
            this.inputField.off('.autocomplete').removeData('naki');
            $(window).off('resize', this.fixPosition);
            this.container.remove();
        },
        onKeyUp: function (event) {
            var self = this;

            switch (event.which) {
                case keys.UP:
                case keys.DOWN:
                case keys.LEFT:
                case keys.RIGHT:
                case keys.ESC:
                    return;
                default:
                    self.search();
            }
        },
        onKeyDown: function (event) {
            var self = this;

            // If autocomplete is hiddent and user press down arrow, display it:
            if (!self.isVisible && event.which === keys.DOWN) {
                self.show();
                self.search();
                return;
            }

            var position = self.inputField.data('selected');
            var linescount = $('.autocomplete-results .item').length;
            switch (event.which) {
                // arrow keys through items
                case keys.UP: {
                    event.preventDefault();
                    self.container.find('.item.selected').removeClass('selected');
                    if (position > 0) {
                        position--;
                        self.container.find('.item:eq(' + position + ')').addClass('selected');
                        self.data('selected', position);
                    } else {
                        position = linescount - 1;
                        self.container.find('.item:eq(' + position + ')').addClass('selected');
                        self.data('selected', position);
                    }
                    break;
                }
                case keys.DOWN: {
                    event.preventDefault();
                    if (!self.isVisible()) {
                        self.search();
                    } else if (position < linescount - 1) {
                        position++;
                        self.container.find('.item.selected').removeClass('selected');
                        self.container.find('.item:eq(' + position + ')').addClass('selected');
                        self.data('selected', position);
                    } else {
                        position = 0;
                        self.container.find('.item.selected').removeClass('selected');
                        self.container.find('.item:eq(' + position + ')').addClass('selected');
                        self.data('selected', position);
                    }
                    break;
                }
                // enter to nav or populate
                case keys.TAB:
                case keys.ENTER: {
                    var selected = self.container.find('.item.selected');
                    if (selected.length > 0) {
                        event.preventDefault();
                        self.populate(selected.attr('data-value'), {key: true});
                        self.container.find('.item.selected').removeClass('selected');
                    }
                    self.hide();
                    $(this).data('selected', -1);
                    break;
                }
                // hide on escape
                case keys.ESC: {
                    self.hide();
                    self.data('selected', -1);
                    break;
                }
            }
        },
        populate: function(value, eventType) {
            var self = this;
            self.inputField.val(value);
            self.hide();
            self.inputField.trigger('autocomplete:select', {value: value, eventType: eventType});

            if(self.options.autoSubmit === true) {
                self.inputField.closest('form').submit();
            }
        },
        abortXhr: function() {
            var self = this;
            if (self.xhr) {
                self.xhr.abort();
                self.xhr = null;
            }
        },
        clearTimer: function() {
            var self = this;
            if (self.timer) {
                clearTimeout(self.timer);
            }
        },
        search: function() {
            var self = this;
            self.abortXhr();
            var options = self.options;
            var input = self.inputField;
            if (input.val().length >= options.minLength) {
                var container = self.container;
                container.html('<i class="item loading">' + options.loadingString + '</i>');
                self.show();
                self.fixPosition();
                var term = input.val();
                var cid = input.data('cache-id');
                if (options.cache && typeof self.cache[cid][term] !== "undefined") {
                    if (self.cache[cid][term].length === 0) {
                        self.hide();
                    } else {
                        self.createList(self.cache[cid][term]);
                    }
                } else if (typeof options.handler !== "undefined") {
                    options.handler(self, input.val(), function (data) {
                        if (options.cache) {
                            self.cache[cid][term] = data;
                        }
                        if (data.length === 0) {
                            self.hide();
                        } else {
                            self.createList(data);
                        }
                    });
                } else {
                    console.error('handler function not provided for autocomplete');
                }
                input.data('selected', -1);
            } else {
                self.hide();
            }
        },
        createList: function(data) {
            var self = this;
            var container = self.container;
            //self.resetContainer();
            self.container.html('');
            self.fixPosition();
            data.forEach(function (item) {
                self.createSection(item);
            });
            container.find('.item').mousedown(function() {
                self.populate($(this).attr('data-value'), {mouse: true});
            });
            self.fixPosition();
            console.log(container.html());
        },
        createSection: function(data) {
            var self = this;
            var container = self.container;
            var options = self.options;
            var input = self.inputField;
            console.log(data);
            container.append($('<div/>')
                .addClass('autocomplete-results-category')
                .html(data.section_name)
            );
            var length = Math.min(options.maxResults, data.items.length);
            input.data('length', length);
            for (var i = 0; i < length; i++) {
                if (typeof data.items[i] === 'string') {
                    data.items[i] = {value: data.items[i]};
                }
                console.log(data.items[i]);
                var content = data.items[i].value;
                if (options.highlight) {
                    // escape term for regex
                    // https://github.com/sindresorhus/escape-string-regexp/blob/master/index.js
                    var escapedTerm = input.val().replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
                    var regex = new RegExp('(' + escapedTerm + ')', 'ig');
                    content = content.replace(regex, '<b>$1</b>');
                }
                var item = $('<div/>');
                item.attr('data-index', i + 0)
                    .attr('data-value', data.items[i].value)
                    .attr('id', 'autocomplete-item-' + i)
                    .addClass('item')
                    .html(content)
                    .mouseover(function () {
                        container.find('.item.selected').removeClass('selected');
                        $(this).addClass('selected');
                        input.data('selected', $(this).data('index'));
                    });
                if (typeof data.items[i].description !== 'undefined') {
                    item.append($('<small/>').text(data.items[i].description));
                }
                console.log(item);
                container.append(item);
            }
        },
        ajax: function(options) {
            var self = this;
            self.clearTimer();
            self.abortXhr();
            self.timer = setTimeout(
                function() { self.xhr = $.ajax(options); },
                self.options.timeout
            );
        },
        resetContainer: function() {
            var self = this;
            self.container = $('<div/>')
                .addClass('autocomplete-results')
                .css({
                    'position': 'absolute',
                    'z-index': 5000
                });
        }
    };
    // Create jQuery plugin
    $.fn.nakiAutocomplete = function (options) {
        var dataKey = 'naki';

        return this.each(function () {
            var inputElement = $(this),
                instance = inputElement.data(dataKey);

            if (typeof options === 'string') {
                if (instance && typeof instance[options] === 'function') {
                    instance[options](args);
                }
            } else {
                // If instance already exists, destroy it:
                if (instance && instance.destroy) {
                    instance.destroy();
                }
                instance = new Autocomplete(this, options);
                inputElement.data(dataKey, instance);
            }
        });
    };

    // Do not overwrite other autocompleters
    if (!$.fn.autocomplete) {
        $.fn.autocomplete = $.fn.nakiAutocomplete;
    }
}( jQuery ));