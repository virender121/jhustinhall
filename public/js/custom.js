/* ANIMATED NAVICON */
( function( $ ) {
$(document).ready(function(){

  var forEach=function(t,o,r){if("[object Object]"===Object.prototype.toString.call(t))for(var c in t)Object.prototype.hasOwnProperty.call(t,c)&&o.call(r,t[c],c,t);else for(var e=0,l=t.length;l>e;e++)o.call(r,t[e],e,t)};
  var hamburgers = document.querySelectorAll(".mobile-toggle");
  if (hamburgers.length > 0) {
    forEach(hamburgers, function(hamburger) {
    hamburger.addEventListener("click", function() {
      this.classList.toggle("is-active");
    }, false);
    });
  }
	$(window).scroll(function() {      
     $("header").affix({
        offset:{
            top:0
        }
     });

});

  $('.mobile-toggle').click (function() {
 $('#nav').toggleClass('is-active');
    $('body').toggleClass('overflow-y');
  });

	/* Banner slider*/

	$('#banner').owlCarousel({
		loop:true,
		margin:0,
		nav: false,
        dots:false,
    // autoHeight: true,
		autoplay : true,
		autoplaySpeed: 1000,
        animateOut: 'fadeOut',
		responsive:{
			0:{

				items:1
			}
		}
	});

	$('#watch-videos').owlCarousel({
    loop:true,
    margin:0,
    nav: true,
    dots:false,
    // autoHeight: true,
    autoplay : false,
    autoplaySpeed: 1000,
    animateOut: 'fadeOut',
    responsive:{
      0:{

        items:1
      }
    }
  });

$(window).on("load", function() {

  // Equal height script
  $('.store figure img').matchHeight({ property: 'height' });
  $('.store p').matchHeight({ property: 'height' });
  $('.news p').matchHeight({ property: 'height' });
  $('.insta a figure img').matchHeight({ property: 'height' });
  $('.official-store .products h2').matchHeight({ property: 'height' });
  $('.membership .gallery .grid-item img').matchHeight({ property: 'height' });
	
	
});

// 	$(document).on('click', 'a[href^="#"]', function (event) {
//     event.preventDefault();

//     $('html, body').animate({
//         scrollTop: $($.attr(this, 'href')).offset().top
//     }, 1000);
// });

// $(window).scroll(function() {      
//      $("header").affix({
//         offset:{
//             top:100
//         }
//      });
// });
	
$('#member-gallery').owlCarousel({
   loop:true,
   margin:0,
   nav: false,
   dots:false,
   autoplay : true,
   autoplayTimeout: 2000,
   smartSpeed: 1500,
   animateOut: 'fadeOut',
   responsive:{
     0:{
      items:1
     },
     400:{
       items:2
      },
      600:{
        items:3
      },
      992:{
        items:4
      },
      1200:{
        items:5
      }
    }
  }); 

  //$('#gallery').owlCarousel({
   // loop:true,
  //  margin:0,
  //  nav: false,
   // dots:false,
   // autoplay : true,
    //autoplaySpeed: 1000,
   // autoplayTimeout: 2000,
   // smartSpeed: 1500,
   // animateOut: 'fadeOut',
   // responsive:{
   //   0:{
   //     items:1
   //   },
  //    400:{
  //      items:2
   //   },
   //   600:{
  //      items:3
  //    },
  //    992:{
  //      items:4
   //   },
  //    1200:{
  //      items:5
  //    }
  //  }
  //});
    
 jQuery(document).ready(function($) {
  var $gallery = $('#member-gallery');
  
  // Wait until all images are completely downloaded, then fire Flickity
  $gallery.imagesLoaded( function() {
    $gallery.flickity({
      cellAlign: 'left',
      contain: true,
      wrapAround: true,
      pageDots: false,
      autoPlay: true
    });
  });
});
    
  
    
	
  $('#home-gallery').owlCarousel({
    loop:true,
    margin:0,
    nav: false,
    dots:false,
	autoplay: true,
    autoplayTimeout: 3500,
    autoplaySpeed: 800,
    autoplayHoverPause: true,
    animateOut: 'fadeOut',
    responsive:{
      0:{
        items:1
      },
      479:{
        items:1
      },
      600:{
        items:2
      },
	  767:{
        items:3
      },
      992:{
        items:4
      },
      1200:{
        items:5
      }
    }
  });
	

	
   $('.grid-item').magnificPopup({
   delegate: 'a',
   type: 'image',
   tLoading: 'Loading image #%curr%...',
   mainClass: 'mfp-img-mobile',
   gallery: {
   enabled: true,
   navigateByImgClick: true,
   preload: [0,1] // Will preload 0 - before current, and 1 after the current image
   }
   });	
    
    
    
jQuery('.carousel-main').flickity({
  contain: true,
  pageDots: false,
  prevNextButtons: false,
});
jQuery('.carousel-nav').flickity({
  asNavFor: '.carousel-main',
  contain: true,
  pageDots: false
});
jQuery('.carousel-main').on( 'settle.flickity', function() {
  newTarg = jQuery(".carousel-cell.flex-video").not('.is-selected');
  jQuery(newTarg).find('iframe').each(function() { 
        var src= $(this).attr('src');
        $(this).attr('src',src);  
});
   
});    
    
	
jQuery('#exampleModal1').on('hidden.bs.modal', function (e) {
  // do something...
  jQuery('#exampleModal1 video .embed-responsive-item').attr("src", jQuery("#exampleModal1 video .embed-responsive-item").attr("src"));
});
	
  });
} )( jQuery );

  jQuery(document).ready(function($) {
    var heroBanner = $('#banner');
      
    if (heroBanner.hasClass('owl-loaded')) {
      heroBanner.trigger('destroy.owl.carousel');
    }
    
    // Fallback initializer if theme engine didn't catch it i have to remove
    heroBanner.owlCarousel({
      items: 1,
      loop: true,
      autoplay: true,
      autoplayTimeout: 3000, // Changes slides every 3 seconds
      autoplayHoverPause: true,
      nav: true,
      dots: true
    });
  });

(function () {
  var track   = document.getElementById('testimonial-track');
  var dots    = document.querySelectorAll('#testimDots .cdot');
  var slides  = document.querySelectorAll('#testimonial-track .slide');
  var modal   = document.getElementById('testimModal');
  var video   = document.getElementById('testimVideo');
  var total   = slides.length;
  var current = 0;
  var timer;
  var isTransitioning = false;

  if (!track || !total) return;

  // Clone first slide and append to end of track
  var firstClone = slides[0].cloneNode(true);
  firstClone.classList.add('clone');
  track.appendChild(firstClone);

  // Re-attach play event to cloned slide
  var clonePlayBtn = firstClone.querySelector('.play-trigger');
  if (clonePlayBtn) {
    clonePlayBtn.addEventListener('click', function (e) {
      e.preventDefault();
      video.src = this.dataset.video;
      modal.classList.add('open');
      clearInterval(timer);
    });
  }

  // Move to a position instantly (no animation)
  function jumpTo(n) {
    track.style.transition = 'none';
    track.style.transform = 'translateX(-' + (n * 100) + '%)';
  }

  // Move to a position with animation
  function goTo(n) {
    if (isTransitioning) return;
    isTransitioning = true;
    current = n;
    track.style.transition = 'transform 0.5s ease';
    track.style.transform = 'translateX(-' + (current * 100) + '%)';

    // Update dots (wrap dot index for clone slide)
    var dotIndex = current >= total ? 0 : current;
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === dotIndex);
    });
  }

  // After transition ends — if on clone, jump back to real first
  track.addEventListener('transitionend', function () {
    isTransitioning = false;
    if (current >= total) {
      current = 0;
      jumpTo(0);
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === 0);
      });
    }
  });

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () {
      goTo(current + 1);
    }, 3000);
  }

  // Next — always go forward only
  document.getElementById('testimNext').addEventListener('click', function () {
    goTo(current + 1);
    startTimer();
  });

  // Prev — go back but never go before 0
  document.getElementById('testimPrev').addEventListener('click', function () {
    if (current === 0) {
      // Jump to clone position at end, then go back one
      jumpTo(total);
      // Small delay to let browser register the jump before animating
      setTimeout(function () {
        goTo(total - 1);
      }, 20);
    } else {
      goTo(current - 1);
    }
    startTimer();
  });

  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      goTo(parseInt(d.dataset.i));
      startTimer();
    });
  });

  // Play button opens modal
  document.querySelectorAll('.play-trigger').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      video.src = this.dataset.video;
      modal.classList.add('open');
      clearInterval(timer);
    });
  });

  // Close modal on X
  document.getElementById('testimClose').addEventListener('click', closeModal);

  // Close modal on overlay click
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  function closeModal() {
    video.pause();
    video.src = '';
    modal.classList.remove('open');
    startTimer();
  }

  startTimer();
})();
