'use strict';
var Shoutcast = require('./shoutcast.js');

function Player(url, element) {
  this.unknownCover = 'http://i.imgur.com/NpYCAVP.png';

  this.stream =  new Shoutcast(url);
  this.player = element;
  this.currentCover = 0;
  this.historyCount = 0;
  this.history = null;

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
    maxlisteners: '.info > .stats > .maxlisteners'
  };
  for(var key in this.dom) {
    this.dom[key] = document.querySelector(this.dom[key]);
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
  }

  this.mute = function() {
    if(this.mutedState) {
      this.stream.unmute();
    } else {
      this.stream.mute();
    }
    this.mutedState = !this.mutedState;
    this.updateControls();
  }

  this.stop = function()  {
    this.stream.audio.currentTime = 0;
    var temp = this.stream.audio.src;
    this.stream.audio.src = '';
    this.stream.audio.src = temp;
    this.state = 'stopped';
    this.updateControls();
  }
  this.updateControls = function() {
    if(this.state === 'playing') {
      this.playButton.classList.add('paused');
    } else if(this.state === 'paused') {
      this.playButton.classList.remove('paused');
    } else if(this.state === 'stopped') {
      this.playButton.classList.remove('paused');
      this.stopButton.classList.toggle('stopped');
    }
    if(this.mutedState) {
      this.muteButton.classList.add('muted');
    } else {
      this.muteButton.classList.remove('muted');
    }
  }
  this.setCover = function(nth) {
    this.currentCover = nth;
    if(this.history[0].fetched) {
      if(nth === 0) {
        this.dom.nextCoverButton.classList.add('disabled');
      } else if(nth == this.history.length-1) {
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
  }
  this.nextCover = function() {
    if(this.currentCover>0) {
      this.currentCover--;
      this.setCover(this.currentCover);
    }
    return this.currentCover;
  }
  this.prevCover = function() {
    if(this.currentCover<(this.history.length-1)) {
      this.currentCover++;
      this.setCover(this.currentCover);
    }
    return this.currentCover;
  }
  this.playButton.addEventListener('click', this.play.bind(this));
  this.muteButton.addEventListener('click', this.mute.bind(this));
  this.stopButton.addEventListener('click', this.stop.bind(this));
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
    this.history = event.detail.response;
    this.history.map(function(song) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://itunes.apple.com/search?media=music&term='+song.title.replace(/,* +(|-|&)* */g, '+'), true);
      xhr.addEventListener('readystatechange', function() {
        if(this.readyState === this.DONE && this.status === 200) {
          var songInfo = this.responseText!=''?JSON.parse(this.responseText):null;
          if(songInfo != null && songInfo.resultCount>0) {
            var current = songInfo.results[0];
            song.fetched = {
              trackName: current.trackName,
              artist: current.artistName,
              cover: current.artworkUrl100
            };
          } else {
            song.fetched = {};
          }
          self.historyCount++;
          if(self.historyCount === self.history.length) {
            self.historyCount = 0;
            self.setCover(0);
          }
        }
      });
      xhr.send(null);
    });
  }.bind(this));
}

document.addEventListener('DOMContentLoaded', function() {
  window.player = new Player('http://4stream.pl:18240', document.getElementById('player'));
});
