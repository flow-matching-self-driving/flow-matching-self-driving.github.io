window.HELP_IMPROVE_VIDEOJS = false;

var INTERP_BASE = "./static/interpolation/stacked";
var NUM_INTERP_FRAMES = 365;

var interp_images = [];
function preloadInterpolationImages() {
  for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
    var path = INTERP_BASE + '/comparison' + String(i).padStart(3, '0') + '.jpg';
    interp_images[i] = new Image();
    interp_images[i].src = path;
  }
}

function setInterpolationImage(i) {
  var image = interp_images[i];
  image.ondragstart = function() { return false; };
  image.oncontextmenu = function() { return false; };
  $('#interpolation-image-wrapper').empty().append(image);
}


$(document).ready(function() {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

    });

    var options = {
			slidesToScroll: 1,
			slidesToShow: 3,
			loop: true,
			infinite: true,
			autoplay: false,
			autoplaySpeed: 3000,
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
    	// Add listener to  event
    	carousels[i].on('before:show', state => {
    		console.log(state);
    	});
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
    	// bulmaCarousel instance is available as element.bulmaCarousel
    	element.bulmaCarousel.on('before-show', function(state) {
    		console.log(state);
    	});
    }

    /*var player = document.getElementById('interpolation-video');
    player.addEventListener('loadedmetadata', function() {
      $('#interpolation-slider').on('input', function(event) {
        console.log(this.value, player.duration);
        player.currentTime = player.duration / 100 * this.value;
      })
    }, false);*/
    preloadInterpolationImages();

    $('#interpolation-slider').on('input', function(event) {
      setInterpolationImage(this.value);
    });
    setInterpolationImage(0);
    $('#interpolation-slider').prop('max', NUM_INTERP_FRAMES - 1);

    bulmaSlider.attach();

    // Ensure GIFs animate reliably across browsers by refreshing their src
    function restartGif(imgEl) {
      if (!imgEl || !imgEl.src) return;
      // Clone node approach tends to reliably restart animations across browsers
      var currentSrc = imgEl.src;
      var baseSrc = currentSrc.split('?_gif_reload=')[0].split('&_gif_reload=')[0];
      var separator = baseSrc.indexOf('?') === -1 ? '?' : '&';
      var refreshedSrc = baseSrc + separator + '_gif_reload=' + Date.now();

      var newImg = imgEl.cloneNode(true);
      newImg.src = refreshedSrc;
      if (imgEl.parentNode) {
        imgEl.parentNode.replaceChild(newImg, imgEl);
      }
      return newImg;
    }

    // Immediately refresh visible GIFs in the visualizations section
    var vizGifs = document.querySelectorAll('#visualizations img.gif-auto');
    vizGifs.forEach(function(img) { restartGif(img); });

    // Refresh GIFs when they come into view (for long pages)
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            restartGif(entry.target);
          }
        });
      }, { rootMargin: '0px', threshold: 0.2 });

      vizGifs.forEach(function(img) { observer.observe(img); });
    }

    // Also run once after full window load to catch late resources
    window.addEventListener('load', function() {
      var laterGifs = document.querySelectorAll('#visualizations img.gif-auto');
      laterGifs.forEach(function(img) { restartGif(img); });
    });

    // Continuously loop GIFs by restarting them on a timer (fallback if GIFs aren't encoded to loop)
    function scheduleGifLoop(imgEl) {
      var defaultMs = 6000; // fallback interval if unknown
      var loopMs = parseInt(imgEl.getAttribute('data-loop-ms') || defaultMs, 10);
      // avoid duplicate timers
      if (imgEl._gifLoopTimer) return;
      var currentEl = imgEl;
      imgEl._gifLoopTimer = setInterval(function() {
        currentEl = restartGif(currentEl) || currentEl;
      }, loopMs);
    }
    document.querySelectorAll('#visualizations img.gif-auto').forEach(scheduleGifLoop);

    // Prefer videos if available: auto-replace GIFs with looping, muted videos of the same basename
    function tryUpgradeToVideo(imgEl) {
      var src = imgEl.getAttribute('src');
      if (!src) return;
      var base = src.replace(/\.(gif|png|jpg|jpeg)$/i, '');
      var candidates = [
        base + '.webm',
        base + '.mp4'
      ];

      var video = document.createElement('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.setAttribute('loop', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('preload', 'auto');
      video.style.width = '100%';
      video.style.height = 'auto';
      video.setAttribute('aria-label', imgEl.getAttribute('alt') || '');

      candidates.forEach(function(url) {
        var source = document.createElement('source');
        source.src = url;
        if (url.endsWith('.webm')) source.type = 'video/webm';
        if (url.endsWith('.mp4')) source.type = 'video/mp4';
        video.appendChild(source);
      });

      var replaced = false;
      function replaceWithVideo() {
        if (replaced) return;
        replaced = true;
        if (imgEl.parentNode) {
          imgEl.parentNode.replaceChild(video, imgEl);
          // stop any scheduled gif loop
          if (imgEl._gifLoopTimer) clearInterval(imgEl._gifLoopTimer);
          video.play().catch(function() {});
        }
      }

      // If video can play, upgrade
      video.addEventListener('loadeddata', replaceWithVideo, { once: true });
      // Fallback timeout: if not playable soon, keep GIF
      setTimeout(function() {
        // no-op if upgraded
      }, 2000);
    }
    document.querySelectorAll('#visualizations img.gif-auto').forEach(tryUpgradeToVideo);
})
