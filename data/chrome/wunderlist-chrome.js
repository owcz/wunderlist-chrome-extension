(function() {

  var addString = 'Add to Wunderlist';
  var overlayId = 'wunderlist_overlay';
  var buttonId = 'addToWunderlistButton';
  var config = {

    // 'host': 'https://www.wunderlist.com'
    'host': 'http://localhost:5000'
  };

  function buildUrl (data) {

    // Builds url for passing data to wunderlist.com extension frame.
    // Takes passes in data, or defaults to the tabs title and url or text selection in the frame

    var title = data.title || encodeURIComponent(document.title);
    var note = data.note || window.location.href;
    var selection = window.getSelection().toString();

    if (!data.note && selection) {

      note = note + "\n" + selection;
    }

    note = encodeURIComponent(note);

    return data.config.host + '/#/extension/add/' + title + '/' + note;
  }

  function buildCss (options) {

    // Create styles for overlay
    var transitionSpeed = options && options.transitionSpeed || 500;
    var opacity = options && options.opacity || 0;

    return 'opacity:' + opacity + ';-webkit-transition:opacity ' + transitionSpeed + 'ms linear;';
  }

  function showOverlay (postData) {

    var existing = document.getElementById(overlayId);

    if (!existing) {

      var frame = document.createElement('iframe');

      frame.allowtransparency = 'true';
      frame.scrolling = 'no';
      frame.id = overlayId;
      frame.name = overlayId;
      frame.style.cssText = buildCss();
      frame.src = buildUrl(postData);

      frame.onload = function () {

        frame.style.opacity = 1;

        setTimeout(function () {

          frame.style.cssText = buildCss({

            'opacity': 1,
            'transitionSpeed': 50
          });
        }, 1000);
      };

      document.body.appendChild(frame);

      var close = function close (ev) {

        if (ev.data === 'close_wunderlist') {
          
          frame.style.opacity = 0;

          setTimeout(function () {

            frame.src = 'about:blank';
            frame.onload = function () {

              window.removeEventListener('message', close, false);
              frame.parentNode.removeChild(frame);
              frame = null;
            };
          }, 500);
        }
      };
      
      window.addEventListener('message', close, false);
    }
  }

  chrome.extension.onConnect.addListener(function (rawPort) {

    var port = PortWrapper(rawPort);
    port.on('wunderlist_clickQuickAdd', function (postData) {

      showOverlay(postData);
    });
  });

  function gmailQuickAdd () {

    // these classes may change, not sure how long they last on gmail
    var $mainContainer = $('#\\:ro');
    var $validChild = $mainContainer.children('div:visible');
    var $headerButtons = $validChild.find('.G-Ni');
    var $targetContainer = $($headerButtons.get(3));

    var $clone = $targetContainer.contents().clone();

    $clone.empty().addClass('gmail')
      .attr('id', buttonId)
      .attr('data-tooltip', addString)
      .attr('aria-label', addString)
      .attr('aria-haspopup', 'false')
      .text('Wunderlist');

    var $span = $('<span/>').addClass('wunderlist-icon');
    $clone.prepend($span);

    $targetContainer.append($clone);

    $('#' + buttonId).on('click', function () {

      var data = {};

      data.config = config;
      data.title = window.title;
      showOverlay(data);
    });
  }

  function outlookQuickAdd () {

    var $cloneTarget = $('#Archive').parent();
    var $clone = $cloneTarget.clone();

    $clone.find('a').addClass('outlook')
      .attr('id', buttonId)
      .attr('title', addString)
      .attr('aid', 'wunderlist')
      .text('Wunderlist');

    var $span = $('<span/>').addClass('wunderlist-icon');
    $clone.find('a').prepend($span);

    $cloneTarget.before($clone);

    $('#' + buttonId).on('click', function () {

      var data = {};

      data.config = config;
      data.title = $('.ReadMsgSubject').text();
      data.note = $('.ReadMsgBody').text();
      showOverlay(data);
    });
  }

  function yahooQuickAdd () {

    var $cloneTarget = $('.btn-spam:visible');
    var $clone = $cloneTarget.clone().attr('id', 'wunderlist-container')
      .removeClass('btn-spam');

    $clone.find('a').attr('id', buttonId)
      .addClass('yahoo')
      .attr('title', addString)
      .attr('data-action', '')
      .text('Wunderlist');

    $('.btn-msg-actions:visible').after($clone);

    $('#' + buttonId).on('click', function () {

      var data = {};

      data.config = config;
      data.title = $('.info > h3').text();
      data.note = $('.msg-body.inner').text();
      showOverlay(data);
    });
  }

  function amazonQuickAdd () {

    var $targetContainer = $('.buyingDetailsGrid');
    var $button = $('<div/>').addClass('amazon')
      .attr('id', buttonId)
      .text(addString);

    var $icon = $('<span/>').addClass('wunderlist-icon');

    $button.prepend($icon);

    $targetContainer.prepend($button);

    $('#' + buttonId).on('click', function (ev) {

      ev.stopPropagation();
      ev.preventDefault();

      var data = {};

      data.config = config;
      data.title = $('meta[name="title"]').text();
      data.note = $('link[rel="canonical"]').text();
      showOverlay(data);
      return false;
    }).on('submit', function () {

      return false;
    });
  }

  function injectQuickAddLink () {

    console.log('hash change');

    var host = window.location.hostname;
    var hash = window.location.hash;
    var search = window.location.search;

    var $button = $('#' + buttonId);
    if ($button.length) {

      $button.remove();
    }

    if (/mail\.google\.com/.test(host) && hash.split('/')[1]) {

      gmailQuickAdd();
    }
    else if (/mail\.live\.com/.test(host) && (/&mid=/.test(hash) || /&mid=/.test(search))) {

      outlookQuickAdd();
    }
    else if (/mail\.yahoo\.com/.test(host)) {

      yahooQuickAdd();
    }
    else if (/amazon\./.test(host)) {

      amazonQuickAdd();
    }
  }

  var lastLocation = window.location.hostname + window.location.search + window.location.hash;
  function checkLocation () {

    var host = window.location.hostname;
    var hash = window.location.hash;
    var search = window.location.search;

    if (lastLocation !== host + search + hash) {

      lastLocation = host + search + hash;
      injectQuickAddLink();
    }
  }

  $(function () {

    var timeout = 100;
    var host = window.location.hostname;

    if (/mail\.google\.com/.test(host)) {

      timeout = 5000;
    }

    // takes a while for the dom to be really ready on gmail
    window.setTimeout(injectQuickAddLink, timeout);
    // simulate onhashchange for websites that are messing with pushstate and history
    window.setTimeout(function () {

      window.setInterval(checkLocation, 100);
    }, timeout);
  });

}());