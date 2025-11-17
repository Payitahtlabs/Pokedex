# 🔴⚪ Pokédex Master

A modern Single Page Application (SPA) developed during my training at Developer Akademie. The application uses the **PokéAPI** to dynamically load Pokémon data, with a strong focus on performance, clean code architecture, and user experience.

<br>

## ✨ Features & Highlights

### 🔍 Dashboard & Search
* **Infinite Scroll Simulation:** Initially renders 20 Pokémon and loads 20 more via a "Load More" button (Pagination).
* **Smart Search:**
    * **Traffic Optimization:** Search triggers only after entering 3 characters.
    * **Debouncing:** Search queries are delayed (280ms) to prevent unnecessary API calls while typing.
    * **Hybrid Search:** Filters currently loaded data AND requests missing entries from the API if necessary.
* **Visual Feedback:** Loading indicators (spinners) and error handling with a "Retry" function for network issues.

<br>

### 🎴 Detail View (Overlay)
Clicking a card opens a comprehensive modal featuring:
* **Tab Navigation:** Organized into *About*, *Base Stats*, *Evolution*, and *Moves*.
* **Data Visualization:**
    * Dynamic background colors based on the Pokémon type.
    * Color-coded progress bars for Base Stats (Green for high values, Red for low).
* **Evolution Chain:** Visual representation of the evolution line with arrows.
* **Navigation:** Browse through Pokémon using arrow buttons in the overlay or via **Keyboard (Left/Right Arrow)**.

<br>

## 💻 Technical Implementation (Clean Code)

The project follows strict architectural principles to ensure maintainability and readability:

* **Modular Structure:**
    * `script.js`: Main Controller.
    * `pokemon-data.js`: Pure data logic and API communication (Fetch).
    * `template.js`: Decoupled HTML components (Checklist: "Outsource HTML Templates").
    * `ui-helpers.js`: Helper functions for DOM manipulation.
* **Performance:**
    * **Fetch-then-Render:** Data is fully processed before being written to the DOM (prevents layout shifts).
    * **Lazy Loading Images:** Images utilize the `loading="lazy"` attribute.
* **Frameworks:**
    * **Bootstrap 5:** For the responsive grid system and utility classes.
    * **Vanilla JS:** The entire logic was written without JS frameworks (like React/Vue) to demonstrate native JavaScript understanding.

<br>

## 📱 Responsive Design
The app is optimized for "Mobile First":
* Adapts column count from 1 (Mobile) to 5 (Desktop).
* Touch-optimized navigation on smartphones.
* The overlay dynamically adapts to screen height (Scrollable Content).
