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
const FEATURED_MOVE_LIMIT = 6;
const moveDetailCache = {};

// Holt den kompletten Poké-Katalog oder stößt ihn bei Bedarf an.
async function loadFullPokemonCatalog() {
	if (fullPokemonCatalog.length) return fullPokemonCatalog;
	if (!fullCatalogPromise) {
		fullCatalogPromise = fetchPokemonList(0, FULL_CATALOG_LIMIT);
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

// Stellt sicher, dass die für einen Tab benötigten Daten verfügbar sind.
async function ensurePokemonDataForTab(pokemon, tabKey) {
	if (!pokemon) return;
	const key = validateOverlayTabKey(tabKey);
	switch (key) {
		case 'about':
			await ensurePokemonAbout(pokemon);
			break;
		case 'stats':
			await ensurePokemonStats(pokemon);
			break;
		case 'evolution':
			await ensurePokemonEvolution(pokemon);
			break;
		case 'moves':
			await ensurePokemonMoves(pokemon);
			break;
		default:
			break;
	}
}

// Stellt sicher, dass "About"-Daten (Spezies, Gender etc.) vorliegen.
async function ensurePokemonAbout(pokemon) {
	if (!pokemon || pokemon.__aboutLoaded) return;
	if (pokemon.__aboutPromise) return pokemon.__aboutPromise;
	pokemon.__aboutPromise = (async function loadAbout() {
		if (!pokemon.__speciesUrl) {
			pokemon.__aboutLoaded = true;
			return;
		}
		const species = await fetchPokemonSpecies(pokemon.__speciesUrl);
		pokemon.__speciesData = species;
		pokemon.species = formatSpeciesName(species);
		pokemon.gender = formatGenderRate(species);
		pokemon.eggGroups = formatEggGroups(species);
		pokemon.hatchInfo = formatHatchInfo(species);
		pokemon.__aboutLoaded = true;
	})();
	try {
		await pokemon.__aboutPromise;
	} finally {
		pokemon.__aboutPromise = null;
	}
}

// Berechnet die Basiswerte, sobald sie benötigt werden.
async function ensurePokemonStats(pokemon) {
	if (!pokemon || pokemon.__statsLoaded) return;
	pokemon.stats = extractPokemonStats(pokemon.__rawStats);
	pokemon.__statsLoaded = true;
	pokemon.__rawStats = [];
}

// Lädt die Evolutionskette bei Bedarf nach.
async function ensurePokemonEvolution(pokemon) {
	if (!pokemon || pokemon.__evolutionLoaded) return;
	if (pokemon.__evolutionPromise) return pokemon.__evolutionPromise;
	pokemon.__evolutionPromise = (async function loadEvolution() {
		await ensurePokemonAbout(pokemon);
		const chain = await fetchEvolutionChain(pokemon.__speciesData);
		pokemon.evolutions = buildEvolutionEntries(chain);
		pokemon.__evolutionLoaded = true;
	})();
	try {
		await pokemon.__evolutionPromise;
	} finally {
		pokemon.__evolutionPromise = null;
	}
}

// Lädt Move-Details, sobald der Tab geöffnet wird.
async function ensurePokemonMoves(pokemon) {
	if (!pokemon || pokemon.__movesLoaded) return;
	if (pokemon.__movesPromise) return pokemon.__movesPromise;
	const rawMoves = Array.isArray(pokemon.__rawMoves) ? pokemon.__rawMoves : [];
	if (!rawMoves.length) {
		pokemon.moves = [];
		pokemon.__movesLoaded = true;
		return;
	}
	pokemon.__movesPromise = (async function loadMoves() {
		pokemon.moves = await buildFeaturedMoves(rawMoves);
		pokemon.__movesLoaded = true;
		pokemon.__rawMoves = [];
	})();
	try {
		await pokemon.__movesPromise;
	} finally {
		pokemon.__movesPromise = null;
	}
}

// Validiert den Tab-Schlüssel und fällt bei unbekannten Werten auf "about" zurück.
function validateOverlayTabKey(key) {
	if (key === 'about' || key === 'stats' || key === 'evolution' || key === 'moves') return key;
	return 'about';
}

// Ruft Detaildaten ab und vereinfacht sie für eine Karte.
async function fetchPokemonDetails(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error('Detail-Code ' + response.status);
	const data = await response.json();
	return await simplifyPokemonData(data);
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

// Lädt die Evolutionskette der Spezies, sofern die API einen Verweis liefert.
async function fetchEvolutionChain(species) {
	if (!species || !species.evolution_chain) return null;
	const url = species.evolution_chain.url;
	if (!url) return null;
	try {
		const response = await fetch(url);
		if (!response.ok) return null;
		return await response.json();
	} catch (error) {
		console.warn('Fehler beim Laden der Evolution:', error);
		return null;
	}
}

// Wandelt rohe API-Daten in das vereinfachte Kartenmodell um.
async function simplifyPokemonData(data) {
	const image = selectPokemonImage(data);
	const types = extractPokemonTypes(data);
	const mainType = types.length ? types[0].toLowerCase() : 'default';
	const entry = buildPokemonBasics(data, image, types);
	addPokemonExtras(entry, mainType);
	entry.__speciesUrl = data && data.species && data.species.url ? data.species.url : null;
	entry.__rawStats = Array.isArray(data && data.stats) ? data.stats : [];
	entry.__rawMoves = Array.isArray(data && data.moves) ? data.moves : [];
	entry.__speciesData = null;
	entry.__aboutPromise = null;
	entry.__evolutionPromise = null;
	entry.__movesPromise = null;
	entry.__aboutLoaded = false;
	entry.__statsLoaded = false;
	entry.__evolutionLoaded = false;
	entry.__movesLoaded = false;
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
		stats: [],
		evolutions: [],
		moves: [],
	};
}

// Ergänzt Hintergrunddaten und legt Defaultwerte für zusätzliche Bereiche an.
function addPokemonExtras(entry, mainType) {
	entry.background = buildCardBackground(resolveTypeColor(mainType));
}

// Extrahiert eine kuratierte Auswahlliste an Moves inklusive Detaildaten.
async function buildFeaturedMoves(rawMoves) {
	if (!Array.isArray(rawMoves) || !rawMoves.length) return [];
	const prioritized = prioritizeMoveRefs(rawMoves);
	const limited = prioritized.slice(0, FEATURED_MOVE_LIMIT);
	const summaries = await Promise.all(limited.map((ref) => loadMoveSummary(ref)));
	return summaries.filter((entry) => entry);
}

// Organisiert Move-Referenzen und bevorzugt Level-Up-Einträge.
function prioritizeMoveRefs(rawMoves) {
	if (!Array.isArray(rawMoves)) return [];
	const levelUp = [];
	const fallback = [];
	rawMoves.forEach((entry) => pushMoveReference(entry, levelUp, fallback));
	sortLevelUpMoves(levelUp);
	return levelUp.concat(fallback);
}

// Fügt eine Move-Referenz der passenden Bucket-Liste hinzu.
function pushMoveReference(entry, levelUp, fallback) {
	if (!entry || !entry.move || !entry.move.url) return;
	const meta = extractMoveMeta(entry);
	const target = meta.method === 'level-up' ? levelUp : fallback;
	target.push({
		url: entry.move.url,
		name: entry.move.name,
		meta: meta,
	});
}

// Sortiert Level-Up-Moves aufsteigend nach Lernlevel.
function sortLevelUpMoves(list) {
	list.sort((a, b) => {
		const levelA = typeof a.meta.level === 'number' ? a.meta.level : Number.POSITIVE_INFINITY;
		const levelB = typeof b.meta.level === 'number' ? b.meta.level : Number.POSITIVE_INFINITY;
		return levelA - levelB;
	});
}

// Extrahiert Level, Methode und Version aus den Move-Verfügbarkeiten.
function extractMoveMeta(rawEntry) {
	const details = Array.isArray(rawEntry.version_group_details) ? rawEntry.version_group_details : [];
	const bestDetail = selectBestMoveDetail(details);
	return composeMoveMeta(bestDetail);
}

// Wählt den besten Detail-Eintrag anhand des niedrigsten Levels.
function selectBestMoveDetail(details) {
	if (!details.length) return null;
	let best = details[0];
	for (const item of details) {
		if (isBetterMoveLevel(item, best)) best = item;
	}
	return best;
}

// Prüft, ob Kandidat gegenüber dem bisherigen Eintrag bevorzugt wird.
function isBetterMoveLevel(candidate, current) {
	if (!candidate) return false;
	const candidateLevel = candidate.level_learned_at || 0;
	const currentLevel = current && current.level_learned_at ? current.level_learned_at : 0;
	if (candidateLevel === 0) return false;
	if (!currentLevel) return true;
	return candidateLevel < currentLevel;
}

// Erzeugt ein Meta-Objekt mit Level, Methode und Version.
function composeMoveMeta(detail) {
	if (!detail) return { level: null, method: 'unknown', version: null };
	return {
		level: typeof detail.level_learned_at === 'number' ? detail.level_learned_at : null,
		method: detail.move_learn_method && detail.move_learn_method.name ? detail.move_learn_method.name : 'unknown',
		version: detail.version_group && detail.version_group.name ? detail.version_group.name : null,
	};
}

// Lädt Move-Details einmalig und erstellt ein vereinfachtes Objekt.
async function loadMoveSummary(reference) {
	if (!reference || !reference.url) return null;
	if (moveDetailCache[reference.url]) return moveDetailCache[reference.url];
	try {
		const response = await fetch(reference.url);
		if (!response.ok) throw new Error('Move-Code ' + response.status);
		const data = await response.json();
		const summary = simplifyMoveEntry(data);
		moveDetailCache[reference.url] = summary;
		return summary;
	} catch (error) {
		console.warn('Fehler beim Laden eines Moves:', error);
		return null;
	}
}

// Reduziert die Move-Daten auf die Felder, die das UI wirklich nutzt.
function simplifyMoveEntry(moveData) {
	if (!moveData) return null;
	return {
		id: moveData.id,
		name: formatMoveName(moveData.name),
		type: deriveMoveType(moveData),
		effect: selectEnglishEffectText(moveData),
	};
}

// Formatiert den Move-Namen oder liefert einen Default zurück.
function formatMoveName(name) {
	if (!name) return 'Unknown';
	return capitalize(name);
}

// Ermittelt den Typennamen des Moves in lesbarer Form.
function deriveMoveType(moveData) {
	if (!moveData || !moveData.type || !moveData.type.name) return '—';
	return capitalize(moveData.type.name);
}

// Wählt eine kurze englische Effektbeschreibung und ersetzt Platzhalter.
function selectEnglishEffectText(moveData) {
	if (!moveData || !Array.isArray(moveData.effect_entries)) return 'No effect info available.';
	for (let i = 0; i < moveData.effect_entries.length; i += 1) {
		const entry = moveData.effect_entries[i];
		if (!entry || !entry.language || entry.language.name !== 'en') continue;
		const text = entry.short_effect || entry.effect || '';
		return cleanEffectText(text, moveData.effect_chance);
	}
	return 'No effect info available.';
}

// Ersetzt $effect_chance Platzhalter in Effekttexten.
function cleanEffectText(text, chance) {
	if (!text) return 'No effect info available.';
	if (typeof chance === 'number') {
		return text.replace(/\$effect_chance/g, chance);
	}
	return text.replace(/\$effect_chance/g, '');
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

// Wandelt eine Evolutionskette in ein flaches Array mit Bild- und Namenseinträgen um.
function buildEvolutionEntries(chain) {
	if (!chain || !chain.chain) return [];
	const list = [];
	collectEvolutionNodes(chain.chain, list);
	return list;
}

// Traversiert rekursiv die Evolutionskette und sammelt jede Stufe ein.
function collectEvolutionNodes(node, bucket) {
	if (!node || !bucket) return;
	bucket.push(createEvolutionEntry(node.species));
	if (!node.evolves_to || !node.evolves_to.length) return;
	for (let i = 0; i < node.evolves_to.length; i += 1) {
		collectEvolutionNodes(node.evolves_to[i], bucket);
	}
}

// Erstellt einen darstellbaren Eintrag mit Namen und Artwork-URL.
function createEvolutionEntry(species) {
	if (!species) return { name: 'Unknown', image: '' };
	const id = resolveSpeciesId(species.url);
	const label = species.name ? capitalize(species.name) : 'Unknown';
	return { name: label, image: buildArtworkUrl(id) };
}

// Ermittelt die numerische ID aus einer Spezies-URL.
function resolveSpeciesId(url) {
	if (!url) return null;
	const parts = url.split('/').filter(Boolean);
	const id = Number(parts.pop());
	return Number.isNaN(id) ? null : id;
}

// Liefert die offizielle Artwork-URL zu einer Pokémon-ID.
function buildArtworkUrl(id) {
	if (!id) return '';
	return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + id + '.png';
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
