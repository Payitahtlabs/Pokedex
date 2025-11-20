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
const hideErrorBanner = () => errorBanner && errorBanner.classList.add('d-none');

// Aktiviert oder deaktiviert den Mehr-Laden-Button.
const setButtonDisabled = (state) => loadMoreButton.disabled = state;

// Aktualisiert den Text des Mehr-Laden-Buttons.
const setButtonText = (text) => loadMoreButton.textContent = text;

// Aktualisiert und zeigt die Ladeanzeige an.
function showLoadingIndicator() {
	const message = loadingIndicator.querySelector('p');
	if (message) message.textContent = LOADING_BUTTON_LABEL;
	loadingIndicator.classList.remove('d-none');
}

// Blendet die Ladeanzeige aus.
const hideLoadingIndicator = () => loadingIndicator.classList.add('d-none');

// Zeigt den Hinweis, dass keine Pokémon gefunden wurden.
function showNoResultsMessage() {
	if (!noResultsMessage) return;
	noResultsMessage.classList.remove('d-none');
	noResultsMessage.classList.add('animate__fadeIn');
}

// Blendet den Hinweis auf fehlende Treffer aus.
function hideNoResultsMessage() {
	if (!noResultsMessage) return;
	noResultsMessage.classList.add('d-none');
	noResultsMessage.classList.remove('animate__fadeIn');
}

// Rendert Karten-Markup für eine Pokémon-Liste ins Grid.
function renderPokemonCards(target, pokemonList, reset) {
	if (reset) target.innerHTML = '';
	if (!window.PokedexTemplates || !window.PokedexTemplates.createPokemonCard) return;
	if (typeof updateCurrentDisplayState === 'function') {
		updateCurrentDisplayState(pokemonList, reset);
	}
	pokemonList.forEach((pokemon) => {
		const cardMarkup = window.PokedexTemplates.createPokemonCard(pokemon);
		target.insertAdjacentHTML('beforeend', cardMarkup);
	});
}
