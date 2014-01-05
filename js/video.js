/*
This file is part of VideoJS. Copyright 2010 Zencoder, Inc.

VideoJS is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

VideoJS is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with VideoJS.  If not, see <http://www.gnu.org/licenses/>.
*/

// Store a list of players on the page for reference
var videoJSPlayers = new Array();

// Using jresig's Class implementation http://ejohn.org/blog/simple-javascript-inheritance/
(function(){var initializing=false, fnTest=/xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/; this.Class = function(){}; Class.extend = function(prop) { var _super = this.prototype; initializing = true; var prototype = new this(); initializing = false; for (var name in prop) { prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn){ return function() { var tmp = this._super; this._super = _super[name]; var ret = fn.apply(this, arguments); this._super = tmp; return ret; }; })(name, prop[name]) : prop[name]; } function Class() { if ( !initializing && this.init ) this.init.apply(this, arguments); } Class.prototype = prototype; Class.constructor = Class; Class.extend = arguments.callee; return Class;};})();

// Video JS Player Class
var VideoJS = Class.extend({

  // Initialize the player for the supplied video tag element
  // element: video tag
  // num: the current player's position in the videoJSPlayers array
  init: function(element, setOptions){

    this.video = element;

    // Default Options
    this.options = {
      num: 0, // Optional tracking of videoJSPLayers position
      controlsBelow: false, // Display control bar below video vs. on top
      controlsHiding: true, // Hide controls when not over the video
      defaultVolume: 0.85, // Will be overridden by localStorage volume if available
      flashVersion: 9,
      linksHiding: true
    };
    // Override default options with set options
    if (typeof setOptions == "object") _V_.merge(this.options, setOptions);

    this.box = this.video.parentNode;
    this.flashFallback = this.getFlashFallback();
    this.linksFallback = this.getLinksFallback();
    this.percentLoaded = 0;

    if (VideoJS.browserSupportsVideo()) {
      if (this.canPlaySource() == false) {
        this.hideLinksFallback();
        this.replaceWithFlash();
        return;
      }
      else 
	{
	  document.getElementById('novidp').style.display="none";
	}
    } else if (VideoJS.browserFlashVersion() >= this.options.flashVersion) {
      //      this.hideLinksFallback();
      return;
    } else {
      return;
    }

    this.hideLinksFallback();

    if (VideoJS.isIpad()) {
      this.options.controlsBelow = true;
      this.options.controlsHiding = false;
    }

    if (this.options.controlsBelow) {
      _V_.addClass(this.box, "vjs-controls-below");
    }

    this.buildPoster();
    this.showPoster();

    // Hide default controls
    this.video.controls = false;

    this.buildController();
    this.showController();

    // Position & show controls when data is loaded
    this.video.addEventListener("loadeddata", this.onLoadedData.context(this), false);

    // Listen for when the video is played
    this.video.addEventListener("play", this.onPlay.context(this), false);
    // Listen for when the video is paused
    this.video.addEventListener("pause", this.onPause.context(this), false);
    // Listen for when the video ends
    this.video.addEventListener("ended", this.onEnded.context(this), false);
    // Listen for a volume change
    this.video.addEventListener('volumechange',this.onVolumeChange.context(this),false);
    // Listen for video errors
    this.video.addEventListener('error',this.onError.context(this),false);
    // Listen for Video Load Progress (currently does not if html file is local)
    this.video.addEventListener('progress', this.onProgress.context(this), false);
    // Set interval for load progress using buffer watching method
    this.watchBuffer = setInterval(this.updateBufferedTotal.context(this), 33);

    // Listen for clicks on the play/pause button
    this.playControl.addEventListener("click", this.onPlayControlClick.context(this), false);
    // Make a click on the video act like a click on the play button.
    this.video.addEventListener("click", this.onPlayControlClick.context(this), false);
    // Make a click on the poster act like a click on the play button.
    if (this.poster) this.poster.addEventListener("click", this.onPlayControlClick.context(this), false);

    // Listen for drags on the progress bar
    this.progressHolder.addEventListener("mousedown", this.onProgressHolderMouseDown.context(this), false);
    // Listen for a release on the progress bar
    this.progressHolder.addEventListener("mouseup", this.onProgressHolderMouseUp.context(this), false);

    // Set to stored volume OR 85%
    this.setVolume(localStorage.volume || this.options.defaultVolume);
    // Listen for a drag on the volume control
    this.volumeControl.addEventListener("mousedown", this.onVolumeControlMouseDown.context(this), false);
    // Listen for a release on the volume control
    this.volumeControl.addEventListener("mouseup", this.onVolumeControlMouseUp.context(this), false);
    // Set the display to the initial volume
    this.updateVolumeDisplay();

    // Listen for clicks on the button
    this.fullscreenControl.addEventListener("click", this.onFullscreenControlClick.context(this), false);

    // Listen for the mouse move the video. Used to reveal the controller.
    this.video.addEventListener("mousemove", this.onVideoMouseMove.context(this), false);
    // Listen for the mouse moving out of the video. Used to hide the controller.
    this.video.addEventListener("mouseout", this.onVideoMouseOut.context(this), false);

    // Listen for the mouse move the poster image. Used to reveal the controller.
    if (this.poster) this.poster.addEventListener("mousemove", this.onVideoMouseMove.context(this), false);
    // Listen for the mouse moving out of the poster image. Used to hide the controller.
    if (this.poster) this.poster.addEventListener("mouseout", this.onVideoMouseOut.context(this), false);

    // Have to add the mouseout to the controller too or it may not hide.
    // For some reason the same isn't needed for mouseover
    this.controls.addEventListener("mouseout", this.onVideoMouseOut.context(this), false);

    // Create listener for esc key while in full screen mode
    // Creating it during initialization to add context
    // and because it has to be removed with removeEventListener
    this.onEscKey = function(event){
      if (event.keyCode == 27) {
        this.fullscreenOff();
      }
    }.context(this);

    this.onWindowResize = function(event){
      this.positionController();
    }.context(this);

    // Support older browsers that used autobuffer
    this.fixPreloading()
  },
  
  // Support older browsers that used "autobuffer"
  fixPreloading: function(){
    if (typeof this.video.hasAttribute == "function" && this.video.hasAttribute("preload")) {
      this.video.autobuffer = true;
    }
  },

  buildController: function(){

    /* Creating this HTML
      <ul class="vjs-controls">
        <li class="vjs-play-control vjs-play">
          <span></span>
        </li>
        <li class="vjs-progress-control">
          <ul>
            <li class="vjs-progress-holder">
              <span class="vjs-load-progress"></span><span class="vjs-play-progress"></span>
            </li>
            <li class="vjs-progress-time">
              <span class="vjs-current-time-display">00:00</span><span> / </span><span class="vjs-duration-display">00:00</span>
            </li>
          </ul>
        </li>
        <li class="vjs-volume-control">
          <ul>
            <li></li><li></li><li></li><li></li><li></li><li></li>
          </ul>
        </li>
        <li class="vjs-fullscreen-control">
          <ul>
            <li></li><li></li><li></li><li></li>
          </ul>
        </li>
      </ul>
    */

    // Create a list element to hold the different controls
    this.controls = _V_.createElement("ul", { className: "vjs-controls" });
    // Add the controls to the video's container
    this.video.parentNode.appendChild(this.controls);

    // Build the play control
    this.playControl = _V_.createElement("li", { className: "vjs-play-control vjs-play", innerHTML: "<span></span>" });
    this.controls.appendChild(this.playControl);

    // Build the progress control
    this.progressControl = _V_.createElement("li", { className: "vjs-progress-control" });
    this.controls.appendChild(this.progressControl);

    // Create a list for the different progress elements
    this.progressList = document.createElement("ul");
    this.progressControl.appendChild(this.progressList);

    // Create a holder for the progress bars
    this.progressHolder = _V_.createElement("li", { className: "vjs-progress-holder" });
    this.progressList.appendChild(this.progressHolder);

    // Create the loading progress display
    this.loadProgress = _V_.createElement("span", { className: "vjs-load-progress" });
    this.progressHolder.appendChild(this.loadProgress)

    // Create the playing progress display
    this.playProgress = _V_.createElement("span", { className: "vjs-play-progress" });
    this.progressHolder.appendChild(this.playProgress);

    // Create the progress time display (00:00 / 00:00)
    this.progressTime = _V_.createElement("li", { className: "vjs-progress-time" });
    this.progressList.appendChild(this.progressTime);

    // Create the current play time display
    this.currentTimeDisplay = _V_.createElement("span", { className: "vjs-current-time-display", innerHTML: "00:00" });
    this.progressTime.appendChild(this.currentTimeDisplay);

    // Add time separator
    this.timeSeparator = _V_.createElement("span", { innerHTML: " / " });
    this.progressTime.appendChild(this.timeSeparator);

    // Create the total duration display
    this.durationDisplay = _V_.createElement("span", { className: "vjs-duration-display", innerHTML: "00:00" });
    this.progressTime.appendChild(this.durationDisplay);

    // Create the volumne control
    this.volumeControl = _V_.createElement("li", {
      className: "vjs-volume-control",
      innerHTML: "<ul><li></li><li></li><li></li><li></li><li></li><li></li></ul>"
    });
    this.controls.appendChild(this.volumeControl);
    this.volumeDisplay = this.volumeControl.children[0]

    // Crete the fullscreen control
    this.fullscreenControl = _V_.createElement("li", {
      className: "vjs-fullscreen-control",
      innerHTML: "<ul><li></li><li></li><li></li><li></li></ul>"
    });
    this.controls.appendChild(this.fullscreenControl);
  },

  // Get the download links block element
  getLinksFallback: function(){
    return this.box.getElementsByTagName("P")[0];
  },

  // Hide no-video download paragraph
  hideLinksFallback: function(){
      if (this.options.linksHiding && this.linksFallback) this.linksFallback.style.display = "none";
  },

  getFlashFallback: function(){
    if (VideoJS.isIE()) return;
    var children = this.box.getElementsByClassName("vjs-flash-fallback");
    for (var i=0; i<children.length; i++) {
      if (children[i].tagName.toUpperCase() == "OBJECT") {
        return children[i];
      }
    }
  },

  replaceWithFlash: function(){
    // this.flashFallback = this.video.removeChild(this.flashFallback);
    this.box.appendChild(this.flashFallback);
    this.video.style.display = "none"; // Removing it was breaking later players
    document.getElementById('novidp').style.display="block"; // Display the buffering/download message
  },

  // Show the controller
  showController: function(){
    this.controls.style.display = "block";
    this.positionController();
  },

  // Place controller relative to the video's position
  positionController: function(){
    // Make sure the controls are visible
    if (this.controls.style.display == 'none') return;

    if (this.options.controlsBelow) {
      if(this.videoIsFullScreen) {
        this.box.style.height = "";
        this.video.style.height = (this.box.offsetHeight - this.controls.offsetHeight) + "px";
      } else {
        this.video.style.height = "";
        this.box.style.height = this.video.offsetHeight + this.controls.offsetHeight + "px";
      }
      this.controls.style.top = this.video.offsetHeight + "px";
    } else {
      this.controls.style.top = (this.video.offsetHeight - this.controls.offsetHeight) + "px";
    }

    this.controls.style.width = this.video.offsetWidth + "px";
    this.sizeProgressBar();
  },

  // Hide the controller
  hideController: function(){
    if (this.options.controlsHiding) this.controls.style.display = "none";
  },

  // Update poster source from attribute or fallback image
  // iPad breaks if you include a poster attribute, so this fixes that
  updatePosterSource: function(){
    if (!this.video.poster) {
      var images = this.video.getElementsByTagName("img");
      var y=location.href;
      var parts=y.split("/");
      var i=0;
      var stitch="";
      while(i<parts.length-1)
	{
	  stitch=stitch+parts[i]+"/";
	  i++;
	}
      if (images.length > 0 && images[0].src!=stitch+"modular/no_vid.png") this.video.poster = images[0].src;
    }
  },

  buildPoster: function(){
    this.updatePosterSource();
    if (this.video.poster) {
      this.poster = document.createElement("img");
      // Add poster to video box
      this.video.parentNode.appendChild(this.poster);

      // Add poster image data
      this.poster.src = this.video.poster;
      // Add poster styles
      this.poster.className = "vjs-poster";
    } else {
      this.poster = false;
    }
  },

  // Add the video poster to the video's container, to fix autobuffer/preload bug
  showPoster: function(){
    if (!this.poster) return;
    this.poster.style.display = "block";
    this.positionPoster();
  },

  // Size the poster image
  positionPoster: function(){
    // Only if the poster is visible
    if (this.poster == false || this.poster.style.display == 'none') return;
    this.poster.style.height = this.video.offsetHeight + "px";
    this.poster.style.width = this.video.offsetWidth + "px";
  },

  hidePoster: function(){
    if (!this.poster) return;
    this.poster.style.display = "none";
  },

  canPlaySource: function(){
    var children = this.video.children;
    for (var i=0; i<children.length; i++) {
      if (children[i].tagName.toUpperCase() == "SOURCE") {
        var canPlay = this.video.canPlayType(children[i].type);
        if(canPlay == "probably" || canPlay == "maybe") {
          return true;
        }
      }
    }
    return false;
  },

  // When the video is played
  onPlay: function(event){
    this.playControl.className = "vjs-play-control vjs-pause";
    this.hidePoster();
    this.trackPlayProgress();
  },

  // When the video is paused
  onPause: function(event){
    this.playControl.className = "vjs-play-control vjs-play";
    this.stopTrackingPlayProgress();
  },

  // When the video ends
  onEnded: function(event){
    this.video.pause();
    this.onPause();
  },

  onVolumeChange: function(event){
    this.updateVolumeDisplay();
  },

  onError: function(event){
    console.log(event);
    console.log(this.video.error);
  },

  onLoadedData: function(event){
    this.showController();
  },

  // When the video's load progress is updated
  // Does not work in all browsers (Safari/Chrome 5)
  onProgress: function(event){
    if(event.total > 0) {
      this.setLoadProgress(event.loaded / event.total);
    }
  },

  // Buffer watching method for load progress.
  // Used for browsers that don't support the progress event
  updateBufferedTotal: function(){
    if (this.video.buffered) {
      if (this.video.buffered.length >= 1) {
        this.setLoadProgress(this.video.buffered.end(0) / this.video.duration);
        if (this.video.buffered.end(0) == this.video.duration) {
          clearInterval(this.watchBuffer);
        }
      }
    } else {
      clearInterval(this.watchBuffer);
    }
  },

  setLoadProgress: function(percentAsDecimal){
    if (percentAsDecimal > this.percentLoaded) {
      this.percentLoaded = percentAsDecimal;
      this.updateLoadProgress();
    }
  },

  updateLoadProgress: function(){
    if (this.controls.style.display == 'none') return;
    this.loadProgress.style.width = (this.percentLoaded * (this.progressHolder.offsetWidth - 2)) + "px";
  },

  // React to clicks on the play/pause button
  onPlayControlClick: function(event){
    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  },

  // Adjust the play position when the user drags on the progress bar
  onProgressHolderMouseDown: function(event){
    this.stopTrackingPlayProgress();

    if (this.video.paused) {
      this.videoWasPlaying = false;
    } else {
      this.videoWasPlaying = true;
      this.video.pause();
    }

    _V_.blockTextSelection();
    document.onmousemove = function(event) {
      this.setPlayProgressWithEvent(event);
    }.context(this);

    document.onmouseup = function(event) {
      _V_.unblockTextSelection();
      document.onmousemove = null;
      document.onmouseup = null;
      if (this.videoWasPlaying) {
        this.video.play();
        this.trackPlayProgress();
      }
    }.context(this);
  },

  // When the user stops dragging on the progress bar, update play position
  // Backup for when the user only clicks and doesn't drag
  onProgressHolderMouseUp: function(event){
    this.setPlayProgressWithEvent(event);
  },

  // Adjust the volume when the user drags on the volume control
  onVolumeControlMouseDown: function(event){
    _V_.blockTextSelection();
    document.onmousemove = function(event) {
      this.setVolumeWithEvent(event);
    }.context(this);
    document.onmouseup = function() {
      _V_.unblockTextSelection();
      document.onmousemove = null;
      document.onmouseup = null;
    }.context(this);
  },

  // When the user stops dragging, set a new volume
  // Backup for when the user only clicks and doesn't drag
  onVolumeControlMouseUp: function(event){
    this.setVolumeWithEvent(event);
  },

  // When the user clicks on the fullscreen button, update fullscreen setting
  onFullscreenControlClick: function(event){
    if (!this.videoIsFullScreen) {
      this.fullscreenOn();
    } else {
      this.fullscreenOff();
    }
  },

  onVideoMouseMove: function(event){
    this.showController();
    clearInterval(this.mouseMoveTimeout);
    this.mouseMoveTimeout = setTimeout(function(){ this.hideController(); }.context(this), 4000);
  },

  onVideoMouseOut: function(event){
    // Prevent flicker by making sure mouse hasn't left the video
    var parent = event.relatedTarget;
    while (parent && parent !== this.video && parent !== this.controls) {
      parent = parent.parentNode;
    }
    if (parent !== this.video && parent !== this.controls) {
      this.hideController();
    }
  },

  // Adjust the width of the progress bar to fill the controls width
  sizeProgressBar: function(){
    this.progressControl.style.width = (
      this.controls.offsetWidth 
      - this.playControl.offsetWidth
      - this.volumeControl.offsetWidth
      - this.fullscreenControl.offsetWidth
    ) - (5*5) + "px";
    this.progressHolder.style.width = (this.progressControl.offsetWidth - (this.progressTime.offsetWidth + 20)) + "px";
    this.updatePlayProgress();
    this.updateLoadProgress();
  },

  // Track & display the current play progress
  trackPlayProgress: function(){
    this.playProgressInterval = setInterval(function(){ this.updatePlayProgress(); }.context(this), 33);
  },

  // Turn off play progress tracking (when paused)
  stopTrackingPlayProgress: function(){
    clearInterval(this.playProgressInterval);
  },

  // Ajust the play progress bar's width based on the current play time
  updatePlayProgress: function(){
    if (this.controls.style.display == 'none') return;
    this.playProgress.style.width = ((this.video.currentTime / this.video.duration) * (this.progressHolder.offsetWidth - 2)) + "px";
    this.updateTimeDisplay();
  },

  // Update the play position based on where the user clicked on the progresss bar
  setPlayProgress: function(newProgress){
    this.video.currentTime = newProgress * this.video.duration;
    this.playProgress.style.width = newProgress * (this.progressHolder.offsetWidth - 2)  + "px";
    this.updateTimeDisplay();
  },

  setPlayProgressWithEvent: function(event){
    var newProgress = _V_.getRelativePosition(event.pageX, this.progressHolder);
    this.setPlayProgress(newProgress);
  },

  // Update the displayed time (00:00)
  updateTimeDisplay: function(){
    this.currentTimeDisplay.innerHTML = _V_.formatTime(this.video.currentTime);
    if (this.video.duration) this.durationDisplay.innerHTML = _V_.formatTime(this.video.duration);
  },

  // Set a new volume based on where the user clicked on the volume control
  setVolume: function(newVol){
    this.video.volume = parseFloat(newVol);
    localStorage.volume = this.video.volume;
  },

  setVolumeWithEvent: function(event){
    var newVol = _V_.getRelativePosition(event.pageX, this.volumeControl.children[0]);
    this.setVolume(newVol);
  },

  // Update the volume control display
  // Unique to these default controls. Uses borders to create the look of bars.
  updateVolumeDisplay: function(){
    var volNum = Math.ceil(this.video.volume * 6);
    for(var i=0; i<6; i++) {
      if (i < volNum) {
        this.volumeDisplay.children[i].style.borderColor = "#fff";
      } else {
        this.volumeDisplay.children[i].style.borderColor = "#555";
      }
    }
  },

  // Turn on fullscreen (window) mode
  // Real fullscreen isn't available in browsers quite yet.
  fullscreenOn: function(){
    this.videoIsFullScreen = true;

    // Storing original doc overflow value to return to when fullscreen is off
    this.docOrigOverflow = document.documentElement.style.overflow;

    // Add listener for esc key to exit fullscreen
    document.addEventListener("keydown", this.onEscKey, false);

    // Add listener for a window resize
    window.addEventListener("resize", this.onWindowResize, false);

    // Hide any scroll bars
    document.documentElement.style.overflow = 'hidden';

    // Apply fullscreen styles
    _V_.addClass(this.box, "vjs-fullscreen");

    // Resize the controller and poster
    this.positionController();
    this.positionPoster();
  },

  // Turn off fullscreen (window) mode
  fullscreenOff: function(){
    this.videoIsFullScreen = false;

    document.removeEventListener("keydown", this.onEscKey, false);
    window.removeEventListener("resize", this.onWindowResize, false);

    // Unhide scroll bars.
    document.documentElement.style.overflow = this.docOrigOverflow;

    // Remove fullscreen styles
    _V_.removeClass(this.box, "vjs-fullscreen");

    // Resize to original settings
    this.positionController();
    this.positionPoster();
  }
})

// Convenience Functions (mini library)
// Functions not specific to video or VideoJS and could be replaced with a library like jQuery
var _V_ = {
  addClass: function(element, classToAdd){
    if (element.className.split(/\s+/).lastIndexOf(classToAdd) == -1) element.className = element.className == "" ? classToAdd : element.className + " " + classToAdd;
  },

  removeClass: function(element, classToRemove){
    if (element.className.indexOf(classToRemove) == -1) return;
    var classNames = element.className.split(/\s+/);
    classNames.splice(classNames.lastIndexOf(classToRemove),1);
    element.className = classNames.join(" ");
  },

  merge: function(obj1, obj2){
    for (attrname in obj2) { obj1[attrname] = obj2[attrname]; }
    return obj1;
  },

  createElement: function(tagName, attributes){
    return _V_.merge(document.createElement(tagName), attributes);
  },

  // Attempt to block the ability to select text while dragging controls
  blockTextSelection: function(){
    document.body.focus();
    document.onselectstart = function () { return false; };
  },

  // Turn off text selection blocking
  unblockTextSelection: function(){
    document.onselectstart = function () { return true; };
  },

  // Return seconds as MM:SS
  formatTime: function(seconds) {
    seconds = Math.round(seconds);
    minutes = Math.floor(seconds / 60);
    minutes = (minutes >= 10) ? minutes : "0" + minutes;
    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    return minutes + ":" + seconds;
  },

  // Return the relative horizonal position of an event as a value from 0-1
  getRelativePosition: function(x, relativeElement){
    return Math.max(0, Math.min(1, (x - _V_.findPosX(relativeElement)) / relativeElement.offsetWidth));
  },

  // Get an objects position on the page
  findPosX: function(obj) {
    var curleft = obj.offsetLeft;
    while(obj = obj.offsetParent) {
      curleft += obj.offsetLeft;
    }
    return curleft;
  }
}

// Class Methods

// Add video-js to any video tag with the class
VideoJS.setup = function(options){
  var videoCount = document.getElementsByTagName("video").length
  for (var i=0;i<videoCount;i++) {
    videoTag = document.getElementsByTagName("video")[i];
    if (videoTag.className.indexOf("video-js") != -1) {
      options = (options) ? _V_.merge(options, { num: i }) : options;
      videoJSPlayers[i] = new VideoJS(videoTag, options);
    }
  }
}

// Check if the browser supports video.
VideoJS.browserSupportsVideo = function() {
  return !!document.createElement('video').canPlayType;
}

VideoJS.isIpad = function(){
  return navigator.userAgent.match(/iPad/i) != null;
}

VideoJS.browserFlashVersion = function(){
  if (typeof navigator.plugins != "undefined" && typeof navigator.plugins["Shockwave Flash"] == "object") {
    desc = navigator.plugins["Shockwave Flash"].description;
    if (desc && !(typeof navigator.mimeTypes != "undefined" && navigator.mimeTypes["application/x-shockwave-flash"] && !navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin)) {
      return parseInt(desc.match(/^.*\s+([^\s]+)\.[^\s]+\s+[^\s]+$/)[1]);
    }
  } else if (typeof window.ActiveXObject != "undefined") {
    try {
      var testObject = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
      if (testObject) {
        return parseInt(testObject.GetVariable("$version").match(/^[^\s]+\s(\d+)/)[1]);
      }
    }
    catch(e) { return false; }
  }
  return 0;
}

VideoJS.isIE = function(){
  return !+"\v1";
}

// Allows for binding context to functions
// when using in event listeners and timeouts
Function.prototype.context = function(obj) {
  var method = this
  temp = function() {
    return method.apply(obj, arguments)
  }
 return temp
}
