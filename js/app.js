const albumCoverArt = document.getElementById('albumCoverArt');
const trackTitle = document.getElementById('trackTitle');
const artist = document.getElementById('artist');
const tvCanvas = document.getElementById('tv');
const box = document.querySelector('.box');

function wallpaperMediaPropertiesListener(event) {
  trackTitle.textContent = event.title || "Unknown Title";
  artist.textContent = event.artist || "Unknown Artist";
}

function wallpaperMediaThumbnailListener(event) {  
  const realImageSrc = event.thumbnail || 'images/mydesk_real.jpg';
  const albumCoverArt = document.getElementById('albumCoverArt');

  const img = new Image();
  img.src = realImageSrc;
  img.onload = function () {
    albumCoverArt.src = realImageSrc;  //TODO: fix this
  };

  trackTitle.style.color = textColor;
  artist.style.color = textColor;
}

function wallpaperMediaPlaybackListener(event) {
  if(event.state == window.wallpaperMediaIntegration.playback.PLAYBACK_STOPPED){
    albumCoverArt.src = 'images/mydesk_real.jpg';
  }
}

if (window.wallpaperRegisterMediaPropertiesListener) {
  window.wallpaperRegisterMediaPropertiesListener(wallpaperMediaPropertiesListener);
}
if (window.wallpaperRegisterMediaThumbnailListener) {
  window.wallpaperRegisterMediaThumbnailListener(wallpaperMediaThumbnailListener);
}
if(window.wallpaperRegisterMediaPlaybackListener){
  window.wallpaperRegisterMediaPlaybackListener(wallpaperMediaPlaybackListener);
}


(function() {
  "use strict";

  var context = tvCanvas.getContext("gl") || tvCanvas.getContext("2d"),
      scaleFactor = 2.5,
      samples = [],
      sampleIndex = 0,
      scanOffsetY = 0,
      scanSize = 0,
      FPS = 50,
      scanSpeed = FPS * 5,
      SAMPLE_COUNT = 10;

  var noiseOpacity = 0.7; 

  function updateCanvasSize() {
    const boxRect = box.getBoundingClientRect();
    tvCanvas.width = boxRect.width;
    tvCanvas.height = boxRect.height;
    scanSize = (tvCanvas.height / scaleFactor) / 3;

    samples = [];
    for (var i = 0; i < SAMPLE_COUNT; i++)
      samples.push(generateRandomSample(context, tvCanvas.width, tvCanvas.height));
  }

  window.onresize = updateCanvasSize;
  updateCanvasSize();

  function interpolate(x, x0, y0, x1, y1) {
    return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
  }

  function generateRandomSample(context, w, h) {  
    var intensity = [];
    var random = 0;
    var factor = h / 50;
    var trans = noiseOpacity;  

    var intensityCurve = [];
    for (var i = 0; i < Math.floor(h / factor) + factor; i++)
      intensityCurve.push(Math.floor(Math.random() * 15));

    for (var i = 0; i < h; i++) {
      var value = interpolate((i / factor), Math.floor(i / factor), intensityCurve[Math.floor(i / factor)], Math.floor(i / factor) + 1, intensityCurve[Math.floor(i / factor) + 1]);
      intensity.push(value);
    }

    var imageData = context.createImageData(w, h);
    for (var i = 0; i < (w * h); i++) {
      var k = i * 4;
      var color = Math.floor(36 * Math.random());
      color += intensity[Math.floor(i / w)];
      imageData.data[k] = imageData.data[k + 1] = imageData.data[k + 2] = color;
      imageData.data[k + 3] = Math.round(255 * trans);  
    }
    return imageData;
  }

  function render() {
    context.putImageData(samples[Math.floor(sampleIndex)], 0, 0);

    sampleIndex += 20 / FPS;
    if (sampleIndex >= samples.length) sampleIndex = 0;

    var grd = context.createLinearGradient(0, scanOffsetY, 0, scanSize + scanOffsetY);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(0.1, 'rgba(255,255,255,0)');
    grd.addColorStop(0.2, 'rgba(255,255,255,0.1)');
    grd.addColorStop(0.3, 'rgba(255,255,255,0.0)');
    grd.addColorStop(0.45, 'rgba(255,255,255,0.1)');
    grd.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    grd.addColorStop(0.55, 'rgba(255,255,255,0.1)');
    grd.addColorStop(0.6, 'rgba(255,255,255,0.1)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');

    context.fillStyle = grd;
    context.fillRect(0, scanOffsetY, tvCanvas.width, scanSize + scanOffsetY);
    context.globalCompositeOperation = "lighter";

    scanOffsetY += (tvCanvas.height / scanSpeed);
    if (scanOffsetY > tvCanvas.height) scanOffsetY = -(scanSize / 2);

    window.requestAnimationFrame(render);
  }

  window.onresize();
  window.requestAnimationFrame(render);
})();
