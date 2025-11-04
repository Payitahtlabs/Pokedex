function createPokemonCard(pokemon) {
	const { id = 0, name = 'Pokemon', image = '', weight = '?', background = 'rgba(255,255,255,0.9)' } = pokemon;
	const badges = buildTypeBadges(pokemon.types || []);
	const idLabel = String(id).padStart(3, '0');

	return `
		<div class="col">
			<article class="pokemon-card card h-100 border-0 shadow-sm" style="--card-bg: ${background};">
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

function buildTypeBadges(types) {
	let markup = '';
	for (let i = 0; i < types.length; i += 1) {
		markup += '<span class="badge rounded-pill text-bg-info me-1">' + types[i] + '</span>';
	}
	return markup;
}

window.PokedexTemplates = {
	createPokemonCard: createPokemonCard,
};
