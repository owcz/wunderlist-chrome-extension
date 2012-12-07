(function() {

  function buildUrl (data) {

    var title = encodeURI(document.title);
    var note = window.location.href;
    var selection = window.getSelection().toString();

    if (selection) {
      note = note + "\n" + selection;
    }

    note = encodeURI(note);

    return data.config.host + '/#/extension/add/' + title + '/' + note;
  }

  function buildCss (options) {

    var transitionSpeed = options && options.transitionSpeed || 500;
    var opacity = options && options.opacity || 0;

    return 'border:none;height:100%;width:100%;position:fixed;z-index:99999999;top:0;left:0;opacity:' + opacity + ';display:block;-webkit-transition:opacity ' + transitionSpeed + 'ms linear;';
  }

  chrome.extension.onConnect.addListener(function(rawPort) {

    var overlayId = 'wunderlist_overlay';
    var port = PortWrapper(rawPort);

    port.on('wunderlist_clickQuickAdd', function(postData) {

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
              frame.onload = function() {
                window.removeEventListener('message', close, false);
                frame.parentNode.removeChild(frame);
                frame = null;
              };
            }, 500);
          }
        };
        
        window.addEventListener('message', close, false);
      }
    });
  });

}());