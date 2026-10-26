(function () {
  const locale = document.documentElement.lang.startsWith('en') ? 'en' : 'de';
  const messages = {
    de: {searchTitle:'Werkzeuge suchen',searchHint:'Produkt, Kategorie oder Stichwort eingeben.',searchPlaceholder:'Zum Beispiel Bohrer oder Garten',searchEmpty:'Keine passenden Werkzeuge. Versuchen Sie einen anderen Begriff.',searchLoading:'Werkzeuge werden gesucht …',searchError:'Die Suche ist gerade nicht erreichbar. Bitte erneut versuchen.',searchReady:'Geben Sie einen Suchbegriff ein.',searchCount:'Treffer',close:'Suche schließen',catalog:'Zum Sortiment',theme:'Farbschema',light:'Hell',dark:'Dunkel',auto:'Automatisch',invalidForm:'Bitte alle Pflichtfelder korrekt ausfüllen.',privacy:'Bitte bestätigen Sie die Datenschutzhinweise.',security:'Bitte bestätigen Sie die Sicherheitsprüfung.',securityError:'Die Sicherheitsprüfung konnte nicht geladen werden.',sending:'Nachricht wird gesendet …',failed:'Die Anfrage konnte nicht gesendet werden.',network:'Der Dienst ist gerade nicht erreichbar. Bitte später erneut versuchen.',contactSubject:'Kontaktanfrage',back:'Zurück zur Website'},
    en: {searchTitle:'Search tools',searchHint:'Enter a product, category or keyword.',searchPlaceholder:'For example drill or garden',searchEmpty:'No matching tools. Try another search term.',searchLoading:'Searching tools …',searchError:'Search is unavailable. Please try again.',searchReady:'Enter a search term to get started.',searchCount:'results',close:'Close search',catalog:'Browse catalog',theme:'Color theme',light:'Light',dark:'Dark',auto:'Automatic',invalidForm:'Please complete all required fields correctly.',privacy:'Please acknowledge the privacy notice.',security:'Please complete the security check.',securityError:'The security check could not be loaded.',sending:'Sending message …',failed:'Your inquiry could not be sent.',network:'The service is unavailable. Please try again later.',contactSubject:'Contact inquiry',back:'Back to website'},
  };
  const routes = [
    ['/','/en/'],['/sortiment/','/en/catalog/'],['/sortiment/produkt-hilti-sf-6-a22.html','/en/catalog/product.html'],
    ['/about-us/','/en/about-us/'],['/forestry-work/','/en/forestry/'],['/contact/','/en/contact/'],
    ['/impressum/','/en/imprint/'],['/datenschutz/','/en/privacy-policy/'],['/cookie-einstellungen/','/en/cookie-settings/'],
    ['/cookie-richtlinie/','/en/cookie-policy/'],['/barrierefreiheit/','/en/accessibility-statement/'],['/bildnachweise/','/en/image-credits/'],
    ['/sortiment/reservierung.html','/en/catalog/request.html'],
  ];
  const canonicalPath = path => path.replace(/index\.html$/, '');
  const counterpart = (path, target) => {
    const pair = routes.find(pair => pair.includes(canonicalPath(path)));
    return pair ? pair[target === 'en' ? 1 : 0] : (target === 'en' ? '/en/' : '/');
  };
  window.ASI18n = {locale, routes, counterpart, t:key => messages[locale][key] || messages.de[key] || key};
})();
