/*

Buffer for Chrome
https://github.com/bufferapp/buffer-chrome

Copyright (C) 2012 Buffer

File requires jQuery

*/

// Configuration
var config = {};
config.plugin = {
	label: "Buffer This Page",
	version: "2.2.1",
	guide: 'http://bufferapp.com/guides/chrome/installed',
	menu: {
		page: {
			label: "Buffer This Page"
		},
		selection: {
			label: "Buffer Selected Text"
		},
		image: {
			label: "Buffer This Image"
		}
	}
};

// Tab data
var activeTab, activeTabId;
var tabs = [];

// Overlay
var triggerOverlay = function (data, cb) {
	
	// Clean up the parameters
	if( typeof data === 'function' ) cb = data;
	if( ! data ) data = {};
	if( ! cb ) cb = function () {};
	if( ! data.embed ) data.embed = {};
		
	// Store important info about the current from which
	// we are Buffering
	var activeTabId = data.tab.id;
	var tab = tabs[activeTabId];

	console.log("Triggering from ", tab);

	// Remove the port once the Buffering is complete
	tab.overlayPort.on('buffer_done', function (overlayData) {
		setTimeout(function () {
			cb(overlayData);
		}, 0);
	});
	
	// Don't try to JSONify a tab
	data.tab = null;

	// Pass statistic data
	data.version = config.plugin.version;
	if( data.embed.placement ) data.placement = data.embed.placement;

	// Wait for details back from the scraper
	tab.pageScraperPort.on("buffer_details", function (scraperData) {

		// Add the scraper data to the trigger data
		$.extend(true, data, scraperData);

		console.log(data);

		// Pass this data directly into the preloaded overlay
		tab.overlayScraperPort.emit("buffer_details", data);

	});

	// Ask for page data from the scraper
	tabs.pageScraperPort.emit("buffer_request_details");

	// Inform the preloaded overlay of the trigger
	tabs.overlayPort.emit("buffer_click");
};

// Initialise a tab object for use later
var initTab = function (id) {

	var tab = {};

	tab.id = id;
	tab.overlayPort = null;
	tab.pageScraperPort = null;
	tab.overlayScraperPort = null;

	console.log("Registering ", tab);

	tabs[id] = tab;

};

// Keep track of tabs

// Initliase a new tab
chrome.tabs.onCreated.addListener(function (tab) {
	initTab(tab.id);
});

// Check intialisation of a new tab is needed
chrome.tabs.onActivated.addListener(function (tab) {
	if( ! tabs[tab.tabId] ) initTab(tab.tabId);
});

// Delete references to a tab as it closes
chrome.tabs.onRemoved.addListener(function (tabId) {
	tabs[tabId] = undefined;
});

// Show the guide on first run
if( ! localStorage.getItem('buffer.run') ) {
	localStorage.setItem('buffer.run', true);
	chrome.tabs.create({
		url: config.plugin.guide
	});
}

// Fire the overlay when the button is clicked
chrome.browserAction.onClicked.addListener(function(tab) {
	console.log(tabs, tab);
	if( ! tabs[tab.id].overlayPort ) {
		console.log("OverlayPort not registered.");
	}
	triggerOverlay({tab: tab, placement: 'toolbar'});
});

// Context menus
// Page
chrome.contextMenus.create({
	title: config.plugin.menu.page.label,
	contexts: ["page"],
	onclick: function (info, tab) {
		triggerOverlay({tab: tab, placement: 'menu-page'});
	}
});

// Selection
chrome.contextMenus.create({
	title: config.plugin.menu.selection.label,
	contexts: ["selection"],
	onclick: function (info, tab) {
		triggerOverlay({tab: tab, placement: 'menu-selection'});
	}
});

// Listen for embedded events
// There may be many such connections on any particular page.
chrome.extension.onConnect.addListener(function(chport) {
	
	// Is this a Buffer port?
	if( ! chport.name.match(/buffer/i) ) return;

	// Store this port in this closure
	var port = PortWrapper(chport);
	var tab = port.raw.sender.tab;

	// Store a reference to the tab from the tabs []
	if( ! tabs[tab.id] ) console.log("Tab onConnect called without being initliased.", tab, tabs);
	connectedTab = tabs[tab.id];
	
	// Listen for embedded trigger
	port.on("buffer_click", function (embed) {
		// Don't fire the overlay if we haven't preloaded it
		if( ! connectedTab.overlayPort ) return;

		// Attach the overlay using the current tab's ports
		triggerOverlay({tab: tab, embed: embed}, function (overlaydata) {
			// Handle data passed back from the overlay
			if( !!overlaydata.sent ) {
				// Buffer was sent
				port.emit("buffer_embed_clear");
			}
		});
	});

	// Listen for the scraper delivering data
	port.on("buffer_details", function (data) {
		// Pass this data on to the overlay-scraper
		if( connectedTab.overlayScraperPort ) connectedTab.overlayScraperPort.emit("buffer_details", data);
	});

	// Register ports with the active tab
	port.on("buffer_register_overlay", function () {
		console.log("buffer_register_overlay");
		connectedTab.overlayPort = port;
	});
	port.on("buffer_register_page_scraper", function () {
		console.log("buffer_register_page_scraper");
		connectedTab.pageScraperPort = port;
	});
	port.on("buffer_register_overlay_scraper", function () {
		console.log("buffer_register_overlay_scraper");
		connectedTab.overlayScraperPort = port;
	});

});
