const state = {
  recipes: [],
  restaurants: [],
  tab: "recipes",
  category: "All",
  selectedRecipe: null,
  selectedRestaurant: null
};

const fallbackImage = "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?q=80&w=1200&auto=format&fit=crop";

async function loadData() {
  const [recipes, restaurants] = await Promise.all([
    fetch("data/recipes.json").then(r => r.json()),
    fetch("data/restaurants.json").then(r => r.json())
  ]);

  state.recipes = recipes;
  state.restaurants = restaurants;
  state.selectedRecipe = recipes[0] || null;
  state.selectedRestaurant = restaurants[0] || null;

  render();
}

function render() {
  renderTabs();
  renderSidebar();
  renderContent();
}

function renderTabs() {
  document.querySelectorAll(".tab").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === state.tab);
    button.onclick = () => {
      state.tab = button.dataset.tab;
      render();
    };
  });

  document.getElementById("recipe-panel").classList.toggle("hidden", state.tab !== "recipes");
  document.getElementById("restaurant-panel").classList.toggle("hidden", state.tab !== "restaurants");
}

function renderSidebar() {
  const categories = ["All", ...new Set(state.recipes.map(recipe => recipe.category).filter(Boolean))];

  document.getElementById("category-buttons").innerHTML = categories.map(category => `
    <button class="category-button ${category === state.category ? "active" : ""}" data-category="${escapeHtml(category)}">
      ${escapeHtml(category)}
    </button>
  `).join("");

  document.querySelectorAll(".category-button").forEach(button => {
    button.onclick = () => {
      state.category = button.dataset.category;
      const filtered = filteredRecipes();
      state.selectedRecipe = filtered[0] || state.recipes[0] || null;
      render();
    };
  });

  const recipes = filteredRecipes();

  document.getElementById("recipe-list").innerHTML = recipes.map((recipe, index) => `
    <div class="card ${recipe === state.selectedRecipe ? "active" : ""}" data-recipe-index="${state.recipes.indexOf(recipe)}">
      <strong>${escapeHtml(recipe.title)}</strong>
      <small>${escapeHtml(recipe.category || "")}</small>
    </div>
  `).join("") || `<div class="empty">No recipes in this category yet.</div>`;

  document.querySelectorAll("[data-recipe-index]").forEach(card => {
    card.onclick = () => {
      state.selectedRecipe = state.recipes[Number(card.dataset.recipeIndex)];
      render();
    };
  });

  document.getElementById("restaurant-list").innerHTML = state.restaurants.map((restaurant, index) => `
    <div class="card ${restaurant === state.selectedRestaurant ? "active" : ""}" data-restaurant-index="${index}">
      <strong>${escapeHtml(restaurant.title)}</strong>
      <small>${escapeHtml(restaurant.date || "")}</small>
    </div>
  `).join("") || `<div class="empty">No restaurant memories yet.</div>`;

  document.querySelectorAll("[data-restaurant-index]").forEach(card => {
    card.onclick = () => {
      state.selectedRestaurant = state.restaurants[Number(card.dataset.restaurantIndex)];
      render();
    };
  });
}

function filteredRecipes() {
  if (state.category === "All") return state.recipes;
  return state.recipes.filter(recipe => recipe.category === state.category);
}

function renderContent() {
  const content = document.getElementById("content");

  if (state.tab === "recipes") {
    if (!state.selectedRecipe) {
      content.innerHTML = `<div class="empty">Add your first recipe in Pages CMS.</div>`;
      return;
    }
    content.innerHTML = recipeTemplate(state.selectedRecipe);
    return;
  }

  if (!state.selectedRestaurant) {
    content.innerHTML = `<div class="empty">Add your first restaurant memory in Pages CMS.</div>`;
    return;
  }

  content.innerHTML = restaurantTemplate(state.selectedRestaurant);
}

function recipeTemplate(recipe) {
  const image = recipe.image || fallbackImage;
  return `
    <div class="hero" style="background-image:url('${escapeAttribute(image)}')">
      <div class="hero-text">
        <h2>${escapeHtml(recipe.title)}</h2>
        <p>${escapeHtml(recipe.description || "")}</p>
        <div class="meta">
          ${recipe.category ? `<span class="pill">${escapeHtml(recipe.category)}</span>` : ""}
          ${recipe.time ? `<span class="pill">${escapeHtml(recipe.time)}</span>` : ""}
        </div>
      </div>
    </div>

    <div class="detail">
      <div class="two-columns">
        <section class="box">
          <h3>Ingredients</h3>
          <ul>${listItems(recipe.ingredients)}</ul>
        </section>

        <section class="box">
          <h3>Instructions</h3>
          <ol>${listItems(recipe.instructions)}</ol>
        </section>
      </div>
    </div>
  `;
}

function restaurantTemplate(restaurant) {
  const image = restaurant.image || fallbackImage;
  const gallery = restaurant.gallery || [];

  return `
    <div class="hero" style="background-image:url('${escapeAttribute(image)}')">
      <div class="hero-text">
        <h2>${escapeHtml(restaurant.title)}</h2>
        <p>${escapeHtml(restaurant.comment || "")}</p>
        <div class="meta">
          ${restaurant.date ? `<span class="pill">${escapeHtml(restaurant.date)}</span>` : ""}
          ${restaurant.location ? `<span class="pill">${escapeHtml(restaurant.location)}</span>` : ""}
        </div>
      </div>
    </div>

    <div class="detail">
      <section class="box">
        <h3>Food notes</h3>
        <ul>${listItems(restaurant.foods)}</ul>

        ${gallery.length ? `
          <h3>Pictures</h3>
          <div class="gallery">
            ${gallery.map(src => `<img src="${escapeAttribute(src)}" alt="">`).join("")}
          </div>
        ` : ""}
      </section>
    </div>
  `;
}

function listItems(items) {
  if (!items || !items.length) return "<li>Add items in Pages CMS.</li>";
  return items.map(item => `<li>${escapeHtml(item)}</li>`).join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

loadData().catch(error => {
  console.error(error);
  document.getElementById("content").innerHTML = `
    <div class="empty">
      <h2>Could not load site data</h2>
      <p>Check that data/recipes.json and data/restaurants.json exist.</p>
    </div>
  `;
});
