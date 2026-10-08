/* Tracking central. Nao altera o visual e nao le campos de formularios. */
(function () {
  if (window.SiteTracking) return;
  var config = window.TRACKING_CONFIG || {};
  var gaLoaded = false;
  var gtmLoaded = false;
  var clarityLoaded = false;
  var maskObserverInstalled = false;
  var scrollMarks = {};

  function clean(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
      .replace(/\d{6,}/g, "[numero]")
      .trim()
      .slice(0, 80);
  }

  function plain(value) {
    return clean(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function debugOn() {
    try { return localStorage.getItem("debugTracking") === "true"; }
    catch (error) { return false; }
  }

  function hasConsent() {
    if (!config.requireConsent) return true;
    if (config.consentGranted === true) return true;
    try { return localStorage.getItem("trackingConsent") === "granted"; }
    catch (error) { return false; }
  }

  function validGa(id) { return /^G-[A-Z0-9]+$/i.test(id || ""); }
  function validGtm(id) { return /^GTM-[A-Z0-9]+$/.test(id || ""); }
  function validClarity(id) { return /^[a-z0-9]+$/i.test(id || ""); }

  function vendorChoice() {
    var gtm = String(config.GOOGLE_TAG_MANAGER_ID || "").trim();
    var ga = String(config.GA4_MEASUREMENT_ID || "").trim();
    if (validGtm(gtm)) return { kind: "gtm", id: gtm };
    if (validGa(ga)) return { kind: "ga4", id: ga };
    return { kind: "none", id: "" };
  }

  function deviceType() {
    var width = window.innerWidth || 0;
    var ua = navigator.userAgent || "";
    if (/ipad|tablet/i.test(ua) || (width >= 768 && width <= 1024 && /android/i.test(ua))) return "tablet";
    if (width < 768 || /mobile|iphone|android/i.test(ua)) return "mobile";
    return "desktop";
  }

  function destinationOf(el) {
    var href = el.getAttribute("href") || "";
    if (!href) return "";
    try {
      var url = new URL(href, window.location.href);
      url.searchParams.delete("text");
      return clean(url.toString());
    } catch (error) {
      return clean(href.split("?")[0]);
    }
  }

  function buttonText(el) {
    if (!el || el.tagName === "INPUT" || el.tagName === "TEXTAREA") return "formulario";
    return clean(el.getAttribute("aria-label") || el.textContent || "");
  }

  function buttonLocation(el) {
    var explicit = el.getAttribute("data-track-location") || el.getAttribute("data-source-context") || "";
    if (explicit) return clean(explicit);
    if (el.closest("#whatsapp-float, .whatsapp-float, #wa-widget")) return "floating";
    if (el.closest("header, .site-header, .header")) return "header";
    if (el.closest(".hero, #inicio, #hero")) return "hero";
    if (el.closest("#contacto, #contact, .contact, .contact-section")) return "contact_section";
    if (el.closest("#trabalhos, #portfolio, .gallery, #recent-work, .recent-work")) return "portfolio_section";
    if (el.closest("#services, #servicos, .section-services")) return "services_section";
    return "content";
  }

  function baseParams(el, extra) {
    var params = {
      page_path: window.location.pathname || "/",
      page_title: clean(document.title),
      device_type: deviceType(),
      event_time: new Date().toISOString()
    };
    if (el) {
      params.button_text = buttonText(el);
      params.button_location = buttonLocation(el);
      params.destination_url = destinationOf(el);
    }
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        if (extra[key]) params[key] = clean(extra[key]);
      });
    }
    Object.keys(params).forEach(function (key) {
      if (!params[key]) delete params[key];
    });
    return params;
  }

  function log(name, params, dest) {
    if (!debugOn()) return;
    window.__trackingLog = window.__trackingLog || [];
    window.__trackingLog.push({ name: name, params: params, dest: dest });
    console.info("[tracking]", name, params, dest);
  }

  function maskNode(node) {
    if (!node || node.nodeType !== 1) return;
    if ((node.tagName === "INPUT" || node.tagName === "TEXTAREA" || node.tagName === "SELECT") && !node.hasAttribute("data-clarity-mask")) {
      node.setAttribute("data-clarity-mask", "true");
    }
    if (node.querySelectorAll) {
      node.querySelectorAll("input, textarea, select").forEach(function (field) {
        if (!field.hasAttribute("data-clarity-mask")) field.setAttribute("data-clarity-mask", "true");
      });
    }
  }

  function maskFields() {
    maskNode(document.body || document.documentElement);
    if (maskObserverInstalled || typeof MutationObserver !== "function" || !document.body) return;
    maskObserverInstalled = true;
    try {
      new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) maskNode(added[j]);
        }
      }).observe(document.body, { childList: true, subtree: true });
    } catch (error) { /* ignore */ }
  }

  function loadClarity(id) {
    if (clarityLoaded || !validClarity(id)) return;
    if (document.querySelector('script[src*="clarity.ms/tag/"]')) { clarityLoaded = true; return; }
    clarityLoaded = true;
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.clarity.ms/tag/" + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function loadGa4(id) {
    if (gaLoaded || !validGa(id)) return;
    if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) { gaLoaded = true; return; }
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function loadGtm(id) {
    if (gtmLoaded || !validGtm(id)) return;
    if (document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) { gtmLoaded = true; return; }
    gtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function loadVendors() {
    if (!hasConsent()) return;
    maskFields();
    var clarity = String(config.MICROSOFT_CLARITY_PROJECT_ID || "").trim();
    if (validClarity(clarity)) loadClarity(clarity);
    var choice = vendorChoice();
    if (choice.kind === "gtm") loadGtm(choice.id);
    if (choice.kind === "ga4") loadGa4(choice.id);
  }

  function send(name, params) {
    var choice = vendorChoice();
    if (!hasConsent() || choice.kind === "none") {
      log(name, params, hasConsent() ? "nenhum-id" : "sem-consentimento");
      return;
    }
    try {
      if (choice.kind === "gtm") {
        window.dataLayer = window.dataLayer || [];
        var payload = { event: name };
        Object.keys(params).forEach(function (key) { payload[key] = params[key]; });
        window.dataLayer.push(payload);
        log(name, params, "gtm");
        return;
      }
      if (typeof window.gtag === "function") {
        window.gtag("event", name, params);
        log(name, params, "ga4");
        return;
      }
      log(name, params, "ga4-pendente");
    } catch (error) {
      log(name, params, "erro");
    }
  }

  function trackEvent(eventName, params) {
    try {
      var name = String(eventName || "").trim();
      if (!/^[a-z][a-z0-9_]{1,40}$/.test(name)) return;
      send(name, baseParams(null, params || {}));
    } catch (error) {}
  }

  function pushUnique(list, name) {
    if (list.indexOf(name) === -1) list.push(name);
  }

  function namesFor(el) {
    var names = [];
    var explicit = el.getAttribute("data-track") || "";
    if (explicit === "fazdetudo_contact") {
      var method = (el.getAttribute("data-contact-method") || "").toLowerCase();
      if (method === "phone") explicit = "click_ligar";
      else if (method === "email") explicit = "click_email";
      else if (method === "whatsapp") {
        var ctx = (el.getAttribute("data-source-context") || "").toLowerCase();
        explicit = ctx in { header: 1, hero: 1, final_cta: 1 } ? "click_pedir_orcamento" : "click_whatsapp";
      } else explicit = "";
    }
    if (/^(click_|form_)/.test(explicit)) pushUnique(names, explicit);
    var href = (el.getAttribute("href") || "").toLowerCase();
    var text = plain(buttonText(el));
    if (/wa\.me|whatsapp|api\.whatsapp/.test(href) || el.id === "whatsapp-float" || el.id === "wa-chat-send") {
      pushUnique(names, "click_whatsapp");
    }
    if (href.indexOf("tel:") === 0) pushUnique(names, "click_ligar");
    if (href.indexOf("mailto:") === 0) pushUnique(names, "click_email");
    if (/orcamento|presupuesto|\bdevis\b|\bquote\b/.test(text)) pushUnique(names, "click_pedir_orcamento");
    if (/^(ver servicos|servicos|services|ver todos os servicos)$/.test(text) || /#servicos\b|#services\b/.test(href)) {
      pushUnique(names, "click_ver_servicos");
    }
    if (/portefolio|portfolio|ver projetos|ver projeto|ver trabalho|ver trabalhos|trabalhos realizados|ver mais trabalhos|^trabalhos$/.test(text)) {
      pushUnique(names, "click_ver_portfolio");
    }
    return names;
  }

  function trackElement(el, extraNames) {
    if (!el) return;
    var names = namesFor(el);
    (extraNames || []).forEach(function (name) { pushUnique(names, name); });
    if (!names.length) return;
    var params = baseParams(el);
    names.forEach(function (name) { send(name, params); });
  }

  document.addEventListener("click", function (event) {
    try {
      var el = event.target && event.target.closest ? event.target.closest("a, button, [data-track]") : null;
      if (!el || el.tagName === "INPUT" && el.type !== "submit" && el.type !== "button") return;
      trackElement(el);
    } catch (error) {}
  });

  document.addEventListener("submit", function (event) {
    try {
      var form = event.target;
      if (!form || form.tagName !== "FORM") return;
      var marked = form.getAttribute("data-track") === "form_orcamento_enviado";
      var quoteForm = /orcamento|quote/i.test((form.id || "") + " " + (form.className || ""));
      if (!marked && !quoteForm) return;
      send("form_orcamento_enviado", baseParams(form, { button_text: "formulario", button_location: form.getAttribute("data-track-location") || "contact_section" }));
    } catch (error) {}
  }, true);

  document.addEventListener("keydown", function (event) {
    try {
      if (event.key !== "Enter" || !event.target || event.target.id !== "wa-chat-input") return;
      send("click_whatsapp", baseParams(event.target, { button_text: "Enviar mensagem", button_location: "floating", destination_url: "https://wa.me/" }));
    } catch (error) {}
  });

  window.addEventListener("scroll", function () {
    try {
      var height = document.documentElement.scrollHeight - window.innerHeight;
      if (height <= 0) return;
      var depth = Math.round((window.scrollY / height) * 100);
      [25, 50, 75, 90, 100].forEach(function (mark) {
        if (depth >= mark && !scrollMarks[mark]) {
          scrollMarks[mark] = true;
          send("scroll_" + mark, baseParams(null));
        }
      });
    } catch (error) {}
  }, { passive: true });

  function grantConsent() {
    config.consentGranted = true;
    try { localStorage.setItem("trackingConsent", "granted"); } catch (error) {}
    loadVendors();
  }

  function revokeConsent() {
    config.consentGranted = false;
    try { localStorage.removeItem("trackingConsent"); } catch (error) {}
  }

  window.trackEvent = trackEvent;
  window.SiteTracking = {
    trackEvent: trackEvent,
    grantConsent: grantConsent,
    revokeConsent: revokeConsent,
    hasConsent: hasConsent
  };

  maskFields();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { maskFields(); loadVendors(); });
  } else {
    loadVendors();
  }
})();
