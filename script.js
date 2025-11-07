let grid;
let loadMoreButton;
let loadingIndicator;
let searchInput;
let searchButton;
let fullPokemonCatalog = [];
let fullCatalogPromise = null;
let activeSearchTerm = '';
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

initPokedex();

function initPokedex() {
	grid = document.getElementById('pokemon-grid');
	loadMoreButton = document.getElementById('loadMoreButton');
	loadingIndicator = document.getElementById('loading-indicator');
	searchInput = document.getElementById('searchInput');
	searchButton = document.getElementById('searchButton');
	if (!grid || !loadMoreButton || !loadingIndicator) return;
	if (searchInput) searchInput.oninput = handleSearchInput;
	if (searchButton) searchButton.onclick = handleSearchButton;
	loadMoreButton.onclick = loadNextBatch;
	loadNextBatch();
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
	applySearch(searchInput.value);
}

function handleSearchButton() {
	if (!searchInput) return;
	applySearch(searchInput.value);
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
	const matches = [];
	for (let i = 0; i < catalog.length; i += 1) {
		const candidate = catalog[i];
		if (!candidate || !candidate.name) continue;
		if (candidate.name.indexOf(term) !== -1) matches.push(candidate);
	}
	return matches;
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
	copy.sort(function compareById(a, b) {
		return a.id - b.id;
	});
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
	for (let i = 0; i < cachedPokemon.length; i += 1) {
		const entry = cachedPokemon[i];
		if (entry && entry.name === target) return entry;
	}
	return null;
}

function mergePokemonIntoCache(pokemonList) {
	const additions = [];
	if (!pokemonList) return additions;
	for (let i = 0; i < pokemonList.length; i += 1) {
		const entry = pokemonList[i];
		if (!entry || typeof entry.id !== 'number') continue;
		if (isPokemonInCache(entry.id)) continue;
		cachedPokemon.push(entry);
		additions.push(entry);
	}
	return additions;
}

function isPokemonInCache(id) {
	for (let i = 0; i < cachedPokemon.length; i += 1) {
		if (cachedPokemon[i] && cachedPokemon[i].id === id) return true;
	}
	return false;
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
	alert('Beim Laden der Pokémon ist ein Fehler aufgetreten. Bitte versuche es erneut.');
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
	const detailPromises = [];
	for (let i = 0; i < pokemonList.length; i += 1) {
		const entry = pokemonList[i];
		if (entry && entry.url) detailPromises.push(fetchPokemonDetails(entry.url));
	}
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
	const list = [];
	if (!data.types) return list;
	for (let i = 0; i < data.types.length; i += 1) {
		if (data.types[i].type && data.types[i].type.name) {
			list.push(capitalize(data.types[i].type.name));
		}
	}
	return list;
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
	for (let i = 0; i < pokemonList.length; i += 1) {
		const cardMarkup = window.PokedexTemplates.createPokemonCard(pokemonList[i]);
		target.insertAdjacentHTML('beforeend', cardMarkup);
	}
}
