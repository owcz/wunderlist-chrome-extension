(function (WL) {

  var overlayId = 'wunderlist_overlay';

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
      frame.src = WL.buildUrl(postData);

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

  // exports
  WL.showOverlay = showOverlay;

})(window.WL);