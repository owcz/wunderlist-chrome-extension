(function() {

  console.log('ran');

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

    console.log(host, hash);

    if (/mail\.google\.com/.test(host) && hash.split('/')[1]) {

      if (!$button.length) {

        console.log('in here');

        var $container = $('#\\:ro');

        var $upperButtons = $container.find('.G-Ni');
        console.log($upperButtons);

        var $div = $('<div/>');
        $div.attr('id', 'addToWunderlistButton').css({

          // TO DO
          'cursor': 'pointer',
          'background-color': 'transparent',
          'background-image': 'linear-gradient(top,#f5f5f5,#f1f1f1)',
          'border-radius': '2px',
          'text-align': 'center',
          'width': '200px',
          'padding': '4px 10px',
          'border': '1px solid rgba(0,0,0,0.1)'
        }).text('Add to Wunderlist');

        $container.prepend($div);

        $('#addToWunderlistButton').on('click', function () {

          console.log('clicked');
          var data = {};
          var config = {
            'host': 'https://www.wunderlist.com'
            //'host': 'https://www.wunderlist.com'
          };
          data.config = config;
          data.title = window.title;
          showOverlay(data);
        });
      }
      else {

        $button.show();
      }
    }
    else {

      if ($button.length) {

        $button.hide();
      }
    }
  }

  function extractData () {

    var note = document.getElementById(':sv').innerText;
  }

  $(function () {

    window.setTimeout(injectQuickAddLink, 5000);
    window.onhashchange = injectQuickAddLink;
  });

}());