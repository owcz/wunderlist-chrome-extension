;(function () {
	
	// Displays a message asking the user to refresh their page before using Buffer

	// Wait for a request for reload
	xt.port.on("buffer_reload_request", function() {
		alert("Looks like you just installed or upgraded Buffer for Chrome – awesome! To wake up those lazy extension elves, please refresh the page.");
	});
	
}());