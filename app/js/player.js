'use strict';
var Shoutcast = require('./shoutcast.js');

function Player(url, element, options) {
  this.options = options || {};
  var defaultOptions = {
    historySize: 50,
    unknownCover: 'http://i.imgur.com/NpYCAVP.png'
  };
  for(var property in defaultOptions) {
    if(defaultOptions.hasOwnProperty(property) && !this.options.hasOwnProperty(property)) {
      this.options[property] = defaultOptions[property];
    }
  }
  this.stream =  new Shoutcast(url, options);
  this.player = element;
  this.currentCover = 0;
  this.historyFetched = 0;
  this.historyUnfetched = 0;
  this.history = [];

  this.state = 'paused';
  this.mutedState = false;
  this.dom = {
    player: '#player',
    coverParent: '.cover',
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
    volume: '.info > .volume > input[type=range]',
    canvas: '.info > .cover > canvas'
  };
  for(var key in this.dom) {
    if(this.dom.hasOwnProperty(key)) {
      this.dom[key] = document.querySelector(this.dom[key]);
    }
  }
  // Canvas
  this.ctx = null;
  if(this.dom.canvas) {
    this.ctx = this.dom.canvas.getContext('2d');
  }
  this.animFrame = null;
  this.maxSpectrumHeight = 0.1;

  //Controls
  this.playButton = element.querySelector('.playbutton');
  this.muteButton = element.querySelector('.mute');
  this.stopButton = element.querySelector('.stop');
  this.play = function() {
    if(this.state === 'stopped' || this.state === 'paused') {
      this.stream.play();
      this.state = 'playing';
      this.draw();
    } else {
      this.stream.pause();
      this.state = 'paused';
      window.cancelAnimationFrame(this.animFrame);
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
        coverUrl = this.options.unknownCover;
        this.dom.songtitle.textContent = this.history[nth].title.split(' - ')[0];
        this.dom.artist.textContent = this.history[nth].title.split(' - ')[1] || ' ';
      }
      this.dom.cover.style.background = '#323232 url(\''+coverUrl+'\') no-repeat 50% 50% / cover';
      this.dom.backgroundCover.style.background = '#323232 url(\''+coverUrl+'\') no-repeat 50% 50%/auto 110%';
    }
  };
  this.draw = function() {
    this.analyser.getByteFrequencyData(this.frequency);
    var nOfBars = parseInt(this.dom.canvas.width/3),
        freqLinesPerBar = parseInt(0.9*this.frequency.length/nOfBars);
    var bars = new Array(nOfBars);
    for(var i=0; i<nOfBars; i++) {
      var values = this.frequency.slice(freqLinesPerBar*i, freqLinesPerBar*(i+1));
      bars[i] = this.maxSpectrumHeight*values.reduce(function(a, b) {return a+b;})/values.length;
    }
    this.ctx.clearRect(0,0,this.dom.canvas.width,this.dom.canvas.height);
    var myGradient = this.ctx.createLinearGradient(0, 0, 0, this.dom.canvas.height);
    myGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
    myGradient.addColorStop(1, "rgba(255, 255, 255, 0.01)");
    this.ctx.fillStyle = myGradient;
    for(var i=0, offset = 0; i<bars.length; i++, offset+=3) {
      this.ctx.fillRect(0, offset, bars[i], 2);
      this.ctx.fillRect(this.dom.canvas.width, offset, -bars[i], 2);
    }

    this.animFrame = window.requestAnimationFrame(this.draw.bind(this));
  };
  this.initializeCanvas = function() {
    if(this.dom.canvas) {
      this.ctx.canvas.width = this.dom.coverParent.offsetWidth;
      this.ctx.canvas.height = this.dom.coverParent.offsetHeight;
      this.stream.audio.crossOrigin = 'anonymous';
      this.context = new AudioContext();
      this.analyser = this.context.createAnalyser();
      this.analyser.connect(this.context.destination);
      this.source = this.context.createMediaElementSource(this.stream.audio);
      this.source.connect(this.analyser);
      this.analyser.connect(this.context.destination);
      this.frequency = new Uint8Array(this.analyser.frequencyBinCount);
    } else {
      console.log('Chuj');
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
  this.initializeCanvas();
  document.addEventListener('historyFetched', function(event) {
    var self = this;
    this.mergeHistory(event.detail.response);
    this.history.map(function(song) {
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
