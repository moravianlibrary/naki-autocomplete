(function ( $ ) {
  var xhr = false;

  $.fn.autocomplete = function(settings) {

    var options = $.extend( {}, $.fn.autocomplete.options, settings );

    function align(input, element) {
        offset = input.offset();
        height = input.outerHeight();
        width = input.outerWidth();
        element.css({
            position: 'absolute',
            top: offset.top + height + "px",
            left: offset.left + "px",
            minWidth: width - 24,
            maxWidth: input.closest('form').width(),
            zIndex: 5000
        });
    }

    function populate(value, input, eventType) {
        input.val(value);
        $.fn.autocomplete.element.hide();
        input.trigger('autocomplete:select', {value: value, eventType: eventType});
      
        if($.fn.autocomplete.options.autoSubmit === true) {
            input.closest('form').submit();
        }
    }

    function createListFrom(shell, input, data, category) {
        shell.append($('<div/>')
            .addClass('autocomplete-results-category')
            .html(category)
        );
        var length = Math.min(options.maxResults, data.length);
        input.data('length', length);
        for (var i=0; i<length; i++) {
          if (typeof data[i] === 'string') {
            data[i] = {value: data[i]};
          }
          var content = data[i].value;
          if (options.highlight) {
            // escape term for regex
            // https://github.com/sindresorhus/escape-string-regexp/blob/master/index.js
            var escapedTerm = input.val().replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
            var regex = new RegExp('('+escapedTerm+')', 'ig');
            content = content.replace(regex, '<b>$1</b>');
          }
          var item = $('<div/>');
          item.attr('data-index', i+0)
              .attr('data-value', data[i].value)
              .attr('id', 'autocomplete-item-' + i)
              .addClass('item')
              .html(content)
              .mouseover(function() {
                $.fn.autocomplete.element.find('.item.selected').removeClass('selected');
                $(this).addClass('selected');
                input.data('selected', $(this).data('index'));
              });
          if (typeof data[i].description !== 'undefined') {
            item.append($('<small/>').text(data[i].description));
          }
          shell.append(item);
        }
    }
    
    function createList(data, input) {
        var shell = $('<div/>');

        if (data.byTitle.length > 0) {
            createListFrom(shell, input, data.byTitle, 'in_titles');
        }

        if (data.byAuthor.length > 0) {
            createListFrom(shell, input, data.byAuthor, 'in_authors');
        }

        if (data.bySubject.length > 0) {
            createListFrom(shell, input, data.bySubject, 'in_subjects');
        }

      $.fn.autocomplete.element.html(shell);
      $.fn.autocomplete.element.find('.item').mousedown(function() {
          populate($(this).attr('data-value'), input, {mouse: true});
      });
      align(input, $.fn.autocomplete.element);
    }

    function search(input, element) {
      if (xhr) { xhr.abort(); }
      if (input.val().length >= options.minLength) {
        element.html('<i class="item loading">'+options.loadingString+'</i>');
        element.show();
        align(input, $.fn.autocomplete.element);
        var term = input.val();
        var cid = input.data('cache-id');
        if (options.cache && typeof $.fn.autocomplete.cache[cid][term] !== "undefined") {
          if ($.fn.autocomplete.cache[cid][term].length === 0) {
            element.hide();
          } else {
            createList($.fn.autocomplete.cache[cid][term], input, element);
          }
        } else if (typeof options.handler !== "undefined") {
          options.handler(input.val(), function(data) {
            if (options.cache) {
              $.fn.autocomplete.cache[cid][term] = data;
            }
            if (data.length === 0) {
              element.hide();
            } else {
              createList(data, input, element);
            }
          });
        } else {
          console.error('handler function not provided for autocomplete');
        }
        input.data('selected', -1);
      } else {
        element.hide();
      }
    }

    function setup(input, element) {
      if (typeof element === 'undefined') {
        element = $('<div/>')
          .addClass('autocomplete-results')
          .css('display', 'none')
          .html('<i class="item loading">'+options.loadingString+'</i>');
        align(input, element);
        $('body').append(element);
        $(window).resize(function() {
          align(input, element);
        });
      }

      input.data('selected', -1);
      input.data('length', 0);

      if (options.cache) {
        var cid = Math.floor(Math.random()*1000);
        input.data('cache-id', cid);
        $.fn.autocomplete.cache[cid] = {};
      }

      input.blur(function(e) {
        if (e.target.acitem) {
          setTimeout($.fn.autocomplete.element.hide, 10);
        } else {
          $.fn.autocomplete.element.hide();
        }
      });
      input.click(function() {
        search(input, element);
      });
      input.focus(function() {
          if (input.val().length == 0) {
              search(input, element);
          }
      });
      input.keyup(function(event) {
        // Ignore navigation keys
        // - Ignore control functions
        if (event.ctrlKey) {
          return;
        }
        // - Function keys (F1 - F15)
        if (112 <= event.which && event.which <= 126) {
          return;
        }
        switch (event.which) {
          case 9:    // tab
          case 13:   // enter
          case 16:   // shift
          case 20:   // caps lock
          case 27:   // esc
          case 33:   // page up
          case 34:   // page down
          case 35:   // end
          case 36:   // home
          case 37:   // arrows
          case 38:
          case 39:
          case 40:
          case 45:   // insert
          case 144:  // num lock
          case 145:  // scroll lock
          case 19:   // pause/break
            return;
          default:
            search(input, element);
        }
      });
      input.keydown(function(event) {
        var element = $.fn.autocomplete.element;
        var position = $(this).data('selected');
        var linescount = $('.autocomplete-results .item').length;
        switch (event.which) {
          // arrow keys through items
          case 38: {
            event.preventDefault();
            element.find('.item.selected').removeClass('selected');
            if (position > 0) {
              position--;
              element.find('.item:eq('+position+')').addClass('selected');
              $(this).data('selected', position);
            } else {
                position = linescount - 1;
                element.find('.item:eq('+position+')').addClass('selected');
                $(this).data('selected', position);
            }
            break;
          }
          case 40: {
            event.preventDefault();
            if ($.fn.autocomplete.element.is(':hidden')) {
              search(input, element);
            } else if (position < linescount -1) {
              position++;
              element.find('.item.selected').removeClass('selected');
              element.find('.item:eq('+position+')').addClass('selected');
              $(this).data('selected', position);
            } else {
                position = 0;
                element.find('.item.selected').removeClass('selected');
                element.find('.item:eq('+position+')').addClass('selected');
                $(this).data('selected', position);
            }
            break;
          }
          // enter to nav or populate
          case 9:
          case 13: {
            var selected = element.find('.item.selected');
            if (selected.length > 0) {
              event.preventDefault();
              if (event.which === 13 && selected.attr('href')) {
                location.assign(selected.attr('href'));
              } else {
                populate(selected.attr('data-value'), element, {key: true});
                element.find('.item.selected').removeClass('selected');
                $(this).data('selected', -1);
              }
            }
            
            /* Hit esc after enter to hide list */
            element.hide();
            $(this).data('selected', -1);
            element.addClass('autocomplete-results');
            /**/
            
            break;
          }
          // hide on escape
          case 27: {
            element.hide();
            $(this).data('selected', -1);
            element.addClass('autocomplete-results');
            break;
          }
        }
      });

      if (
        typeof options.data    === "undefined" &&
        typeof options.handler === "undefined" &&
        typeof options.preload === "undefined" &&
        typeof options.remote  === "undefined"
      ) {
        return input;
      }

      return element;
    }

    return this.each(function() {

      var input = $(this);

      if (typeof settings === "string") {
        if (settings === "show") {
          $.fn.autocomplete.element.show();
          align(input, $.fn.autocomplete.element);
        } else if (settings === "hide") {
          $.fn.autocomplete.element.hide();
        } else if (settings === "clear cache" && options.cache) {
          var cid = parseInt(input.data('cache-id'));
          $.fn.autocomplete.cache[cid] = {};
        }
        return input;
      } else {
        if (!$.fn.autocomplete.element) {
          $.fn.autocomplete.element = setup(input);
        } else {
          setup(input, $.fn.autocomplete.element);
        }
      }

      return input;

    });
  };

  var timer = false;
  if (typeof $.fn.autocomplete.cache === 'undefined') {
    $.fn.autocomplete.cache = {};
    $.fn.autocomplete.element = false;
    $.fn.autocomplete.options = {
      ajaxDelay: 200,
      cache: true,
      highlight: true,
      loadingString: 'Loading...',
      maxResults: 15,
      minLength: 3,
      language: 'cs',
      autoSubmit: true
    };
    $.fn.autocomplete.ajax = function(ops) {
      if (timer) clearTimeout(timer);
      if (xhr) { xhr.abort(); }
      timer = setTimeout(
        function() { xhr = $.ajax(ops); },
        $.fn.autocomplete.options.ajaxDelay
      );
    }
  }

}( jQuery ));

