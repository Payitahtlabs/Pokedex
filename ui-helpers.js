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
function hideErrorBanner() {
	if (!errorBanner) return;
	errorBanner.classList.add('d-none');
}

// Aktiviert oder deaktiviert den Mehr-Laden-Button.
function setButtonDisabled(state) {
	loadMoreButton.disabled = state;
}

// Aktualisiert den Text des Mehr-Laden-Buttons.
function setButtonText(text) {
	loadMoreButton.textContent = text;
}

// Aktualisiert und zeigt die Ladeanzeige an.
function showLoadingIndicator() {
	const message = loadingIndicator.querySelector('p');
	if (message) message.textContent = 'Pokémon werden geladen...';
	loadingIndicator.classList.remove('d-none');
}

// Blendet die Ladeanzeige aus.
function hideLoadingIndicator() {
	loadingIndicator.classList.add('d-none');
}

// Rendert Karten-Markup für eine Pokémon-Liste ins Grid.
function renderPokemonCards(target, pokemonList, reset) {
	if (reset) target.innerHTML = '';
	if (!window.PokedexTemplates || !window.PokedexTemplates.createPokemonCard) return;
	pokemonList.forEach((pokemon) => {
		const cardMarkup = window.PokedexTemplates.createPokemonCard(pokemon);
		target.insertAdjacentHTML('beforeend', cardMarkup);
	});
}
