(function (WL) {

  // listener for menu button
  chrome.extension.onConnect.addListener(function (rawPort) {

    var port = PortWrapper(rawPort);
    port.on('wunderlist_clickQuickAdd', function (postData) {

      WL.showOverlay(postData);
    });
  });
})(window.WL);