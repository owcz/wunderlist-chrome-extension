// Load App Scripts
// (function () {

//   var scripts = [
//     'https://wunderlist2.s3.amazonaws.com/fdc013aec2c319cbe338cf5fa447faef839a4c76/app.js',
//     'https://wunderlist2.s3.amazonaws.com/7fc13e13f865a44dad1fbfae7fb0dac3710f1b19/libs.js'
//   ];

//   for (var i in scripts) {

//     var script = document.createElement('script');
//     script.type = 'text/javascript';
//     script.src = scripts[i];

//     var s = document.getElementsByTagName('script')[0];
//     s.parentNode.insertBefore(script, s);
//   }
// })();

// Add manifest access to the extension
chrome.manifest = chrome.app.getDetails();

// Plugin configuration
var config = {
  'host': 'https://www.wunderlist.com'
};

// Trigger wunderlist_click in the content scripts,
// so that an overlay is created
var attachOverlay = function (data) {

  // Store references to important data
  var tab = data.tab;
  var port = PortWrapper(chrome.tabs.connect(tab.id), {name: 'wunderlist'});

  port.emit('wunderlist_clickQuickAdd', data);
};

// Fire the overlay when the browser action button is clicked
chrome.browserAction.onClicked.addListener(function(tab) {

  attachOverlay({
    'tab': tab,
    'config': config
  });

});
