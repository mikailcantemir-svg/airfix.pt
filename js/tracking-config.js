/* IDs vazios de proposito. Cole aqui quando tiver as contas.
   O HTML e estatico: o browser nao le .env.
   .env.example existe so como lembrete para um build futuro.

   Nao preencha GA4 e GTM ao mesmo tempo.
   Se ambos tiverem valor, so o GTM carrega, para nao duplicar page_view.
   Nesse caso o GA4 configura-se dentro do contentor GTM. */
window.TRACKING_CONFIG = {
  GA4_MEASUREMENT_ID: "",
  GOOGLE_TAG_MANAGER_ID: "",
  MICROSOFT_CLARITY_PROJECT_ID: "",
  /* Sem banner de cookies neste site.
     true = GA4, GTM e Clarity so carregam depois de SiteTracking.grantConsent()
     ou localStorage trackingConsent=granted.
     O site em si nunca fica bloqueado.
     Ligue o banner futuro a SiteTracking.grantConsent() / revokeConsent(). */
  requireConsent: true
};
