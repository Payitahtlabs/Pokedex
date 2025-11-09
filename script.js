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
const typeColors = {
	bug: '#9dc985',
	dark: '#595761',
	dragon: '#0c6ac8',
	electric: '#f9d74b',
	fairy: '#f5a8ce',
	fighting: '#ce3d32',
	fire: '#ff9d55',
	flying: '#88aadd',
	ghost: '#5269ad',
	grass: '#5dbb63',
	ground: '#d87c4a',
	ice: '#74cfc0',
	normal: '#a9a778',
	poison: '#b66fa3',
	psychic: '#f9898a',
	rock: '#c5b489',
	steel: '#5a8ea2',
	water: '#4d8ede',
	default: '#f0f4f8',
};
const POKEMON_LIMIT = 20;
const API_URL = 'https://pokeapi.co/api/v2/pokemon';
const loadButtonLabel = 'Weitere Pokémon laden';
const loadingButtonLabel = 'Pokémon werden geladen...';
const noMorePokemonLabel = 'Keine weiteren Pokémon';
const minSearchLength = 3;
const fullCatalogLimit = 2000;
const searchDebounceDelay = 280;

initPokedex();

function initPokedex() {
	assignCoreElements();
	if (!grid || !loadMoreButton || !loadingIndicator) return;
	wireUiHandlers();
	hideErrorBanner();
	loadNextBatch();
}

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

function wireUiHandlers() {
	if (searchInput) searchInput.oninput = handleSearchInput;
	if (searchButton) searchButton.onclick = handleSearchButton;
	if (retryButton) retryButton.onclick = handleRetryClick;
	loadMoreButton.onclick = loadNextBatch;
}

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

function startLoadingState() {
	hideErrorBanner();
	isLoading = true;
	setButtonDisabled(true);
	setButtonText(loadingButtonLabel);
	showLoadingIndicator();
}

function stopLoadingState() {
	hideLoadingIndicator();
	if (hasMorePokemon) {
		setButtonDisabled(false);
		setButtonText(loadButtonLabel);
	}
	isLoading = false;
}

function handleSearchInput() {
	if (!searchInput) return;
	hideErrorBanner();
	debounceSearch(searchInput.value);
}

function handleSearchButton() {
	if (!searchInput) return;
	hideErrorBanner();
	applySearch(searchInput.value);
}

function debounceSearch(rawTerm) {
	if (searchDelayToken) window.clearTimeout(searchDelayToken);
	searchDelayToken = window.setTimeout(function triggerSearch() {
		applySearch(rawTerm);
	}, searchDebounceDelay);
}

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

function normalizeSearchTerm(term) {
	if (!term) return '';
	return term.trim().toLowerCase();
}

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

function collectCatalogMatches(catalog, term) {
	return catalog.filter((candidate) => candidate && candidate.name && candidate.name.includes(term));
}

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

function sortPokemonById(list) {
	const copy = list.slice();
	copy.sort((a, b) => a.id - b.id);
	return copy;
}

function updateLoadMoreVisibility(term) {
	if (!loadMoreButton) return;
	const isSearching = term && term.length >= minSearchLength;
	loadMoreButton.style.display = isSearching ? 'none' : '';
}

async function loadFullPokemonCatalog() {
	if (fullPokemonCatalog.length) return fullPokemonCatalog;
	if (!fullCatalogPromise) {
		fullCatalogPromise = fetchPokemonList(0, fullCatalogLimit);
	}
	try {
		fullPokemonCatalog = await fullCatalogPromise;
		return fullPokemonCatalog;
	} catch (error) {
		fullCatalogPromise = null;
		throw error;
	}
}

function findPokemonInCacheByName(name) {
	if (!name) return null;
	const target = name.toUpperCase();
	return cachedPokemon.find((entry) => entry && entry.name === target) || null;
}

function mergePokemonIntoCache(pokemonList) {
	if (!pokemonList) return [];
	const additions = [];
	pokemonList.forEach((entry) => {
		if (!entry || typeof entry.id !== 'number') return;
		if (isPokemonInCache(entry.id)) return;
		cachedPokemon.push(entry);
		additions.push(entry);
	});
	return additions;
}

function isPokemonInCache(id) {
	return cachedPokemon.some((entry) => entry && entry.id === id);
}

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

function handleFetchError(error) {
	console.error('Fehler beim Laden der Pokémon:', error);
	showErrorBanner('Beim Laden der Pokémon ist ein Fehler aufgetreten. Bitte versuche es erneut.');
}

function handleRetryClick() {
	if (isLoading) return;
	hideErrorBanner();
	loadNextBatch();
}

function showErrorBanner(message) {
	if (!errorBanner) return;
	if (errorMessageText) errorMessageText.textContent = message;
	errorBanner.classList.remove('d-none');
	if (errorBanner.scrollIntoView) {
		errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
}

function hideErrorBanner() {
	if (!errorBanner) return;
	errorBanner.classList.add('d-none');
}

function setButtonDisabled(state) {
	loadMoreButton.disabled = state;
}

function setButtonText(text) {
	loadMoreButton.textContent = text;
}

function showLoadingIndicator() {
	const message = loadingIndicator.querySelector('p');
	if (message) message.textContent = 'Pokémon werden geladen...';
	loadingIndicator.classList.remove('d-none');
}

function hideLoadingIndicator() {
	loadingIndicator.classList.add('d-none');
}

async function fetchPokemonList(offsetValue, limit) {
	const url = API_URL + '?offset=' + offsetValue + '&limit=' + limit;
	const response = await fetch(url);
	if (!response.ok) throw new Error('HTTP-Code ' + response.status);
	const data = await response.json();
	return data.results || [];
}

async function loadPokemonDetails(pokemonList) {
	if (!pokemonList || !pokemonList.length) return [];
	const detailPromises = pokemonList
		.filter((entry) => entry && entry.url)
		.map((entry) => fetchPokemonDetails(entry.url));
	return Promise.all(detailPromises);
}

async function fetchPokemonDetails(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error('Detail-Code ' + response.status);
	const data = await response.json();
	return simplifyPokemonData(data);
}

function simplifyPokemonData(data) {
	const image = selectPokemonImage(data);
	const types = extractPokemonTypes(data);
	const mainType = types.length ? types[0].toLowerCase() : 'default';
	return {
		id: data.id,
		name: (data.name || 'Unbekannt').toUpperCase(),
		image: image,
		weight: formatWeight(data.weight),
		types: types,
		background: buildCardBackground(resolveTypeColor(mainType)),
	};
}

function selectPokemonImage(data) {
	if (data.sprites && data.sprites.other && data.sprites.other['official-artwork']) {
		return data.sprites.other['official-artwork'].front_default;
	}
	if (data.sprites) return data.sprites.front_default;
	return '';
}

function extractPokemonTypes(data) {
	if (!data.types) return [];
	return data.types
		.map((slot) => (slot.type && slot.type.name ? capitalize(slot.type.name) : null))
		.filter((name) => name);
}

function capitalize(name) {
	if (!name) return '';
	return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatWeight(weight) {
	if (!weight && weight !== 0) return '?';
	return (weight / 10).toFixed(1);
}

function resolveTypeColor(type) {
	const key = type || 'default';
	return typeColors[key] || typeColors.default;
}

function buildCardBackground(color) {
	return 'linear-gradient(135deg, ' + color + ' 0%, rgba(255,255,255,0.9) 100%)';
}

function renderPokemonCards(target, pokemonList, reset) {
	if (reset) target.innerHTML = '';
	if (!window.PokedexTemplates || !window.PokedexTemplates.createPokemonCard) return;
	pokemonList.forEach((pokemon) => {
		const cardMarkup = window.PokedexTemplates.createPokemonCard(pokemon);
		target.insertAdjacentHTML('beforeend', cardMarkup);
	});
}
