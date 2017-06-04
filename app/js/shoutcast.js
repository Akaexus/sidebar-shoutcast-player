'use strict';
var jsonp = require('browser-jsonp');

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

  this.statsFetchedEvent = new CustomEvent('statsFetched', {detail: null}),
  this.historyFetchedEvent = new CustomEvent('historyFetched', {detail: null});

  this.statsInterval = null;
  this.historyInterval = null;

  this.mute = function () {
    this.audio.mute=!this.audio.mute;
  }
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
  }
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
  }
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
  }
  this.stopFetching = function() {
    clearInterval(this.statsInterval);
    clearInterval(this.historyInterval);
  }
  this.play = function() {
    this.audio.play();
    this.fetch(this.statsCallback, this.historyCallback);
  }
  this.pause = function() {
    this.audio.pause();
    this.stopFetching();
  }
  this.mute = function() {
    this.audio.muted = true;
  }
  this.unmute = function() {
    this.audio.muted = false;
  }
}
