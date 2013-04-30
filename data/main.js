// Add manifest access to the extension
chrome.manifest = chrome.app.getDetails();

// Trigger wunderlist_click in the content scripts,
// so that an overlay is created
var attachOverlay = function (data) {

	// Store references to important data
	var tab = data.tab;
	var port = PortWrapper(chrome.tabs.connect(tab.id), {name: 'wunderlist'});

  port.emit('wunderlist_clickQuickAdd', data);
};

// Fire the overlay when the browser action button is clicked
chrome.browserAction.onClicked.addListener(function (tab) {

  attachOverlay({

    'tab': tab
  });
});

// context menu item
chrome.contextMenus.create({

  "title": "Add to Wunderlist",
  "contexts": ["page", "selection", "image", "link"],
  "onclick": function (info, tab) {

    attachOverlay({

      'tab': tab
    });
  }
});