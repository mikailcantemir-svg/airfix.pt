/**
 * AirFix — Stitch premium (menu mobile, fade-in, ano, galeria)
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());

    var menuBtn = document.getElementById('menuBtn');
    var mobileNav = document.getElementById('mobileNav');
    if (menuBtn && mobileNav) {
      var menuOpenLabel = menuBtn.getAttribute('data-menu-open') || 'Abrir menu';
      var menuCloseLabel = menuBtn.getAttribute('data-menu-close') || 'Fechar menu';
      function setMenuOpen(open) {
        mobileNav.classList.toggle('open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? menuCloseLabel : menuOpenLabel);
      }
      menuBtn.addEventListener('click', function () {
        setMenuOpen(!mobileNav.classList.contains('open'));
      });
      mobileNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          setMenuOpen(false);
        });
      });
    }

    document.querySelectorAll('.language-switcher').forEach(function (switcher) {
      var button = switcher.querySelector('.language-current');
      if (!button) return;

      button.addEventListener('click', function (event) {
        event.preventDefault();
        var isOpen = switcher.classList.toggle('open');
        button.setAttribute('aria-expanded', String(isOpen));
      });

      document.addEventListener('click', function (event) {
        if (!switcher.contains(event.target)) {
          switcher.classList.remove('open');
          button.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          switcher.classList.remove('open');
          button.setAttribute('aria-expanded', 'false');
        }
      });
    });

    var fadeEls = document.querySelectorAll('.fade-in');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      fadeEls.forEach(function (el) { el.classList.add('visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.1 });
      fadeEls.forEach(function (el) { io.observe(el); });
    }

    initWorksSection();
    initGalleryLightbox();
  });

  function initWorksSection() {
    var section = document.getElementById('trabalhos');
    if (!section) return;
    var hasCards = section.querySelectorAll('.work-card').length > 0;
    if (hasCards) {
      section.hidden = false;
      section.removeAttribute('data-works-empty');
    } else {
      section.hidden = true;
      section.setAttribute('data-works-empty', 'true');
    }
  }

  function isVideoSrc(src) {
    return /\.(mp4|webm|ogg)(\?|$)/i.test(src || '');
  }

  function initGalleryLightbox() {
    var lightbox = document.getElementById('galleryLightbox');
    if (!lightbox) return;

    var img = lightbox.querySelector('.gallery-lightbox__image');
    var video = lightbox.querySelector('.gallery-lightbox__video');
    var counter = lightbox.querySelector('.gallery-lightbox__counter');
    var meta = lightbox.querySelector('.gallery-lightbox__meta');
    var btnPrev = lightbox.querySelector('.gallery-lightbox__prev');
    var btnNext = lightbox.querySelector('.gallery-lightbox__next');
    var items = [];
    var index = 0;
    var lastFocus = null;
    var touchStartX = 0;
    var touchStartY = 0;

    function parseGallery(card) {
      var raw = card.getAttribute('data-gallery');
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) {
            return parsed.map(function (item) {
              if (typeof item === 'string') {
                return {
                  type: isVideoSrc(item) ? 'video' : 'image',
                  src: item,
                  alt: '',
                  poster: ''
                };
              }
              var src = item.src || item.full || '';
              var type = item.type || (isVideoSrc(src) ? 'video' : 'image');
              return {
                type: type,
                src: src,
                alt: item.alt || '',
                caption: item.caption || '',
                poster: item.poster || ''
              };
            }).filter(function (item) { return item.src; });
          }
        } catch (err) {
          /* ignore invalid JSON */
        }
      }
      var thumb = card.querySelector('.work-card__image');
      if (thumb && thumb.getAttribute('src')) {
        return [{
          type: 'image',
          src: thumb.getAttribute('data-full') || thumb.getAttribute('src'),
          alt: thumb.getAttribute('alt') || '',
          caption: '',
          poster: ''
        }];
      }
      return [];
    }

    function stopVideo() {
      if (!video) return;
      try { video.pause(); } catch (err) { /* ignore */ }
      video.removeAttribute('src');
      video.removeAttribute('poster');
      video.load();
      video.hidden = true;
    }

    function updateNavVisibility() {
      var multi = items.length > 1;
      if (btnPrev) btnPrev.hidden = !multi;
      if (btnNext) btnNext.hidden = !multi;
    }

    function showSlide(nextIndex) {
      if (!items.length) return;
      index = (nextIndex + items.length) % items.length;
      var item = items[index];
      var isVideo = item.type === 'video';

      stopVideo();
      if (img) {
        img.hidden = !!isVideo;
        if (!isVideo) {
          img.src = item.src;
          img.alt = item.alt || '';
        } else {
          img.removeAttribute('src');
          img.alt = '';
        }
      }

      if (video && isVideo) {
        video.hidden = false;
        if (item.poster) video.setAttribute('poster', item.poster);
        video.setAttribute('aria-label', item.alt || '');
        video.src = item.src;
        video.load();
      }

      if (counter) {
        counter.textContent = (index + 1) + ' / ' + items.length;
      }
      if (meta) {
        meta.textContent = item.caption || '';
        meta.hidden = !item.caption;
      }
    }

    function openLightbox(card, startIndex) {
      items = parseGallery(card);
      if (!items.length) return;

      var title = card.querySelector('.work-card__title');
      var location = card.querySelector('.work-card__location');
      var category = card.querySelector('.work-card__category');
      var text = card.querySelector('.work-card__text');
      var parts = [];
      if (category) parts.push(category.textContent.trim());
      if (title) parts.push(title.textContent.trim());
      if (location) parts.push(location.textContent.trim());
      var summary = parts.filter(Boolean).join(' · ');
      var detail = text && text.textContent.trim() ? text.textContent.trim() : summary;

      items = items.map(function (item) {
        return {
          type: item.type || 'image',
          src: item.src,
          poster: item.poster || '',
          alt: item.alt || summary,
          caption: item.caption || detail
        };
      });

      lastFocus = document.activeElement;
      document.body.classList.add('gallery-open');
      lightbox.hidden = false;
      updateNavVisibility();
      showSlide(typeof startIndex === 'number' ? startIndex : 0);
      var closeBtn = lightbox.querySelector('.gallery-lightbox__close');
      if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      document.body.classList.remove('gallery-open');
      stopVideo();
      if (img) {
        img.hidden = false;
        img.removeAttribute('src');
        img.alt = '';
      }
      items = [];
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
      lastFocus = null;
    }

    document.querySelectorAll('.work-card').forEach(function (card) {
      var trigger = card.querySelector('.work-card__trigger') || card;
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        openLightbox(card, 0);
      });
    });

    lightbox.querySelectorAll('[data-lightbox-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeLightbox();
      });
    });

    if (btnPrev) {
      btnPrev.addEventListener('click', function () {
        showSlide(index - 1);
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', function () {
        showSlide(index + 1);
      });
    }

    document.addEventListener('keydown', function (event) {
      if (lightbox.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showSlide(index - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showSlide(index + 1);
      }
    });

    var panel = lightbox.querySelector('.gallery-lightbox__panel');
    if (panel) {
      panel.addEventListener('touchstart', function (event) {
        if (!event.changedTouches || !event.changedTouches.length) return;
        if (event.target && event.target.closest && event.target.closest('video')) return;
        touchStartX = event.changedTouches[0].clientX;
        touchStartY = event.changedTouches[0].clientY;
      }, { passive: true });

      panel.addEventListener('touchend', function (event) {
        if (!event.changedTouches || !event.changedTouches.length) return;
        if (event.target && event.target.closest && event.target.closest('video')) return;
        var dx = event.changedTouches[0].clientX - touchStartX;
        var dy = event.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx > 0) showSlide(index - 1);
        else showSlide(index + 1);
      }, { passive: true });
    }
  }
})();
