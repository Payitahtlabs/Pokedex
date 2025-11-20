// Baut das Markup für eine Pokémon-Karte in der Übersicht.
function createPokemonCard(pokemon) {
	const { id = 0, name = 'Pokemon', image = '', background = 'rgba(255,255,255,0.9)' } = pokemon;
	const badges = buildTypeBadges(pokemon.types || []);
	const idLabel = String(id).padStart(3, '0');

	return `
		<li class="col">
			<article class="pokemon-card card h-100 border-0 shadow-sm" data-pokemon-id="${id}" style="--card-bg: ${background};">
				<div class="card-body text-center">
					<span class="pokemon-card__id badge bg-light text-dark">#${idLabel}</span>
					<img class="img-fluid mb-3" src="${image}" alt="${name}" loading="lazy" />
					<h2 class="h6 fw-semibold mb-1" style="font-size: 0.85rem;">${name}</h2>
					<div class="pokemon-card__types mb-0">${badges}</div>
				</div>
			</article>
		</li>
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
	const nav = buildOverlayTabNav(info);
	const content = buildOverlayTabContent(info);
	return `
		<div class="pokemon-overlay__details">
			<div class="pokemon-overlay__tabs">${nav}</div>
			${content}
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
	const evolution = createEvolutionPane(baseId, info);
	const moves = createMovesPane(baseId, info);
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

// Erstellt die linke Spalte des About-Tabs mit generellen Eckdaten.
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

// Erstellt die rechte Spalte mit Zuchtinformationen und Eiern.
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

// Liefert eine Listenzeile aus Label und Wert für die About-Sektion.
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

// Baut den Moves-Tab mit einer kompakten Tabelle.
function createMovesPane(baseId, info) {
	const content = buildMovesTable(info.moves || []);
	return wrapTabPane(baseId, 'moves', info.activeTab === 'moves', content);
}

// Platzhalter-Panel für noch nicht umgesetzte Inhalte.
function createPlaceholderPane(baseId, key, label, isActive) {
	const text = `<p class="text-muted small mb-0">${label} wird demnächst ergänzt.</p>`;
	return wrapTabPane(baseId, key, isActive, text);
}

// Baut die Moves-Tabelle mit Name, Typ und Effekt.
function buildMovesTable(moves) {
	if (!moves.length) return '<p class="text-muted small mb-0">No move data available.</p>';
	const rows = renderMoveRows(moves);
	return wrapMovesTable(rows);
}

// Fügt alle Move-Zeilen zu einer HTML-Kette zusammen.
function renderMoveRows(moves) {
	return moves.map((entry) => composeMoveRow(entry)).join('');
}

// Kapselt Tabelle und Kopfbereich für den Moves-Tab.
function wrapMovesTable(rows) {
	return `
		<div class="table-responsive">
			<table class="table table-sm table-borderless align-middle mb-0 bg-transparent">
				<thead class="text-muted text-uppercase small">
					<tr>
						<th scope="col">Name</th>
						<th scope="col">Type</th>
						<th scope="col">Effect</th>
					</tr>
				</thead>
				<tbody>${rows}</tbody>
			</table>
		</div>
	`;
}

// Setzt eine Tabellenzeile für einen einzelnen Move zusammen.
function composeMoveRow(move) {
	if (!move) return '';
	const typeBadge = `<span class="badge rounded-pill bg-light text-dark">${move.type || '—'}</span>`;
	return `
		<tr>
			<td>
				<div class="fw-semibold" style="font-size: 0.85rem;">${move.name || 'Unknown'}</div>
			</td>
			<td>${typeBadge}</td>
			<td><small class="text-muted">${truncateEffectText(move.effect)}</small></td>
		</tr>
	`;
}

// Kürzt den Effekttext auf eine lesbare Länge.
function truncateEffectText(text) {
	if (!text) return 'No effect info available.';
	const clean = text.trim();
	if (clean.length <= 140) return clean;
	return clean.slice(0, 137) + '…';
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
// Erzeugt alle Stat-Zeilen oder zeigt eine Hinweisnachricht an.
function buildStatRows(stats) {
	if (!stats || !stats.length) return `<p class="text-muted small mb-0">No values available.</p>`;
	let rows = '';
	for (let i = 0; i < stats.length; i += 1) {
		rows += composeStatRow(stats[i]);
	}
	return rows;
}

// Setzt eine einzelne Stat-Zeile mit Fortschrittsbalken zusammen.
// Stellt eine einzelne Stat-Zeile inklusive Progress-Bar zusammen.
function composeStatRow(entry) {
	const value = entry && entry.value ? entry.value : 0;
	const label = entry && entry.label ? entry.label : '';
	const limiter = 255;
	const width = Math.min(100, Math.round((value / limiter) * 100));
	const barClass = value >= 60 ? 'bg-success' : 'bg-danger';
	return `
		<div class="pokemon-overlay__stat d-flex align-items-center mb-2">
			<span class="pokemon-overlay__stat-label text-uppercase small fw-semibold me-3" style="font-size: 0.85rem;">${label}</span>
			<div class="progress flex-grow-1" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${limiter}" aria-valuenow="${value}">
				<div class="progress-bar ${barClass}" style="width: ${width}%">${value}</div>
			</div>
		</div>
	`;
}

// Fügt eine Gesamtzeile mit Fortschrittsbalken hinzu.
// Fasst alle Basiswerte zu einer Gesamtzeile zusammen.
function composeTotalRow(stats) {
	const maxTotal = 780;
	const total = buildStatTotal(stats);
	const width = Math.min(100, Math.round((total / maxTotal) * 100));
	return `
		<div class="pokemon-overlay__stat pokemon-overlay__stat--total d-flex align-items-center mb-0">
			<span class="pokemon-overlay__stat-label text-uppercase small fw-semibold me-3" style="font-size: 0.85rem;">Total</span>
			<div class="progress flex-grow-1" role="progressbar" aria-label="Total" aria-valuemin="0" aria-valuemax="${maxTotal}" aria-valuenow="${total}">
				<div class="progress-bar bg-primary" style="width: ${width}%">${total}</div>
			</div>
		</div>
	`;
}

// Summiert alle Basiswerte auf.
// Summiert sämtliche übergebenen Stats auf.
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
	details.evolutions = entry.evolutions || [];
	details.moves = entry.moves || [];
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

// Rendert den Evolution-Tab mit allen vorhandenen Entwicklungsstufen.
function createEvolutionPane(baseId, info) {
	const content = buildEvolutionList(info.evolutions || []);
	return wrapTabPane(baseId, 'evolution', info.activeTab === 'evolution', content);
}

// Baut eine lineare Darstellung aller Stufen inklusive Pfeilen zwischen den Karten.
function buildEvolutionList(list) {
	if (!list || !list.length) return `<p class="text-muted small mb-0">No evolution data available.</p>`;
	let html = '<div class="pokemon-evolution row g-3 align-items-center justify-content-center">';
	for (let i = 0; i < list.length; i += 1) {
		html += buildEvolutionItem(list[i]);
		if (i < list.length - 1) html += buildEvolutionArrow();
	}
	return html + '</div>';
}

// Zeigt eine einzelne Entwicklungsstufe samt Bild und Name an.
function buildEvolutionItem(entry) {
	const img = entry && entry.image ? entry.image : '';
	const name = entry && entry.name ? entry.name : 'Unknown';
	return `
		<div class="pokemon-evolution__item col-6 col-sm-3 text-center">
			<img class="pokemon-evolution__image" src="${img}" alt="${name}" loading="lazy" />
			<div class="pokemon-evolution__label">${name}</div>
		</div>
	`;
}

// Trennt zwei Stufen mit einem Pfeil, der die Evolutionsrichtung verdeutlicht.
function buildEvolutionArrow() {
	return `
		<div class="pokemon-evolution__arrow col-auto d-flex align-items-center justify-content-center" aria-hidden="true">
			<svg width="36" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M4 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M14 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</div>
	`;
}

window.PokedexTemplates = {
	createPokemonCard: createPokemonCard,
	createPokemonOverlay: createPokemonOverlay,
};
