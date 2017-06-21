'use strict';
var nanoajax = require('nanoajax');

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
  this.options = options || {};
  var defaultOptions = {historyTimeout: 120000, statsTimeout: 60000, path: {history: '/played', stats: '/stats'}, streamID: 1};
  for(var property in defaultOptions) {
    if(defaultOptions.hasOwnProperty(property) && !this.options.hasOwnProperty(property)) {
      this.options[property] = defaultOptions[property];
    }
  }

  this.audio = new Audio(url+'/;');

  this.statsFetchedEvent = new CustomEvent('statsFetched', {detail: null});
  this.historyFetchedEvent = new CustomEvent('historyFetched', {detail: null});

  this.statsInterval = null;
  this.historyInterval = null;

  this.mute = function () {
    this.audio.mute=!this.audio.mute;
  };
  this.fetchResource = function(fetchOptions) {
    nanoajax.ajax({url: 'https://crossorigin.me/'+fetchOptions.path}, function(status, data) {
      if(status === 200) {
        try {
          data = JSON.parse(data);
          for(var key in data) {
            if( data.hasOwnProperty(key) && typeof data[key] === 'string') {
              data[key] = escapeHTML(data[key]);
            }
          }
          fetchOptions.customEvent = new CustomEvent(fetchOptions.resourceType+'Fetched', {detail: {response: data, error: null}});
          document.dispatchEvent(fetchOptions.customEvent);
          return 0;
        } catch (e) {}
      }
        fetchOptions.customEvent = new CustomEvent(fetchOptions.resourceType+'Fetched', {detail: {response: null, error: 1}});
        document.dispatchEvent(fetchOptions.customEvent);
    }.bind(this));
  };
  this.fetchStats = function() {
    this.fetchResource({
      customEvent: this.statsFetchedEvent,
      resourceType: 'stats',
      path: this.url+this.options.path.stats+'?json=1&sid='+this.options.streamID
    });
  };
  this.fetchHistory = function() {
    this.fetchResource({
      customEvent: this.historyFetchedEvent,
      resourceType: 'history',
      path: this.url+this.options.path.history+'?type=json&sid='+this.options.streamID
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
