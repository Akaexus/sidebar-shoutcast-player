/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	var Shoutcast = __webpack_require__(1);

	function Player(url, element) {
	  this.unknownCover = 'http://i.imgur.com/NpYCAVP.png';

	  this.stream =  new Shoutcast(url);
	  this.player = element;
	  this.currentCover = 0;
	  this.historyFetched = 0;
	  this.historyUnfetched = 0;
	  this.history = [];

	  this.state = 'paused';
	  this.mutedState = false;
	  this.dom = {
	    cover: '.cover > .image',
	    backgroundCover: '.background-cover',
	    artist: '.artist',
	    streamname: '.streamname',
	    streamer: '.info > .meta > .streamer',
	    songtitle: '.songtitle',
	    prevCoverButton: '.info > .cover > .triangle.triangle-left',
	    nextCoverButton: '.info > .cover > .triangle.triangle-right',
	    listeners: '.info > .stats > .listeners',
	    maxlisteners: '.info > .stats > .maxlisteners',
	    volume: '.info > .volume > input[type=range]'
	  };
	  for(var key in this.dom) {
	    if(this.dom.hasOwnProperty(key)) {
	      this.dom[key] = document.querySelector(this.dom[key]);
	    }
	  }
	  this.playButton = element.querySelector('.playbutton');
	  this.muteButton = element.querySelector('.mute');
	  this.stopButton = element.querySelector('.stop');
	  this.play = function() {
	    if(this.state === 'stopped' || this.state === 'paused') {
	      this.stream.play();
	      this.state = 'playing';
	    } else {
	      this.stream.pause();
	      this.state = 'paused';
	    }
	    this.updateControls();
	  };

	  this.mute = function() {
	    if(this.mutedState) {
	      this.stream.unmute();
	    } else {
	      this.stream.mute();
	    }
	    this.mutedState = !this.mutedState;
	    if(this.mutedState) {
	      this.muteButton.classList.add('muted');
	    } else {
	      this.muteButton.classList.remove('muted');
	    }
	  };

	  this.stop = function()  {
	    this.stream.audio.currentTime = 0;
	    var temp = this.stream.audio.src;
	    this.stream.audio.src = '';
	    this.stream.audio.src = temp;
	    this.state = 'stopped';
	    this.updateControls();
	  };
	  this.updateControls = function() {
	    if(this.state === 'playing') {
	      this.playButton.classList.add('paused');
	    } else if(this.state === 'paused') {
	      this.playButton.classList.remove('paused');
	    } else if(this.state === 'stopped') {
	      this.playButton.classList.remove('paused');
	      this.stopButton.classList.toggle('stopped');
	    }
	  };
	  this.setCover = function(nth) {
	    this.currentCover = nth;
	    if(this.history[0].fetched) {
	      if(nth === 0) {
	        this.dom.nextCoverButton.classList.add('disabled');
	      } else if(nth === this.history.length-1) {
	        this.dom.prevCoverButton.classList.add('disabled');
	      } else {
	        this.dom.prevCoverButton.classList.remove('disabled');
	        this.dom.nextCoverButton.classList.remove('disabled');
	      }
	      var coverUrl;
	      if(this.history[nth].fetched.hasOwnProperty('cover')) {
	        coverUrl = this.history[nth].fetched.cover;
	        this.dom.songtitle.textContent = this.history[nth].fetched.trackName;
	        this.dom.artist.textContent = this.history[nth].fetched.artist;
	      } else {
	        coverUrl = this.unknownCover;
	        this.dom.songtitle.textContent = this.history[nth].title.split(' - ')[0];
	        this.dom.artist.textContent = this.history[nth].title.split(' - ')[1] || ' ';
	      }
	      this.dom.cover.style.background = '#323232 url(\''+coverUrl+'\') no-repeat 50% 50% / cover';
	      this.dom.backgroundCover.style.background = '#323232 url(\''+coverUrl+'\') no-repeat 50% 50%/auto 110%';
	    }
	  };
	  this.nextCover = function() {
	    if(this.currentCover>0) {
	      this.currentCover--;
	      this.setCover(this.currentCover);
	    }
	    return this.currentCover;
	  };
	  this.prevCover = function() {
	    if(this.currentCover<(this.history.length-1)) {
	      this.currentCover++;
	      this.setCover(this.currentCover);
	    }
	    return this.currentCover;
	  };
	  this.updateVolume = function(event) {
	    this.stream.setVolume(event.target.value);
	  };
	  this.songExistsInHistory = function(song) {
	    for(var i=0; i<this.history.length; i++) {
	      if(song.playedat === this.history[i].playedat) {
	        return true;
	      }
	    }
	    return false;
	  };
	  this.mergeHistory = function(_history) {
	    _history = _history.reverse();
	    _history.map(function(song) {
	      if(!this.songExistsInHistory(song)) {
	        this.history.unshift(song);
	      }
	    }, this);
	  };
	  this.countUnfetched = function() {
	    var count = 0;
	    this.history.map(function(song) {
	      if(!song.hasOwnProperty('fetched')) {
	        count++;
	      }
	    }, this);
	    return count;
	  };
	  this.playButton.addEventListener('click', this.play.bind(this));
	  this.muteButton.addEventListener('click', this.mute.bind(this));
	  this.stopButton.addEventListener('click', this.stop.bind(this));
	  this.dom.volume.addEventListener('input', this.updateVolume.bind(this));
	  this.dom.nextCoverButton.addEventListener('click', this.nextCover.bind(this));
	  this.dom.prevCoverButton.addEventListener('click', this.prevCover.bind(this));
	  document.addEventListener('statsFetched', function(event) {
	    if(!event.detail.error) {
	      this.dom.streamname.textContent = event.detail.response.servertitle;
	      this.dom.streamer.textContent = event.detail.response.servergenre;
	      this.dom.listeners.textContent = event.detail.response.currentlisteners;
	      this.dom.maxlisteners.textContent = event.detail.response.maxlisteners;
	    }
	  }.bind(this));
	  document.addEventListener('historyFetched', function(event) {
	    var self = this;
	    this.mergeHistory(event.detail.response);
	    console.log(this.history);
	    this.history.map(function(song) {
	      console.log(song, !song.hasOwnProperty('fetched')?'fetching':'not fetching');
	        if(!song.hasOwnProperty('fetched')) {
	          this.historyUnfetched++;
	        var xhr = new XMLHttpRequest();
	        xhr.open('GET', 'https://itunes.apple.com/search?media=music&term='+song.title.replace(/,* +(|-|&)* */g, '+'), true);
	        xhr.addEventListener('readystatechange', function() {
	          if(this.readyState === this.DONE && this.status === 200) {
	            var songInfo = this.responseText!==''?JSON.parse(this.responseText):null;
	            if(songInfo !== null && songInfo.resultCount>0) {
	              var current = songInfo.results[0];
	              song.fetched = {
	                trackName: current.trackName,
	                artist: current.artistName,
	                cover: current.artworkUrl100
	              };
	            } else {
	              song.fetched = {};
	            }
	            self.historyFetched++;
	            if(self.historyUnfetched === self.historyFetched) {
	              self.historyUnfetched = 0;
	              self.historyFetched = 0;
	              self.setCover(0);
	              console.log(self.history);
	            }
	          }
	        });
	        xhr.send(null);
	      }
	    }, this);
	  }.bind(this));
	}

	document.addEventListener('DOMContentLoaded', function() {
	  window.player = new Player('http://4stream.pl:18240', document.getElementById('player'));
	});


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	var jsonp = __webpack_require__(2);

	function escapeHTML(string) {
	  var entityMap = {
	    '&': '&amp;',
	    '<': '&lt;',
	    '>': '&gt;',
	    '"': '&quot;',
	    "'": '&#39;',
	    '/': '&#x2F;',
	    '`': '&#x60;',
	    '=': '&#x3D;'
	  };
	  return string.split('').map(function(letter) {return entityMap[letter] || letter;}).join('');
	}
	module.exports = function(url, options) {
	  this.url = url;
	  this.options = options || {historyTimeout: 45000, statsTimeout: 20000, path: {history: '/played', stats: '/stats'}, streamID: 1};

	  this.audio = new Audio(url+'/;');

	  this.statsFetchedEvent = new CustomEvent('statsFetched', {detail: null});
	  this.historyFetchedEvent = new CustomEvent('historyFetched', {detail: null});

	  this.statsInterval = null;
	  this.historyInterval = null;

	  this.mute = function () {
	    this.audio.mute=!this.audio.mute;
	  };
	  this.fetchStats = function() {
	    jsonp({
	      url: this.url+this.options.path.stats+'?json=1&sid='+this.options.streamID,
	      success: function(response) {
	        for(var key in response) {
	          if( response.hasOwnProperty(key) && typeof response[key] === 'string') {
	            response[key] = escapeHTML(response[key]);
	          }
	        }
	        this.historyFetchedEvent = new CustomEvent('statsFetched', {detail: {response: response, error: null}});
	        document.dispatchEvent(this.historyFetchedEvent);
	      },
	      error: function(error) {
	        this.historyFetchedEvent = new CustomEvent('statsFetched', {detail: {response: null, error: error}});
	        document.dispatchEvent(this.historyFetchedEvent);
	      }
	    });
	  };
	  this.fetchHistory = function() {
	    jsonp({
	      url: this.url+this.options.path.history+'?type=json',
	      success: function(response) {
	        for(var key in response) {
	          if( response.hasOwnProperty(key) && typeof response[key] === 'string') {
	            response[key] = escapeHTML(response[key]);
	          }
	        }
	        this.historyFetchedEvent = new CustomEvent('historyFetched', {detail: {response: response, error: null}});
	        document.dispatchEvent(this.historyFetchedEvent);
	      },
	      error: function(error) {
	        this.historyFetchedEvent = new CustomEvent('historyFetched', {detail: {response: null, error: error}});
	        document.dispatchEvent(this.historyFetchedEvent);
	      }
	    });
	  };
	  this.fetch = function(statsCallback, historyCallback) {
	    this.fetchHistory(historyCallback);
	    this.fetchStats(statsCallback);
	    this.statsInterval = setInterval(
	      function() {
	        this.fetchStats(statsCallback);
	      }.bind(this), this.options.statsTimeout);

	    this.historyInterval = setInterval(
	      function() {
	        this.fetchHistory(historyCallback);
	      }.bind(this), this.options.historyTimeout);
	  };
	  this.stopFetching = function() {
	    clearInterval(this.statsInterval);
	    clearInterval(this.historyInterval);
	  };
	  this.play = function() {
	    this.audio.play();
	    this.fetch(this.statsCallback, this.historyCallback);
	  };
	  this.pause = function() {
	    this.audio.pause();
	    this.stopFetching();
	  };
	  this.mute = function() {
	    this.audio.muted = true;
	  };
	  this.unmute = function() {
	    this.audio.muted = false;
	  };
	  this.setVolume = function(level) {
	    if(level>=0 && level<=1) {
	      this.audio.volume = level;
	      return true;
	    } else {
	      return false;
	    }
	  };
	};


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {(function() {
	  var JSONP, computedUrl, createElement, encode, noop, objectToURI, random, randomString;

	  createElement = function(tag) {
	    return window.document.createElement(tag);
	  };

	  encode = window.encodeURIComponent;

	  random = Math.random;

	  JSONP = function(options) {
	    var callback, callbackFunc, callbackName, done, head, params, script;
	    if (options == null) {
	      options = {};
	    }
	    params = {
	      data: options.data || {},
	      error: options.error || noop,
	      success: options.success || noop,
	      beforeSend: options.beforeSend || noop,
	      complete: options.complete || noop,
	      url: options.url || ''
	    };
	    params.computedUrl = computedUrl(params);
	    if (params.url.length === 0) {
	      throw new Error('MissingUrl');
	    }
	    done = false;
	    if (params.beforeSend({}, params) !== false) {
	      callbackName = options.callbackName || 'callback';
	      callbackFunc = options.callbackFunc || 'jsonp_' + randomString(15);
	      callback = params.data[callbackName] = callbackFunc;
	      window[callback] = function(data) {
	        window[callback] = null;
	        params.success(data, params);
	        return params.complete(data, params);
	      };
	      script = createElement('script');
	      script.src = computedUrl(params);
	      script.async = true;
	      script.onerror = function(evt) {
	        params.error({
	          url: script.src,
	          event: evt
	        });
	        return params.complete({
	          url: script.src,
	          event: evt
	        }, params);
	      };
	      script.onload = script.onreadystatechange = function() {
	        var ref, ref1;
	        if (done || ((ref = this.readyState) !== 'loaded' && ref !== 'complete')) {
	          return;
	        }
	        done = true;
	        if (script) {
	          script.onload = script.onreadystatechange = null;
	          if ((ref1 = script.parentNode) != null) {
	            ref1.removeChild(script);
	          }
	          return script = null;
	        }
	      };
	      head = window.document.getElementsByTagName('head')[0] || window.document.documentElement;
	      head.insertBefore(script, head.firstChild);
	    }
	    return {
	      abort: function() {
	        window[callback] = function() {
	          return window[callback] = null;
	        };
	        done = true;
	        if (script != null ? script.parentNode : void 0) {
	          script.onload = script.onreadystatechange = null;
	          script.parentNode.removeChild(script);
	          return script = null;
	        }
	      }
	    };
	  };

	  noop = function() {
	    return void 0;
	  };

	  computedUrl = function(params) {
	    var url;
	    url = params.url;
	    url += params.url.indexOf('?') < 0 ? '?' : '&';
	    url += objectToURI(params.data);
	    return url;
	  };

	  randomString = function(length) {
	    var str;
	    str = '';
	    while (str.length < length) {
	      str += random().toString(36).slice(2, 3);
	    }
	    return str;
	  };

	  objectToURI = function(obj) {
	    var data, key, value;
	    data = (function() {
	      var results;
	      results = [];
	      for (key in obj) {
	        value = obj[key];
	        results.push(encode(key) + '=' + encode(value));
	      }
	      return results;
	    })();
	    return data.join('&');
	  };

	  if ("function" !== "undefined" && __webpack_require__(4) !== null ? __webpack_require__(5) : void 0) {
	    !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	      return JSONP;
	    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
	    module.exports = JSONP;
	  } else {
	    this.JSONP = JSONP;
	  }

	}).call(this);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)(module)))

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ }),
/* 4 */
/***/ (function(module, exports) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ }),
/* 5 */
/***/ (function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ })
/******/ ]);