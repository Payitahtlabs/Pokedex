let grid;
let loadMoreButton;
let loadingIndicator;
let searchInput;
let searchButton;
let errorBanner;
let retryButton;
let errorMessageText;
let noResultsMessage;
let fullPokemonCatalog = [];
let fullCatalogPromise = null;
let activeSearchTerm = '';
let searchDelayToken = null;
let offset = 0;
let isLoading = false;
let cachedPokemon = [];
let hasMorePokemon = true;
let paginatedPokemon = [];
let currentDisplayList = [];
let overlayRoot = null;
let currentOverlayIndex = -1;
const POKEMON_LIMIT = 20;
const API_URL = 'https://pokeapi.co/api/v2/pokemon';
const loadButtonLabel = 'Weitere Pokémon laden';
const loadingButtonLabel = 'Pokémon werden geladen...';
const noMorePokemonLabel = 'Keine weiteren Pokémon';
const minSearchLength = 3;
const fullCatalogLimit = 2000;
const searchDebounceDelay = 280;

initPokedex();

// Richtet Grundelemente und Ereignisse ein und startet den Erst-Ladevorgang.
function initPokedex() {
	assignCoreElements();
	if (!grid || !loadMoreButton || !loadingIndicator) return;
	wireUiHandlers();
	setupOverlaySupport();
	hideErrorBanner();
	hideNoResultsMessage();
	loadNextBatch();
}

// Sammelt und speichert die wichtigsten DOM-Elemente der Anwendung.
function assignCoreElements() {
	grid = document.getElementById('pokemon-grid');
	loadMoreButton = document.getElementById('loadMoreButton');
	loadingIndicator = document.getElementById('loading-indicator');
	searchInput = document.getElementById('searchInput');
	searchButton = document.getElementById('searchButton');
	errorBanner = document.getElementById('errorBanner');
	retryButton = document.getElementById('retryButton');
	errorMessageText = document.getElementById('errorMessage');
	noResultsMessage = document.getElementById('noResultsMessage');
}

// Verknüpft Eingabefelder, Buttons und Retry-Aktionen mit ihren Handlern.
function wireUiHandlers() {
	if (searchInput) searchInput.oninput = handleSearchInput;
	if (searchButton) searchButton.onclick = handleSearchButton;
	if (retryButton) retryButton.onclick = handleRetryClick;
	loadMoreButton.onclick = loadNextBatch;
	if (grid) grid.onclick = handlePokemonCardClick;
}

// Lädt den nächsten Pokémon-Satz und kümmert sich um Ladezustand sowie Fehler.
async function loadNextBatch() {
	if (isLoading) return;
	startLoadingState();
	try {
		const list = await fetchPokemonList(offset, POKEMON_LIMIT);
		const details = await loadPokemonDetails(list);
		handlePokemonBatch(details);
	} catch (error) {
		handleFetchError(error);
	} finally {
		stopLoadingState();
	}
}

// Zeigt Ladefeedback an und deaktiviert den Mehr-Laden-Button.
function startLoadingState() {
	hideErrorBanner();
	hideNoResultsMessage();
	isLoading = true;
	setButtonDisabled(true);
	setButtonText(loadingButtonLabel);
	showLoadingIndicator();
}

// Reaktiviert den Mehr-Laden-Button und blendet den Spinner aus.
function stopLoadingState() {
	hideLoadingIndicator();
	if (hasMorePokemon) {
		setButtonDisabled(false);
		setButtonText(loadButtonLabel);
	}
	isLoading = false;
}

// Entprellt Suchänderungen und blendet sichtbare Fehlermeldungen aus.
function handleSearchInput() {
	if (!searchInput) return;
	hideErrorBanner();
	hideNoResultsMessage();
	debounceSearch(searchInput.value);
}

// Startet die Suche sofort beim Klick auf den Suchbutton.
function handleSearchButton() {
	if (!searchInput) return;
	hideErrorBanner();
	hideNoResultsMessage();
	applySearch(searchInput.value);
}

// Verzögert die Suchausführung, um unnötige API-Aufrufe zu vermeiden.
function debounceSearch(rawTerm) {
	if (searchDelayToken) window.clearTimeout(searchDelayToken);
	searchDelayToken = window.setTimeout(function triggerSearch() {
		applySearch(rawTerm);
	}, searchDebounceDelay);
}

// Filtert Pokémon nach Namen und rendert passende Karten.
async function applySearch(rawTerm) {
	if (!grid) return;
	const term = normalizeSearchTerm(rawTerm);
	activeSearchTerm = term;
	if (!term || term.length < minSearchLength) return resetSearchToCached(term);
	try {
		const filtered = await filterPokemonByName(term);
		if (activeSearchTerm !== term) return;
		renderSearchResults(term, filtered);
	} catch (error) {
		handleSearchError(error);
	}
}

// Setzt die Ergebnisliste auf die vorhandene Cache-Auswahl zurück.
function resetSearchToCached(term) {
	const baseList = paginatedPokemon.length ? paginatedPokemon : cachedPokemon;
	renderPokemonCards(grid, baseList, true);
	updateLoadMoreVisibility(term);
	hideNoResultsMessage();
}

// Rendert Treffer, aktualisiert Button und blendet Hinweise passend ein.
function renderSearchResults(term, list) {
	renderPokemonCards(grid, list, true);
	updateLoadMoreVisibility(term);
	syncNoResultsMessage(term, list);
}

// Protokolliert Suchfehler und zeigt den Fehlerbanner an.
function handleSearchError(error) {
	console.error('Fehler bei der Pokémon-Suche:', error);
	showErrorBanner('Beim Suchen ist ein Fehler aufgetreten. Bitte versuche es erneut.');
}

// Kürzt und kleinschreibt den Suchbegriff für verlässliche Vergleiche.
function normalizeSearchTerm(term) {
	if (!term) return '';
	return term.trim().toLowerCase();
}

// Liefert gecachte Pokémon oder lädt fehlende Treffer nach.
async function filterPokemonByName(term) {
	if (!term || term.length < minSearchLength) return cachedPokemon;
	const catalog = await loadFullPokemonCatalog();
	const matches = collectCatalogMatches(catalog, term);
	if (!matches.length) return [];
	const split = splitMatchesByCache(matches);
	const combined = split.cached.slice();
	if (split.missing.length) {
		const fetched = await loadPokemonDetails(split.missing);
		const additions = mergePokemonIntoCache(fetched);
		combined.push(...additions);
	}
	return sortPokemonById(combined);
}

// Filtert Katalogeinträge, deren Namen den Suchbegriff enthalten.
function collectCatalogMatches(catalog, term) {
	return catalog.filter((candidate) => candidate && candidate.name && candidate.name.includes(term));
}

// Teilt Treffer in bereits gecachte und noch fehlende Einträge.
function splitMatchesByCache(matches) {
	const cached = [];
	const missing = [];
	for (let i = 0; i < matches.length; i += 1) {
		const entry = matches[i];
		const stored = findPokemonInCacheByName(entry.name);
		if (stored) cached.push(stored);
		else missing.push(entry);
	}
	return { cached: cached, missing: missing };
}

// Erstellt eine nach Pokémon-ID sortierte Kopie.
function sortPokemonById(list) {
	const copy = list.slice();
	copy.sort((a, b) => a.id - b.id);
	return copy;
}

// Blendet den Mehr-Laden-Button während einer aktiven Suche aus.
function updateLoadMoreVisibility(term) {
	if (!loadMoreButton) return;
	const isSearching = term && term.length >= minSearchLength;
	loadMoreButton.style.display = isSearching ? 'none' : '';
}

// Schaltet die "Keine Treffer"-Hinweisfläche passend zur Suche um.
function syncNoResultsMessage(term, results) {
	const isActiveSearch = term && term.length >= minSearchLength;
	if (!isActiveSearch) {
		hideNoResultsMessage();
		return;
	}
	if (results && results.length) hideNoResultsMessage();
	else showNoResultsMessage();
}

// Rendert neue Karten und aktualisiert den Paging-Zustand.
function handlePokemonBatch(pokemon) {
	const newEntries = mergePokemonIntoCache(pokemon);
	offset += pokemon.length;
	if (newEntries.length) {
		paginatedPokemon = paginatedPokemon.concat(newEntries);
		renderPokemonCards(grid, newEntries, false);
	}
	if (pokemon.length < POKEMON_LIMIT) {
		hasMorePokemon = false;
		setButtonDisabled(true);
		setButtonText(noMorePokemonLabel);
	}
}

// Protokolliert Ladefehler und zeigt den Fehlerbanner mit Retry-Hinweis.
function handleFetchError(error) {
	console.error('Fehler beim Laden der Pokémon:', error);
	hideNoResultsMessage();
	showErrorBanner('Beim Laden der Pokémon ist ein Fehler aufgetreten. Bitte versuche es erneut.');
}

// Startet den Ladeversuch neu, sobald der Retry-Button gedrückt wird.
function handleRetryClick() {
	if (isLoading) return;
	hideErrorBanner();
	hideNoResultsMessage();
	loadNextBatch();
}

// Hält fest, welche Pokémon gerade sichtbar sind.
function updateCurrentDisplayState(list, reset) {
	if (reset) {
		currentDisplayList = Array.isArray(list) ? list.slice() : [];
		return;
	}
	if (!Array.isArray(list) || !list.length) return;
	currentDisplayList = currentDisplayList.concat(list);
}

// Bereitet Overlay-Container und Tastatursteuerung vor.
function setupOverlaySupport() {
	const root = ensureOverlayRoot();
	if (!root) return;
	document.onkeydown = handleOverlayKeydown;
}

// Erzeugt den Overlay-Container bei Bedarf.
function ensureOverlayRoot() {
	if (overlayRoot) return overlayRoot;
	if (!document || !document.body) return null;
	const root = document.getElementById('pokemonOverlayRoot');
	if (!root) return null;
	root.onclick = handleOverlayInteraction;
	overlayRoot = root;
	return overlayRoot;
}

// Öffnet das Overlay für das angeklickte Pokémon.
function handlePokemonCardClick(event) {
	const origin = event.target instanceof Element ? event.target : null;
	if (!origin) return;
	const card = origin.closest('.pokemon-card');
	if (!card || !grid || !grid.contains(card)) return;
	const idValue = Number(card.getAttribute('data-pokemon-id'));
	if (!idValue) return;
	const index = findPokemonIndexInDisplay(idValue);
	if (index < 0) return;
	openPokemonOverlay(index);
}

// Sucht den Index eines Pokémon in der sichtbaren Liste.
function findPokemonIndexInDisplay(id) {
	if (!currentDisplayList.length) return -1;
	for (let i = 0; i < currentDisplayList.length; i += 1) {
		const entry = currentDisplayList[i];
		if (entry && entry.id === id) return i;
	}
	return -1;
}

// Öffnet das Overlay und sperrt den Hintergrund.
function openPokemonOverlay(index) {
	if (!renderOverlayContent(index)) return;
	const root = ensureOverlayRoot();
	if (!root) return;
	root.classList.add('is-active');
	lockBodyScroll(true);
}

// Rendert den Overlay-Inhalt für einen Index.
function renderOverlayContent(index) {
	if (!window.PokedexTemplates || !window.PokedexTemplates.createPokemonOverlay) return false;
	if (!currentDisplayList.length || index < 0 || index >= currentDisplayList.length) return false;
	const root = ensureOverlayRoot();
	if (!root) return false;
	const pokemon = currentDisplayList[index];
	currentOverlayIndex = index;
	root.innerHTML = window.PokedexTemplates.createPokemonOverlay(pokemon);
	syncOverlayNavState();
	return true;
}

// Passt die Navigationsbuttons dem Index an.
function syncOverlayNavState() {
	if (!overlayRoot) return;
	const prev = overlayRoot.querySelector('.pokemon-overlay__nav--prev');
	const next = overlayRoot.querySelector('.pokemon-overlay__nav--next');
	if (prev) prev.disabled = currentOverlayIndex <= 0;
	if (next) next.disabled = currentOverlayIndex >= currentDisplayList.length - 1;
}

// Schliesst das Overlay und gibt den Hintergrund frei.
function closePokemonOverlay() {
	if (!overlayRoot) return;
	overlayRoot.classList.remove('is-active');
	overlayRoot.innerHTML = '';
	currentOverlayIndex = -1;
	lockBodyScroll(false);
}

// Springt im Overlay zum nächsten oder vorherigen Pokémon.
function changeOverlayPokemon(step) {
	const nextIndex = currentOverlayIndex + step;
	if (!renderOverlayContent(nextIndex)) return;
}

// Reagiert auf Klicks innerhalb des Overlays.
function handleOverlayInteraction(event) {
	if (currentOverlayIndex === -1) return;
	const origin = event.target instanceof Element ? event.target : null;
	if (!origin) return;
	if (origin.classList.contains('pokemon-overlay__close')) return closePokemonOverlay();
	if (origin.classList.contains('pokemon-overlay__backdrop')) return closePokemonOverlay();
	const prev = origin.closest('.pokemon-overlay__nav--prev');
	if (prev) return changeOverlayPokemon(-1);
	const next = origin.closest('.pokemon-overlay__nav--next');
	if (next) return changeOverlayPokemon(1);
	const insideCard = origin.closest('.pokemon-overlay__card');
	const insideNav = origin.closest('.pokemon-overlay__nav');
	if (!insideCard && !insideNav) return closePokemonOverlay();
}

// Ermöglicht ESC-Schließen und Pfeiltasten-Steuerung.
function handleOverlayKeydown(event) {
	if (currentOverlayIndex === -1) return;
	if (event.key === 'Escape') closePokemonOverlay();
	else if (event.key === 'ArrowLeft') changeOverlayPokemon(-1);
	else if (event.key === 'ArrowRight') changeOverlayPokemon(1);
}

// Sperrt oder erlaubt Scrollen des Body-Elements.
function lockBodyScroll(state) {
	if (!document || !document.body) return;
	const method = state ? 'add' : 'remove';
	document.body.classList[method]('overlay-open');
}
