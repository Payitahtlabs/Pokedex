// Farbdefinitionen für die Typ-zu-Hintergrund-Zuordnung.
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
const STAT_LABEL_MAP = {
	hp: 'HP',
	attack: 'Attack',
	defense: 'Defense',
	'special-attack': 'Sp. Atk',
	'special-defense': 'Sp. Def',
	speed: 'Speed',
};

// Holt den kompletten Poké-Katalog oder stößt ihn bei Bedarf an.
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

// Holt eine paginierte Liste an Pokémon-Grunddaten von der API.
async function fetchPokemonList(offsetValue, limit) {
	const url = API_URL + '?offset=' + offsetValue + '&limit=' + limit;
	const response = await fetch(url);
	if (!response.ok) throw new Error('HTTP-Code ' + response.status);
	const data = await response.json();
	return data.results || [];
}

// Lädt Detaildaten für alle Pokémon in der übergebenen Liste.
async function loadPokemonDetails(pokemonList) {
	if (!pokemonList || !pokemonList.length) return [];
	const detailPromises = pokemonList
		.filter((entry) => entry && entry.url)
		.map((entry) => fetchPokemonDetails(entry.url));
	return Promise.all(detailPromises);
}

// Ruft Detaildaten ab und vereinfacht sie für eine Karte.
async function fetchPokemonDetails(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error('Detail-Code ' + response.status);
	const data = await response.json();
	const species = await fetchPokemonSpecies(data && data.species ? data.species.url : null);
	return simplifyPokemonData(data, species);
}

// Holt ergänzende Speziesdaten für Zuchtinformationen.
async function fetchPokemonSpecies(url) {
	if (!url) return null;
	try {
		const response = await fetch(url);
		if (!response.ok) return null;
		return await response.json();
	} catch (error) {
		console.warn('Fehler beim Laden der Pokémon-Spezies:', error);
		return null;
	}
}

// Wandelt rohe API-Daten in das vereinfachte Kartenmodell um.
function simplifyPokemonData(data, species) {
	const image = selectPokemonImage(data);
	const types = extractPokemonTypes(data);
	const mainType = types.length ? types[0].toLowerCase() : 'default';
	const entry = buildPokemonBasics(data, image, types);
	addPokemonExtras(entry, species, mainType);
	return entry;
}

// Liefert das Grundgerüst für den Karten-Eintrag.
function buildPokemonBasics(data, image, types) {
	return {
		id: data.id,
		name: (data.name || 'Unbekannt').toUpperCase(),
		image: image,
		weight: formatWeight(data.weight),
		height: formatHeight(data.height),
		types: types,
		abilities: extractPokemonAbilities(data),
		stats: extractPokemonStats(data.stats),
	};
}

// Ergänzt Zucht- und Hintergrunddaten.
function addPokemonExtras(entry, species, mainType) {
	entry.species = formatSpeciesName(species);
	entry.gender = formatGenderRate(species);
	entry.eggGroups = formatEggGroups(species);
	entry.hatchInfo = formatHatchInfo(species);
	entry.background = buildCardBackground(resolveTypeColor(mainType));
}

// Wählt das bestmögliche Sprite für die Karte aus.
function selectPokemonImage(data) {
	if (data.sprites && data.sprites.other && data.sprites.other['official-artwork']) {
		return data.sprites.other['official-artwork'].front_default;
	}
	if (data.sprites) return data.sprites.front_default;
	return '';
}

// Extrahiert und kapitalisiert die Typnamen eines Pokémon.
function extractPokemonTypes(data) {
	if (!data.types) return [];
	return data.types
		.map((slot) => (slot.type && slot.type.name ? capitalize(slot.type.name) : null))
		.filter((name) => name);
}

// Setzt den ersten Buchstaben eines Namens auf Groß.
function capitalize(name) {
	if (!name) return '';
	return name.charAt(0).toUpperCase() + name.slice(1);
}

// Rechnet Gewicht von Hektogramm in Kilogramm mit einer Nachkommastelle um.
function formatWeight(weight) {
	if (!weight && weight !== 0) return '?';
	return (weight / 10).toFixed(1);
}

function formatHeight(height) {
	if (!height && height !== 0) return '?';
	return (height / 10).toFixed(1);
}

// Bestimmt die Hintergrundfarbe für den Haupttyp.
function resolveTypeColor(type) {
	const key = type || 'default';
	return typeColors[key] || typeColors.default;
}

// Erzeugt den Farbverlauf für den Kartenhintergrund.
function buildCardBackground(color) {
	return 'linear-gradient(135deg, ' + color + ' 0%, rgba(255,255,255,0.9) 100%)';
}

function extractPokemonAbilities(data) {
	if (!data.abilities) return [];
	return data.abilities
		.map((slot) => (slot.ability && slot.ability.name ? capitalize(slot.ability.name) : null))
		.filter((name) => name);
}

function extractPokemonStats(stats) {
	if (!Array.isArray(stats)) return [];
	return stats
		.map((entry) => {
			if (!entry || !entry.stat) return null;
			const key = entry.stat.name;
			if (!STAT_LABEL_MAP[key]) return null;
			return { label: STAT_LABEL_MAP[key], value: entry.base_stat || 0 };
		})
		.filter((stat) => stat);
}

function formatSpeciesName(species) {
	if (!species || !Array.isArray(species.genera)) return 'Not available';
	for (let i = 0; i < species.genera.length; i += 1) {
		const entry = species.genera[i];
		const language = entry && entry.language ? entry.language.name : null;
		if (language === 'en' && entry.genus) {
			const cleaned = entry.genus.replace(/\s*Pok(?:e|\u00E9)mon$/i, '').trim();
			return cleaned || entry.genus;
		}
	}
	return 'Not available';
}

function formatGenderRate(species) {
	if (!species || typeof species.gender_rate !== 'number') return 'Not available';
	const rate = species.gender_rate;
	if (rate === -1) return 'Genderless';
	const female = (rate * 100) / 8;
	const male = 100 - female;
	return 'Male: ' + formatPercentValue(male) + '% / Female: ' + formatPercentValue(female) + '%';
}

function formatEggGroups(species) {
	if (!species || !Array.isArray(species.egg_groups) || !species.egg_groups.length) return 'Not available';
	const groups = species.egg_groups
		.map((group) => (group && group.name ? capitalize(group.name) : null))
		.filter((name) => name);
	return groups.length ? groups.join(', ') : 'Not available';
}

function formatHatchInfo(species) {
	if (!species || typeof species.hatch_counter !== 'number') return 'Not available';
	const cycles = species.hatch_counter + 1;
	const steps = cycles * 255;
	return cycles + ' cycles (approx. ' + steps + ' steps)';
}

function formatPercentValue(value) {
	if (typeof value !== 'number') return '0';
	return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
}

// Sucht ein Pokémon im Cache über seinen Großbuchstaben-Namen.
function findPokemonInCacheByName(name) {
	if (!name) return null;
	const target = name.toUpperCase();
	return cachedPokemon.find((entry) => entry && entry.name === target) || null;
}

// Fügt neue Pokémon dem Cache hinzu und vermeidet Duplikate.
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

// Prüft, ob eine Pokémon-ID bereits im Cache liegt.
function isPokemonInCache(id) {
	return cachedPokemon.some((entry) => entry && entry.id === id);
}
