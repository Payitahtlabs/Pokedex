// Rendert das reine HTML-Markup für eine Pokémon-Karte aus vorbereiteten View-Daten (ohne Logik).
function createPokemonCard(viewData) {
	return `
		<li class="col">
			<article class="pokemon-card card h-100 border-0 shadow-sm" data-pokemon-id="${viewData.id}" style="--card-bg: ${viewData.background};">
				<div class="card-body text-center">
					<span class="pokemon-card__id badge bg-light text-dark">#${viewData.idLabel}</span>
					<img class="img-fluid mb-3" src="${viewData.image}" alt="${viewData.name}" loading="lazy" />
					<h2 class="h6 fw-semibold mb-1" style="font-size: 0.85rem;">${viewData.name}</h2>
					<div class="pokemon-card__types mb-0">${viewData.badges}</div>
				</div>
			</article>
			</li>
	`;
}

// Rendert das vollständige Overlay-Markup basierend auf vorbereiteten View-Daten.
function createPokemonOverlay(viewData) {
	return `
		<div class="pokemon-overlay d-flex align-items-center justify-content-center">
			<div class="pokemon-overlay__backdrop"></div>
			<div class="pokemon-overlay__frame container position-relative">
				<button type="button" class="pokemon-overlay__nav pokemon-overlay__nav--prev btn btn-light" aria-label="Vorheriges Pokémon">&#10094;</button>
				<article class="pokemon-overlay__card card border-0 shadow-lg overflow-hidden">
					${buildOverlayHero(viewData.hero)}
					${buildOverlayDetails(viewData)}
				</article>
				<button type="button" class="pokemon-overlay__nav pokemon-overlay__nav--next btn btn-light" aria-label="Nächstes Pokémon">&#10095;</button>
			</div>
		</div>
	`;
}

// Rendert den oberen Präsentationsbereich des Overlays inklusive Close-Button.
function buildOverlayHero(hero) {
	return `
		<div class="pokemon-overlay__hero text-center text-white" style="background: ${hero.background};">
			<button type="button" class="pokemon-overlay__close btn btn-link text-white" aria-label="Schließen">&times;</button>
			<span class="badge bg-dark bg-opacity-50 text-uppercase">#${hero.idLabel}</span>
			<h2 class="h2 fw-bold mb-2">${hero.name}</h2>
			<div class="pokemon-overlay__types">${hero.typeBadges}</div>
			<img class="img-fluid" src="${hero.image}" alt="${hero.name}" />
		</div>
	`;
}

// Verknüpft Tab-Navigation und Panel-Markup auf Basis vorbereiteter Daten.
function buildOverlayDetails(data) {
	return `
		<div class="pokemon-overlay__details">
			<div class="pokemon-overlay__tabs">${data.tabMarkup}</div>
			${data.panelMarkup}
		</div>
	`;
}