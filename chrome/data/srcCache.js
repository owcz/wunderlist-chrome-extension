/**
 * srcCache
 *
 * Cache an HTML file ready for serving to an iframe
 *
 * Webkit-only
 */

;(function () {

	$.srcCache = (function () {

		// Filename lookup hash
		var lookup = {};

		// Grab the file system handle
		var requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

		// BlobBuilder, used in the file writer
		var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;

		// Error handler
		var errorHandler = function (e) {

			var msg = '';

			switch (e.code) {
				case FileError.QUOTA_EXCEEDED_ERR:
					msg = 'QUOTA_EXCEEDED_ERR';
					break;
				case FileError.NOT_FOUND_ERR:
					msg = 'NOT_FOUND_ERR';
					break;
				case FileError.SECURITY_ERR:
					msg = 'SECURITY_ERR';
					break;
				case FileError.INVALID_MODIFICATION_ERR:
					msg = 'INVALID_MODIFICATION_ERR';
					break;
				case FileError.INVALID_STATE_ERR:
					msg = 'INVALID_STATE_ERR';
					break;
				default:
					msg = 'Unknown Error';
					break;
			}

			console.log('Error: ' + msg);

		};

		var srcCache = function (name, url, cb) {

			if( ! url ) return lookup[name] || false;
			if( ! cb ) cb = function () {};

			// Grab 1MB temporary storage on the file system
			// Must be temporary because persistent storage requires permission
			// from the user
			requestFileSystem(window.TEMPORARY, 1*1024*1024 /*1MB*/, function (fs) {

				// Create a temporary file
				fs.root.getFile(name, {create: true}, function(fileEntry) {

					// Then write the contents of /add to it
					fileEntry.createWriter(function (fileWriter) {

						// Handle success & errors
						fileWriter.onwriteend = function (ev) {
							console.log("write complete.", ev);

							lookup[name] = fileEntry.toURL();

							cb(lookup[name]);

						};

						fileWriter.onwriteerror = function (ev) {
							console.log("write error.", ev);
						};

						$.get(url, function (data, txt, xhr) {
							// Create a new Blob and write it
							var bb = new BlobBuilder();
							bb.append(data);
							fileWriter.write(bb.getBlob('text/plain'));
						});

					});

				}, errorHandler);

			}, errorHandler);

		};

		return srcCache;

	}());

}());