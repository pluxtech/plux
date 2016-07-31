// IE10 and up
// iOS 9.  not sure about lower.

/*!
 * jQuery Clipchamp MJPEG Player Plugin v0.0.1
 * https://github.com/clipchamp/jquery-clipchamp-mjpeg-player-plugin
 * 
 * Plays back MJPEG files produced by the clipchamp
 * online video converter, online video compressor, and
 * webcam recorder.
 *
 * Copyright 2015 zfaas Pty Ltd (clipchamp.com) 
 * https://clipchamp.com
 * https://zfaas.com
 *
 * Released under the MIT license
 */
 (function($) {
	var DEFAULT_FPS = 24,
		DEFAULT_AUTOLOOP = true,
	 // this was helpful: http://stackoverflow.com/questions/21702477/how-to-parse-mjpeg-http-stream-from-ip-camera
		JPEG_MAGIG_NUMBER = [0xff, 0xd8, 0xff];
		JPEG_MAGIC_NUMBER_STOP = [0xff, 0xd9];

	var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.setTimeout;

	function splitMJPEG(mjpegUrl, callback) {
		var xhr = new XMLHttpRequest();

		xhr.open('GET', mjpegUrl, true);
		if (xhr.overrideMimeType) xhr.overrideMimeType('application/octet-stream');	// fixes crash in ie10
		
		xhr.responseType = 'arraybuffer';
		
		xhr.onload = function(event) {
			// console.log(xhr.response);
			var array = new Uint8Array(xhr.response),
				startIndex,
				jpegs = [];

			for (var i=0, ii=array.length; i<ii; ++i) {
				if (array[i] === JPEG_MAGIG_NUMBER[0] && array[i+1] === JPEG_MAGIG_NUMBER[1] && array[i+2] === JPEG_MAGIG_NUMBER[2]) {
					startIndex = i;
				}
				if (array[i] === JPEG_MAGIC_NUMBER_STOP[0] && array[i+1] === JPEG_MAGIC_NUMBER_STOP[1]) {
					jpegs.push(new Blob([array.subarray(startIndex, i+2)], {type: 'image/jpeg'}));
				}
				
			}

			callback(jpegs);
		};

		xhr.send();
	};
	
	function playMJPEGInternal(wrapperElement, mjpegUrl, fps, autoloop) {
		fps = (typeof fps === 'number') ? fps : DEFAULT_FPS;
		autoloop = (typeof autoloop === 'boolean') ? autoloop : DEFAULT_AUTOLOOP;

		var paused = true;
		var runOnce = false;
		var reverse = false;
		var completionCallback;
		var nextFrameIndex = 0;
		var jpegCount = 0;
		
		var playbackFinished = false;
		var imageElement = document.createElement('img');
		var jpegUrl;

		// imageElement.setAttribute('style', 'padding: 0; margin: 0;');
		wrapperElement.appendChild(imageElement);
		

		splitMJPEG(mjpegUrl, function(jpegFiles) {
			if (jpegFiles.length > 0) {
				imageElement.setAttribute('style', 'width:100%;');
				
				jpegCount = jpegFiles.length;
				function showNextFrame() {
					if (imageElement) {
						if (paused && runOnce == false) {
							setTimeout(function() {
								showNextFrame();
							}, 150);
							return;
						}
						if (jpegUrl) {
							// URL.revokeObjectURL(jpegUrl);
						}
						if (nextFrameIndex >= jpegFiles.length) nextFrameIndex = jpegFiles.length-1; // check bounds since code can change nextFrameIndex externally
						jpegUrl = URL.createObjectURL(jpegFiles[nextFrameIndex]);
						if (!reverse) nextFrameIndex++;
						else nextFrameIndex--;

						imageElement.onload = function() {
							URL.revokeObjectURL(jpegUrl);
							var placeholder = wrapperElement.getElementsByClassName("mjpegPlayerPlaceholder")[0];
							if (placeholder) {
								wrapperElement.removeChild(placeholder);
							}
							wrapperElement.setAttribute('style','');	// get rid of temp padding tags wrapper from page load
							if (imageElement) {
								if (autoloop || nextFrameIndex < jpegFiles.length) {
									nextFrameIndex = (nextFrameIndex === jpegFiles.length) ? 0 : nextFrameIndex;
									nextFrameIndex = (nextFrameIndex === -1) ? jpegFiles.length-1 : nextFrameIndex;
									setTimeout(function() {
										requestAnimationFrame(showNextFrame);
									}, 1000/fps);
									
									// completion handler last keeps runOnce unencombered if it is set from handler
									if (nextFrameIndex == 0 && !reverse || nextFrameIndex == jpegFiles.length-1 && reverse) {
										if (typeof completionCallback === 'function') {
											completionCallback();
										}
									}
								}
								else {
									// finished one-shot
									if (typeof completionCallback === 'function') {
										completionCallback();
									}
								}
							}
						};
						imageElement.setAttribute('src', jpegUrl);
						runOnce = false;
					}
				};

				setTimeout(function() {
					requestAnimationFrame(showNextFrame);
				}, 1000/fps);
			}
		});

		return {
			finish: function() {
				if (imageElement) {
					imageElement.src = '';
					wrapperElement.removeChild(imageElement);
					imageElement = undefined;
				}
			},
			play: function() {
				if (imageElement) {
					this.setFrameIndex(0);
					this.reverse(false);
					paused = false;
				}
			},
			pause: function() {
				if (imageElement) {
					paused = true;
				}
			},
			unpause: function() {
				if (imageElement) {
					paused = false;
				}
			},
			playReverse: function() {
				if (imageElement) {
					this.setFrameIndex(jpegCount-1);
					this.reverse(true);
					paused = false;
				}
			},
			reverse: function(playInReverse) {
				if (imageElement) {
					reverse = playInReverse;
				}
			},
			reset: function() {
				this.setFrameIndex(0);
			},
			setCompletionCallback: function(callback) {
				completionCallback = callback;
			},
			setFrameIndex: function(frameIndex) {
				nextFrameIndex = frameIndex;
				runOnce = true;
			}
		};	
	};

	// optionally make available as jQuery plugin
	if (typeof $ === 'function') {
		$.fn.clipchamp_mjpeg_player = function(callback) {
			if (typeof callback === 'function') {
				return this.each(function() {
					callback(this, playMJPEGInternal(this, $(this).attr("data-url"), Number($(this).attr("data-framerate")), Boolean($(this).attr("data-loop"))));
				});
			} else {
				throw new Error('Callback must be given and must be a function');
			}

		}
	}

	// optionally provide AMD module definition
	if (typeof define === 'function') {
		define('jquery.clipchamp.mjpeg.player', [], function() {
			return {
				playMJPEG: function(wrapperElement, mjpegUrl, fps, autoloop) {
					if (wrapperElement instanceof Element) {
						if (typeof mjpegUrl === 'string') {
							return playMJPEGInternal(wrapperElement, mjpegUrl, fps, autoloop);
						} else {
							throw new Error('MJPEG URL must be a string');
						}
					} else {
						throw new Error('No parent element was given');
					}
				}
			};
		});
	}
} )


(typeof jQuery === 'function' ? jQuery : undefined);
