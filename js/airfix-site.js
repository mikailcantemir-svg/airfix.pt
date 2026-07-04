/**
 * AirFix — Stitch premium (menu mobile, fade-in, ano)
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
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    fadeEls.forEach(function (el) { io.observe(el); });
  });
})();
