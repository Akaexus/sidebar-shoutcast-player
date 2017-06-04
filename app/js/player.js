var jsonp = require('browser-jsonp');

'use strict';


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

function Shoutcast(url, audioElement options) {
  this.url = url;
  this.options = options || {played: 45000, stats: 20000, path: {played: '/played', stats: '/stats'}};
  this.fetchStats = function(callback) {
    jsonp({
      url: this.url+this.options.path.stats+'?json=1&sid=1',
      success: callback
    });
  }
  this.fetchPlayed = function(callback) {
    jsonp({
      url: this.url+this.options.path.played+'?type=json',
      success: callback
    });
  }
}

var stream = new Shoutcast('http://184.173.142.117:13228');
stream.fetchStats(function(data) {
  console.log(data);
})
