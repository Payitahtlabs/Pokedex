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
		markup += `<span class="badge rounded-pill ${className} me-1">${types[i]}</span>`;
	}
	return markup;
}

// Baut das vollständige Overlay-Markup zu einem Pokémon.
function createPokemonOverlay(pokemon, activeTab) {
	const info = prepareOverlayDetails(pokemon, activeTab);
	return `
		<div class="pokemon-overlay d-flex align-items-center justify-content-center">
			<div class="pokemon-overlay__backdrop"></div>
			<div class="pokemon-overlay__frame container position-relative">
				<button type="button" class="pokemon-overlay__nav pokemon-overlay__nav--prev btn btn-light" aria-label="Vorheriges Pokémon">&#10094;</button>
				<article class="pokemon-overlay__card card border-0 shadow-lg overflow-hidden">
					${buildOverlayHero(info)}
					${buildOverlayDetails(info)}
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

// Baut die Tab-Navigation samt Inhalte für das Overlay.
function buildOverlayDetails(info) {
	const tabs = buildOverlayTabNav(info) + buildOverlayTabContent(info);
	return `
		<div class="pokemon-overlay__details">
			<div class="pokemon-overlay__tabs">${tabs}</div>
		</div>
	`;
}

// Erstellt die Tab-Navigation mit vier Registern.
function buildOverlayTabNav(info) {
	const baseId = info.tabBaseId;
	const activeKey = info.activeTab;
	return `
		<ul class="nav nav-pills nav-fill" role="tablist">
			${createTabButton(baseId, 'about', 'About', activeKey)}
			${createTabButton(baseId, 'stats', 'Base Stats', activeKey)}
			${createTabButton(baseId, 'evolution', 'Evolution', activeKey)}
			${createTabButton(baseId, 'moves', 'Moves', activeKey)}
		</ul>
	`;
}

// Liefert den Markup-Block für alle Tab-Panels.
function buildOverlayTabContent(info) {
	const baseId = info.tabBaseId;
	const about = createAboutPane(baseId, info);
	const stats = createStatsPane(baseId, info);
	const evolution = createPlaceholderPane(baseId, 'evolution', 'Evolution', info.activeTab === 'evolution');
	const moves = createPlaceholderPane(baseId, 'moves', 'Moves', info.activeTab === 'moves');
	return `
		<div class="tab-content mt-4">
			${about}
			${stats}
			${evolution}
			${moves}
		</div>
	`;
}

// Erstellt einen Tab-Button mit Bootstrap-Attributen.
function createTabButton(baseId, key, label, activeKey) {
	const isActive = activeKey === key;
	const activeClass = isActive ? ' active' : '';
	const selected = isActive ? 'true' : 'false';
	return `
		<li class="nav-item" role="presentation">
			<button class="nav-link${activeClass}" id="${baseId}-${key}-tab" data-bs-toggle="pill" data-bs-target="#${baseId}-${key}-pane" data-tab-key="${key}" type="button" role="tab" aria-controls="${baseId}-${key}-pane" aria-selected="${selected}">${label}</button>
		</li>
	`;
}

// Baut das About-Panel mit Höhe, Gewicht und Fähigkeiten.
function createAboutPane(baseId, info) {
	const overview = buildOverviewColumn(info);
	const breeding = buildBreedingColumn(info);
	const content = `<div class="row g-4">${overview}${breeding}</div>`;
	return wrapTabPane(baseId, 'about', info.activeTab === 'about', content);
}

function buildOverviewColumn(info) {
		return `
			<div class="col-md-6">
				<h3 class="pokemon-overlay__section-title">Overview</h3>
				<ul class="list-unstyled small mb-0">
					${buildDetailRow('Species:', info.species)}
					${buildDetailRow('Height:', info.height + ' m')}
					${buildDetailRow('Weight:', info.weight + ' kg')}
					${buildDetailRow('Abilities:', info.abilities)}
				</ul>
			</div>
		`;
}

function buildBreedingColumn(info) {
		return `
			<div class="col-md-6">
				<h3 class="pokemon-overlay__section-title">Breeding</h3>
				<ul class="list-unstyled small mb-0">
					${buildDetailRow('Gender:', info.gender)}
					${buildDetailRow('Egg Groups:', info.eggGroups)}
					${buildDetailRow('Hatch Cycles:', info.hatchInfo)}
				</ul>
			</div>
		`;
}

function buildDetailRow(label, value) {
	return `<li class="pokemon-overlay__detail"><span class="pokemon-overlay__detail-label">${label}</span><span class="pokemon-overlay__detail-value">${value}</span></li>`;
}

// Baut das Panel mit den Basiswerten und Fortschrittsbalken.
function createStatsPane(baseId, info) {
	const stats = info.stats || [];
	if (!stats.length) {
		const fallback = `<div class="pokemon-overlay__stats">${buildStatRows(stats)}</div>`;
		return wrapTabPane(baseId, 'stats', info.activeTab === 'stats', fallback);
	}
	const rows = buildStatRows(stats);
	const total = composeTotalRow(stats);
	const content = `<div class="pokemon-overlay__stats">${rows}${total}</div>`;
	return wrapTabPane(baseId, 'stats', info.activeTab === 'stats', content);
}

// Platzhalter-Panel für noch nicht umgesetzte Inhalte.
function createPlaceholderPane(baseId, key, label, isActive) {
	const text = `<p class="text-muted small mb-0">${label} wird demnächst ergänzt.</p>`;
	return wrapTabPane(baseId, key, isActive, text);
}

// Umhüllt einen Pane-Inhalt mit den notwendigen Bootstrap-Attributen.
function wrapTabPane(baseId, key, active, content) {
	const activeClass = active ? ' show active' : '';
	const tabId = `${baseId}-${key}-tab`;
	const paneId = `${baseId}-${key}-pane`;
	return `<div class="tab-pane fade${activeClass}" id="${paneId}" role="tabpanel" aria-labelledby="${tabId}">${content}</div>`;
}

// Setzt die Fähigkeitenliste zu einer lesbaren Zeichenkette zusammen.
function buildAbilityList(abilities) {
	if (!abilities || !abilities.length) return 'Not available';
	return abilities.join(', ');
}

// Baut die Markup-Zeilen für die Basiswerte.
function buildStatRows(stats) {
	if (!stats || !stats.length) return `<p class="text-muted small mb-0">No values available.</p>`;
	let rows = '';
	for (let i = 0; i < stats.length; i += 1) {
		rows += composeStatRow(stats[i]);
	}
	return rows;
}

// Setzt eine einzelne Stat-Zeile mit Fortschrittsbalken zusammen.
function composeStatRow(entry) {
	const value = entry && entry.value ? entry.value : 0;
	const label = entry && entry.label ? entry.label : '';
	const limiter = 255;
	const width = Math.min(100, Math.round((value / limiter) * 100));
	const barClass = value >= 60 ? 'bg-success' : 'bg-danger';
	return `
		<div class="pokemon-overlay__stat d-flex align-items-center mb-2">
			<span class="pokemon-overlay__stat-label text-uppercase small fw-semibold me-3">${label}</span>
			<div class="progress flex-grow-1" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${limiter}" aria-valuenow="${value}">
				<div class="progress-bar ${barClass}" style="width: ${width}%">${value}</div>
			</div>
		</div>
	`;
}

// Fügt eine Gesamtzeile mit Fortschrittsbalken hinzu.
function composeTotalRow(stats) {
	const maxTotal = 780;
	const total = buildStatTotal(stats);
	const width = Math.min(100, Math.round((total / maxTotal) * 100));
	return `
		<div class="pokemon-overlay__stat pokemon-overlay__stat--total d-flex align-items-center mb-0">
			<span class="pokemon-overlay__stat-label text-uppercase small fw-semibold me-3">Total</span>
			<div class="progress flex-grow-1" role="progressbar" aria-label="Total" aria-valuemin="0" aria-valuemax="${maxTotal}" aria-valuenow="${total}">
				<div class="progress-bar bg-primary" style="width: ${width}%">${total}</div>
			</div>
		</div>
	`;
}

// Summiert alle Basiswerte auf.
function buildStatTotal(stats) {
	if (!stats || !stats.length) return 0;
	let sum = 0;
	for (let i = 0; i < stats.length; i += 1) {
		const item = stats[i];
		sum += item && item.value ? item.value : 0;
	}
	return sum;
}

// Stellt die Anzeigeinformationen inklusive Badges und Defaultwerte zusammen.
function prepareOverlayDetails(pokemon, activeTab) {
	const entry = pokemon || {};
	const details = buildOverlayDefaults(entry, activeTab);
	const types = entry.types || [];
	details.typeBadges = buildTypeBadges(types, 'bg-white text-dark border border-light-subtle');
	details.abilities = buildAbilityList(entry.abilities || []);
	details.stats = entry.stats || [];
	return details;
}

// Legt Grundwerte für das Overlay fest und sorgt für Fallbacks.
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

// Ergänzt Zucht- und Artenangaben mit passenden Standardwerten.
function addBreedingDefaults(details, entry) {
	details.species = entry.species || 'Not available';
	details.gender = entry.gender || 'Not available';
	details.eggGroups = entry.eggGroups || 'Not available';
	details.hatchInfo = entry.hatchInfo || 'Not available';
}

window.PokedexTemplates = {
	createPokemonCard: createPokemonCard,
	createPokemonOverlay: createPokemonOverlay,
};
