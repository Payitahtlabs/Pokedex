// Exportiert die Templates ins UI, damit nur ui-helpers/script.js die Aufrufe steuern.
if (typeof window !== 'undefined') {
	window.PokedexTemplates = window.PokedexTemplates || {};
	if (typeof createPokemonCard === 'function') {
		window.PokedexTemplates.createPokemonCard = createPokemonCard;
	}
	if (typeof createPokemonOverlay === 'function') {
		window.PokedexTemplates.createPokemonOverlay = createPokemonOverlay;
	}
}

// Baut das komplette Panel-Markup vor, damit das Template nur noch einbettet.
function buildOverlayPanelsMarkup(base, entry) {
	const baseId = base.tabBaseId;
	const activeKey = base.activeTab;
	return `
		<div class="tab-content mt-4">
			${buildOverlayTabPane(baseId, 'about', activeKey === 'about', buildAboutPanelMarkup(entry.about))}
			${buildOverlayTabPane(baseId, 'stats', activeKey === 'stats', buildStatsPanelMarkup(entry.stats))}
			${buildOverlayTabPane(baseId, 'evolution', activeKey === 'evolution', buildEvolutionPanelMarkup(entry.evolutions))}
			${buildOverlayTabPane(baseId, 'moves', activeKey === 'moves', buildMovesPanelMarkup(entry.moves))}
		</div>
	`;
}

// Baut ein einzelnes Tab-Pane inklusive Aktivstatus.
function buildOverlayTabPane(baseId, key, isActive, content) {
	const activeClass = isActive ? ' show active' : '';
	return `<div class="tab-pane fade${activeClass}" id="${baseId}-${key}-pane" role="tabpanel" aria-labelledby="${baseId}-${key}-tab">${content}</div>`;
}

// Rendert den zweispaltigen About-Tab.
function buildAboutPanelMarkup(about) {
	const info = about || {};
	return `
		<div class="row g-4">
			${buildDetailColumnMarkup('Overview', info.overview)}
			${buildDetailColumnMarkup('Breeding', info.breeding)}
		</div>
	`;
}

// Stellt eine Detailspalte mit Liste zusammen.
function buildDetailColumnMarkup(title, items) {
	const list = Array.isArray(items) ? items : [];
	return `
		<div class="col-md-6">
			<h3 class="pokemon-overlay__section-title">${title}</h3>
			${buildDetailListMarkup(list)}
		</div>
	`;
}

// Baut eine ungeordnete Liste oder einen leeren Container.
function buildDetailListMarkup(items) {
	if (!items.length) return '<ul class="list-unstyled small mb-0"></ul>';
	return `<ul class="list-unstyled small mb-0">${items.map(buildDetailRowMarkup).join('')}</ul>`;
}

// Rendert eine einzelne Label-Wert-Zeile.
function buildDetailRowMarkup(entry) {
	const item = entry || {};
	return `<li class="pokemon-overlay__detail"><span class="pokemon-overlay__detail-label">${item.label || ''}</span><span class="pokemon-overlay__detail-value">${item.value || ''}</span></li>`;
}

// Setzt den Stats-Tab inklusive Fallback zusammen.
function buildStatsPanelMarkup(stats) {
	const data = stats || { rows: [], total: null };
	if (!data.rows || !data.rows.length) {
		return '<div class="pokemon-overlay__stats"><p class="text-muted small mb-0">No values available.</p></div>';
	}
	const rows = data.rows.map(buildStatRowMarkup).join('');
	const total = data.total ? buildStatsTotalMarkup(data.total) : '';
	return `<div class="pokemon-overlay__stats">${rows}${total}</div>`;
}

// Rendert eine einzelne Statistikzeile mit Progressbar.
function buildStatRowMarkup(entry) {
	const item = entry || {};
	return `
		<div class="pokemon-overlay__stat d-flex align-items-center mb-2">
			<span class="pokemon-overlay__stat-label text-uppercase small fw-semibold me-3" style="font-size: 0.85rem;">${item.label || ''}</span>
			<div class="progress flex-grow-1" role="progressbar" aria-label="${item.label || ''}" aria-valuemin="0" aria-valuemax="255" aria-valuenow="${item.value || 0}">
				<div class="progress-bar ${item.barClass || ''}" style="width: ${item.width || 0}%">${item.value || 0}</div>
			</div>
		</div>
	`;
}

// Fügt die Total-Zeile an das Stats-Panel an.
function buildStatsTotalMarkup(total) {
	const info = total || { value: 0, width: 0 };
	return `
		<div class="pokemon-overlay__stat pokemon-overlay__stat--total d-flex align-items-center mb-0">
			<span class="pokemon-overlay__stat-label text-uppercase small fw-semibold me-3" style="font-size: 0.85rem;">Total</span>
			<div class="progress flex-grow-1" role="progressbar" aria-label="Total" aria-valuemin="0" aria-valuemax="780" aria-valuenow="${info.value}">
				<div class="progress-bar bg-primary" style="width: ${info.width}%">${info.value}</div>
			</div>
		</div>
	`;
}

// Setzt die komplette Evolutionskette inklusive Pfeilen zusammen.
function buildEvolutionPanelMarkup(evolutions) {
	const list = Array.isArray(evolutions) ? evolutions : [];
	if (!list.length) return '<p class="text-muted small mb-0">No evolution data available.</p>';
	const parts = list
		.map((entry, index) => {
			const item = buildEvolutionItemMarkup(entry);
			return index < list.length - 1 ? item + buildEvolutionArrowMarkup() : item;
		})
		.join('');
		return `<div class="pokemon-evolution row g-3 align-items-center justify-content-center">${parts}</div>`;
	}

	// Rendert ein einzelnes Element innerhalb der Evolutionskette.
	function buildEvolutionItemMarkup(entry) {
	const item = entry || {};
	return `
		<div class="pokemon-evolution__item col-6 col-sm-3 text-center">
			<img class="pokemon-evolution__image" src="${item.image || ''}" alt="${item.name || 'Unknown'}" loading="lazy" />
			<div class="pokemon-evolution__label">${item.name || 'Unknown'}</div>
		</div>
	`;
}

	// Zeichnet den Pfeil zwischen evolvierenden Pokémon.
	function buildEvolutionArrowMarkup() {
	return `
		<div class="pokemon-evolution__arrow col-auto d-flex align-items-center justify-content-center" aria-hidden="true">
			<svg width="36" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M4 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M14 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</div>
	`;
}

// Rendert den Moves-Tab oder zeigt einen Hinweis.
function buildMovesPanelMarkup(moves) {
	const info = moves || { hasMoves: false, rowsMarkup: '' };
	if (!info.hasMoves) return '<p class="text-muted small mb-0">No move data available.</p>';
	return [
		'<div class="table-responsive">',
		'<table class="table table-sm table-borderless align-middle mb-0 bg-transparent">',
		'<thead class="text-muted text-uppercase small"><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Effect</th></tr></thead>',
		`<tbody>${info.rowsMarkup}</tbody>`,
		'</table>',
		'</div>',
	].join('');
}

// Generiert das reine HTML-Markup für Pokémon-Typ-Badges aus einem Array.
const buildTypeBadges = (types = [], badgeClass = 'text-bg-info') => {
	return types.map(type => 
		`<span class="badge rounded-pill ${badgeClass} me-1">${type}</span>`
	).join('');
};

// Bereitet ein vollständiges Overlay-View-Model vor, damit template.js ausschließlich Markup generiert.
function preparePokemonOverlayView(pokemon, activeTab) {
	const entry = pokemon || {};
	const base = buildOverlayDefaults(entry, activeTab);
	const abilitiesText = buildAbilityList(entry.abilities || []);
	const about = buildOverlayAboutData(base, abilitiesText);
	const stats = buildOverlayStatsData(entry.stats);
	const evolutions = buildOverlayEvolutionData(entry.evolutions);
	const moves = buildOverlayMovesData(entry.moves);
	return {
		base: base,
		hero: buildOverlayHeroView(entry, base),
		tabMarkup: buildOverlayTabsMarkup(base),
		panelMarkup: buildOverlayPanelsMarkup(base, { about, stats, evolutions, moves }),
	};
}

// Leitet alle Hero-spezifischen UI-Daten inklusive Fallbacks ab.
function buildOverlayHeroView(entry, base) {
	const types = Array.isArray(entry.types) ? entry.types : [];
	return {
		background: base.background,
		idLabel: base.idLabel,
		name: base.name,
		typeBadges: buildTypeBadges(types, 'bg-white text-dark border border-light-subtle'),
		image: base.image,
	};
}

// Liefert das Tab-Markup inklusive aktivem Zustand, damit das Template nur noch injectt.
function buildOverlayTabsMarkup(base) {
	const tabs = [
		{ key: 'about', label: 'About', isActive: base.activeTab === 'about' },
		{ key: 'stats', label: 'Base Stats', isActive: base.activeTab === 'stats' },
		{ key: 'evolution', label: 'Evolution', isActive: base.activeTab === 'evolution' },
		{ key: 'moves', label: 'Moves', isActive: base.activeTab === 'moves' },
	];
	const baseId = base.tabBaseId;
	return `
		<ul class="nav nav-pills nav-fill" role="tablist">
			${tabs.map((tab) => buildOverlayTabButton(baseId, tab)).join('')}
		</ul>
	`;
}

// Baut einen einzelnen Tab-Button inklusive ARIA-Attributen.
function buildOverlayTabButton(baseId, tab) {
	const isActive = tab.isActive ? ' active' : '';
	const selected = tab.isActive ? 'true' : 'false';
	return `
		<li class="nav-item" role="presentation">
			<button class="nav-link${isActive}" id="${baseId}-${tab.key}-tab" data-bs-toggle="pill" data-bs-target="#${baseId}-${tab.key}-pane" data-tab-key="${tab.key}" type="button" role="tab" aria-controls="${baseId}-${tab.key}-pane" aria-selected="${selected}">${tab.label}</button>
		</li>
	`;
}

// Stellt gruppierte Detaildaten für den About-Tab bereit.
function buildOverlayAboutData(base, abilitiesText) {
	return {
		overview: [
			{ label: 'Species:', value: base.species },
			{ label: 'Height:', value: base.height + ' m' },
			{ label: 'Weight:', value: base.weight + ' kg' },
			{ label: 'Abilities:', value: abilitiesText },
		],
		breeding: [
			{ label: 'Gender:', value: base.gender },
			{ label: 'Egg Groups:', value: base.eggGroups },
			{ label: 'Hatch Cycles:', value: base.hatchInfo },
		],
	};
}

// Normalisiert Stat-Werte, berechnet Balkenbreiten und Summe.
function buildOverlayStatsData(stats) {
	const safe = Array.isArray(stats) ? stats : [];
	if (!safe.length) return { rows: [], total: null };
	const rows = safe.map((entry) => {
		const value = entry && entry.value ? entry.value : 0;
		const label = entry && entry.label ? entry.label : '';
		const width = Math.min(100, Math.round((value / 255) * 100));
		return { label: label, value: value, width: width, barClass: value >= 60 ? 'bg-success' : 'bg-danger' };
	});
	const totalValue = rows.reduce((sum, item) => sum + item.value, 0);
	const totalWidth = Math.min(100, Math.round((totalValue / 780) * 100));
	return { rows: rows, total: { value: totalValue, width: totalWidth } };
}

// Übersetzt Evolutionsdaten in ein vereinheitlichtes Format für das Template.
function buildOverlayEvolutionData(evolutions) {
	if (!Array.isArray(evolutions) || !evolutions.length) return [];
	return evolutions.map((entry) => ({
		image: entry && entry.image ? entry.image : '',
		name: entry && entry.name ? entry.name : 'Unknown',
	}));
}

// Reduziert Move-Daten auf die Anzeige-Informationen und kürzt Effekte.
function buildOverlayMovesData(moves) {
	const list = Array.isArray(moves) ? moves : [];
	if (!list.length) return { hasMoves: false, rowsMarkup: '' };
	const rows = list.map((move) => buildMoveRowMarkup(move)).join('');
	return { hasMoves: true, rowsMarkup: rows };
}

// Erzeugt die Tabellenzeile für einen einzelnen Move.
function buildMoveRowMarkup(move) {
	const item = move || {};
	const name = item.name ? item.name : 'Unknown';
	const type = item.type ? item.type : '—';
	const effect = truncateEffectText(item.effect || '');
	return `<tr><td><div class="fw-semibold" style="font-size: 0.85rem;">${name}</div></td><td><span class="badge rounded-pill bg-light text-dark">${type}</span></td><td><small class="text-muted">${effect}</small></td></tr>`;
}

// Kürzt Effekte auf 140 Zeichen und ergänzt Ellipsen.
function truncateEffectText(text) {
	if (!text) return 'No effect info available.';
	const clean = text.trim();
	return clean.length <= 140 ? clean : clean.slice(0, 137) + '…';
}

// Legt Grundwerte für das Overlay fest und ergänzt Standardwerte.
function buildOverlayDefaults(entry, activeTab) {
	const details = {
		name: entry.name || 'Pokemon',
		idLabel: String(entry.id || 0).padStart(3, '0'),
		image: entry.image || '',
		background: entry.background || 'linear-gradient(135deg, #f0f4f8 0%, rgba(255,255,255,0.9) 100%)',
		height: entry.height || '?',
		weight: entry.weight || '?',
		activeTab: activeTab || 'about',
		tabBaseId: 'pokemon-' + (entry.id || 0),
	};
	addBreedingDefaults(details, entry);
	return details;
}

// Erzeugt einen Komma-getrennten Text der Fähigkeiten oder einen Fallback.
function buildAbilityList(abilities) {
	if (!abilities || !abilities.length) return 'Not available';
	return abilities.join(', ');
}

// Ergänzt Zucht- und Arteninformationen mit Fallbacks.
function addBreedingDefaults(details, entry) {
	details.species = entry.species || 'Not available';
	details.gender = entry.gender || 'Not available';
	details.eggGroups = entry.eggGroups || 'Not available';
	details.hatchInfo = entry.hatchInfo || 'Not available';
}

// Zeigt den Fehlerbanner mit Nachricht und Scroll-Hilfe an.
function showErrorBanner(message) {
	if (!errorBanner) return;
	if (errorMessageText) errorMessageText.textContent = message;
	errorBanner.classList.remove('d-none');
	if (errorBanner.scrollIntoView) {
		errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
}

// Blendet den Fehlerbanner wieder aus.
const hideErrorBanner = () => errorBanner && errorBanner.classList.add('d-none');

// Aktiviert oder deaktiviert den Mehr-Laden-Button.
const setButtonDisabled = (state) => loadMoreButton.disabled = state;

// Aktualisiert den Text des Mehr-Laden-Buttons.
const setButtonText = (text) => loadMoreButton.textContent = text;

// Aktualisiert und zeigt die Ladeanzeige an.
function showLoadingIndicator() {
	const message = loadingIndicator.querySelector('p');
	if (message) message.textContent = LOADING_BUTTON_LABEL;
	loadingIndicator.classList.remove('d-none');
}

// Blendet die Ladeanzeige aus.
const hideLoadingIndicator = () => loadingIndicator.classList.add('d-none');

// Zeigt den Hinweis, dass keine Pokémon gefunden wurden.
function showNoResultsMessage() {
	if (!noResultsMessage) return;
	noResultsMessage.classList.remove('d-none');
	noResultsMessage.classList.add('animate__fadeIn');
}

// Blendet den Hinweis auf fehlende Treffer aus.
function hideNoResultsMessage() {
	if (!noResultsMessage) return;
	noResultsMessage.classList.add('d-none');
	noResultsMessage.classList.remove('animate__fadeIn');
}

// Diese Funktion bereitet die Rohdaten für die Kartenanzeige auf.
function preparePokemonViewData(pokemon = {}) {
	return {
		id: pokemon.id || 0,
		name: pokemon.name || 'Pokemon',
		image: pokemon.image || '',
		background: pokemon.background || 'rgba(255,255,255,0.9)',
		idLabel: String(pokemon.id || 0).padStart(3, '0'),
		badges: typeof buildTypeBadges === 'function' ? buildTypeBadges(pokemon.types || []) : '',
	};
}

// Bereitet View-Daten für jede Pokémon-Karte vor und rendert das Markup ins Grid (Template ist rein für Darstellung).
function renderPokemonCards(target, pokemonList, reset) {
	if (reset) target.innerHTML = '';
	if (!window.PokedexTemplates || !window.PokedexTemplates.createPokemonCard) return;
	if (typeof updateCurrentDisplayState === 'function') {
		updateCurrentDisplayState(pokemonList, reset);
	}
	pokemonList.forEach((pokemon) => {
		const viewData = preparePokemonViewData(pokemon);
		const cardMarkup = window.PokedexTemplates.createPokemonCard(viewData);
		target.insertAdjacentHTML('beforeend', cardMarkup);
	});
}
