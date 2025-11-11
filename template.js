// Baut das Markup für eine Pokémon-Karte in der Übersicht.
function createPokemonCard(pokemon) {
	const { id = 0, name = 'Pokemon', image = '', weight = '?', background = 'rgba(255,255,255,0.9)' } = pokemon;
	const badges = buildTypeBadges(pokemon.types || []);
	const idLabel = String(id).padStart(3, '0');

	return `
		<div class="col">
			<article class="pokemon-card card h-100 border-0 shadow-sm" data-pokemon-id="${id}" style="--card-bg: ${background};">
				<div class="card-body text-center">
					<span class="pokemon-card__id badge bg-light text-dark">#${idLabel}</span>
					<img class="img-fluid mb-3" src="${image}" alt="${name}" loading="lazy" />
					<h2 class="h5 fw-semibold mb-1">${name}</h2>
					<div class="pokemon-card__types mb-2">${badges}</div>
					<p class="text-muted small mb-0">Gewicht: ${weight} kg</p>
				</div>
			</article>
		</div>
	`;
}

// Erzeugt Badge-Markup für alle übergebenen Typen.
function buildTypeBadges(types, badgeClass) {
	let markup = '';
	const className = badgeClass || 'text-bg-info';
	for (let i = 0; i < types.length; i += 1) {
		markup += '<span class="badge rounded-pill ' + className + ' me-1">' + types[i] + '</span>';
	}
	return markup;
}

// Baut das vollständige Overlay-Markup zu einem Pokémon.
function createPokemonOverlay(pokemon) {
	const info = prepareOverlayDetails(pokemon);
	return `
		<div class="pokemon-overlay d-flex align-items-center justify-content-center">
			<div class="pokemon-overlay__backdrop"></div>
			<div class="pokemon-overlay__frame container position-relative">
				<button type="button" class="pokemon-overlay__nav pokemon-overlay__nav--prev btn btn-light" aria-label="Vorheriges Pokémon">&#10094;</button>
				<article class="pokemon-overlay__card card border-0 shadow-lg overflow-hidden">
					${buildOverlayHero(info)}
					<div class="pokemon-overlay__details bg-white"></div>
				</article>
				<button type="button" class="pokemon-overlay__nav pokemon-overlay__nav--next btn btn-light" aria-label="Nächstes Pokémon">&#10095;</button>
			</div>
		</div>
	`;
}

// Rendert den oberen Präsentationsbereich des Overlays.
function buildOverlayHero(info) {
	return `
		<div class="pokemon-overlay__hero text-center text-white" style="background: ${info.background};">
			<button type="button" class="pokemon-overlay__close btn btn-link text-white" aria-label="Schließen">&times;</button>
			<span class="badge bg-dark bg-opacity-50 text-uppercase">#${info.idLabel}</span>
			<h2 class="h2 fw-bold mb-2">${info.name}</h2>
			<div class="pokemon-overlay__types">${info.typeBadges}</div>
			<img class="img-fluid" src="${info.image}" alt="${info.name}" />
		</div>
	`;
}

// Bereitet alle Anzeigeinformationen für die Overlay-Komponenten auf.
function prepareOverlayDetails(pokemon) {
	const entry = pokemon || {};
	const types = entry.types || [];
	return {
		name: entry.name || 'Pokemon',
		idLabel: String(entry.id || 0).padStart(3, '0'),
		image: entry.image || '',
		background: entry.background || 'linear-gradient(135deg, #f0f4f8 0%, rgba(255,255,255,0.9) 100%)',
		typeBadges: buildTypeBadges(types, 'bg-white text-dark border border-light-subtle'),
	};
}

window.PokedexTemplates = {
	createPokemonCard: createPokemonCard,
	createPokemonOverlay: createPokemonOverlay,
};
