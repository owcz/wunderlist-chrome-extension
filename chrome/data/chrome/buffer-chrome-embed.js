// Initialise the port if it hasn't been already
if( ! xt ) var xt = {};
if( ! xt.port.raw ) xt.port = PortWrapper(chrome.extension.connect({name: "buffer-embed"}));

// Are we in an iframe?
// Order important here, as we don't want Chrome to evaluate window.parent.frames, as
// window.parent will be undefined, but this has to work cross browser.
//
// Chrome evaluates window.top !== window as true, but Firefox evaluates it as false
// becuase the iframe is placed in its own sandbox.
xt.iframe =  (window.top !== window || (window.frames.length === 0 && window.parent.frames.length > 0));