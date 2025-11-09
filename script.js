let grid;
let loadMoreButton;
let loadingIndicator;
let searchInput;
let searchButton;
let errorBanner;
let retryButton;
let errorMessageText;
let fullPokemonCatalog = [];
let fullCatalogPromise = null;
let activeSearchTerm = '';
let searchDelayToken = null;
let offset = 0;
let isLoading = false;
let cachedPokemon = [];
let hasMorePokemon = true;
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
	hideErrorBanner();
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
}

// Verknüpft Eingabefelder, Buttons und Retry-Aktionen mit ihren Handlern.
function wireUiHandlers() {
	if (searchInput) searchInput.oninput = handleSearchInput;
	if (searchButton) searchButton.onclick = handleSearchButton;
	if (retryButton) retryButton.onclick = handleRetryClick;
	loadMoreButton.onclick = loadNextBatch;
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
	debounceSearch(searchInput.value);
}

// Startet die Suche sofort beim Klick auf den Suchbutton.
function handleSearchButton() {
	if (!searchInput) return;
	hideErrorBanner();
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
	try {
		const filtered = await filterPokemonByName(term);
		if (activeSearchTerm !== term) return;
		renderPokemonCards(grid, filtered, true);
		updateLoadMoreVisibility(term);
	} catch (error) {
		console.error('Fehler bei der Pokémon-Suche:', error);
		showErrorBanner('Beim Suchen ist ein Fehler aufgetreten. Bitte versuche es erneut.');
	}
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

// Rendert neue Karten und aktualisiert den Paging-Zustand.
function handlePokemonBatch(pokemon) {
	const newEntries = mergePokemonIntoCache(pokemon);
	offset += pokemon.length;
	if (newEntries.length) {
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
	showErrorBanner('Beim Laden der Pokémon ist ein Fehler aufgetreten. Bitte versuche es erneut.');
}

// Startet den Ladeversuch neu, sobald der Retry-Button gedrückt wird.
function handleRetryClick() {
	if (isLoading) return;
	hideErrorBanner();
	loadNextBatch();
}
