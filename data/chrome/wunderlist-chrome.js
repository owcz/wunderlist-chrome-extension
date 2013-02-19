(function() {

  var overlayId = 'wunderlist_overlay';

  function buildUrl (data) {

    // Builds url for passing data to wunderlist.com extension frame.
    // Takes passes in data, or defaults to the tabs title and url or text selection in the frame

    var title = data.title || encodeURI(document.title);
    var note = data.note || window.location.href;
    var selection = window.getSelection().toString();

    if (!data.note && selection) {

      note = note + "\n" + selection;
    }

    note = encodeURI(note);

    return data.config.host + '/#/extension/add/' + title + '/' + note;
  }

  function buildCss (options) {

    // Create styles for overlay
    var transitionSpeed = options && options.transitionSpeed || 500;
    var opacity = options && options.opacity || 0;

    return 'border:none;height:100%;width:100%;position:fixed;z-index:99999999;top:0;left:0;opacity:' + opacity + ';display:block;-webkit-transition:opacity ' + transitionSpeed + 'ms linear;';
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

  function injectQuickAddLink () {

    var host = window.location.hostname;
    var hash = window.location.hash;

    var $button = $('#addToWunderlistButton');
    if ($button.length) {

      $button.remove();
    }

    if (/mail\.google\.com/.test(host) && hash.split('/')[1]) {

      // these classes may change, not sure how long they last on gmail
      var $mainContainer = $('#\\:ro');
      var $validChild = $mainContainer.children('div:visible');
      var $headerButtons = $validChild.find('.G-Ni');
      var $targetContainer = $($headerButtons.get(3));

      var $clone = $targetContainer.contents().clone();

      var addString = 'Add to Wunderlist';
      $clone.empty().attr('id', 'addToWunderlistButton')
        .attr('data-tooltip', addString)
        .attr('aria-label', addString)
        .attr('aria-haspopup', 'false')
        .text('+ Wunderlist');

      $targetContainer.append($clone);

      $('#addToWunderlistButton').on('click', function () {

        var data = {};
        var config = {

          'host': 'https://www.wunderlist.com'
        };

        data.config = config;
        data.title = window.title;
        showOverlay(data);
      });
    }
  }

  function extractData () {

    var note = document.getElementById(':sv').innerText;
  }

  $(function () {

    // takes a while for the dom to be really ready
    window.setTimeout(injectQuickAddLink, 5000);
    window.onhashchange = injectQuickAddLink;
  });

}());