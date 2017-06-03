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
  return string.split('').map(letter => entityMap[letter] || letter).join('');
}

class Shoutcast {
  constructor(url, options) {
    this.url = url;
    this.options = options || {played: 45000, stats: 20000, path: {played: '/played', stats: '/stats'}};
  }
  fetchStats(callback) {
    JSONP({
      url: `${this.url}${this.options.path.stats}?json=1&sid=1`,
      success: callback
    });
  }
  fetchPlayed(callback) {
    JSONP({
      url: `${this.url}${this.options.path.played}?type=json`,
      success: callback
    });
  }
}
