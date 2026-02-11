// Handle CSV parsing and rendering product catalog
function loadCatalog() {
  Papa.parse("products.csv", {
    download: true,
    header: true,
    complete: function(results) {
      const products = results.data.filter(product => product.name && product.name.trim() !== "");
      window.productsData = products;

      // If a search query is present in the URL, pre-fill input and filter
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q');
      const searchInput = document.getElementById('search-input');
      if (searchInput && q) searchInput.value = q;

      // wire control events
      wireFilterControls();

      if (q) {
        filterAndRender(q);
      } else {
        renderProductGrid(products);
      }
    }
  });
}

function wireFilterControls() {
  const sortSelect = document.getElementById('sort-select');
  const searchInput = document.getElementById('search-input');
  if (sortSelect) sortSelect.addEventListener('change', function() { filterAndRender(searchInput ? searchInput.value.trim() : ''); });
}

// Load and display featured items (3 random products)
function loadFeaturedItems() {
  Papa.parse("products.csv", {
    download: true,
    header: true,
    complete: function(results) {
      const products = results.data.filter(product => product.name && product.name.trim() !== "");
      const randomProducts = getRandomProducts(products, 3);
      renderFeaturedItems(randomProducts);
    }
  });
}

// Load and display a single product detail
function loadProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (!productId) {
    document.getElementById("product-detail-container").innerHTML = "<p>Product not found</p>";
    return;
  }
  
  Papa.parse("products.csv", {
    download: true,
    header: true,
    complete: function(results) {
      const products = results.data;
      const product = products.find(p => p.id == productId);
      
      if (product) {
        renderProductDetail(product);
      } else {
        document.getElementById("product-detail-container").innerHTML = "<p>Product not found</p>";
      }
    }
  });
}

// Render single product detail
function renderProductDetail(product) {
  const detailContainer = document.getElementById("product-detail-container");
  detailContainer.innerHTML = "";
  
  // Update page title
  document.title = product.name;
  
  const productDetail = document.createElement("div");
  productDetail.classList.add("product-detail");
  
  productDetail.innerHTML = `
    <h2>${product.name}</h2>
    <img src="${product.image_url}" alt="${product.name}" class="product-detail-image">
    <p><strong>Price:</strong> $${product.price}</p>
    <p><strong>Brand:</strong> ${product.brand}</p>
    <p><strong>Size:</strong> ${product.size}</p>
    <p><strong>Category:</strong> ${product.category}</p>
  `;
  
  detailContainer.appendChild(productDetail);
}

// Get random products from array
function getRandomProducts(products, count) {
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Create featured items display
function renderFeaturedItems(products) {
  const featuredContainer = document.getElementById("featured-items-list");
  if (!featuredContainer) return;
  
  featuredContainer.innerHTML = "";

  products.forEach(product => {
    const productCard = document.createElement("div");
    productCard.classList.add("product-card");
    productCard.style.cursor = "pointer";

    productCard.innerHTML = `
      <h3>${product.name}</h3>
      <p>Price: $${product.price}</p>
      <p>Brand: ${product.brand}</p>
      <p>Size: ${product.size}</p>
      <p>Category: ${product.category}</p>
      <image src="${product.image_url}" alt="${product.name}" class="product-image">
    `;
    
    productCard.addEventListener("click", function() {
      window.location.href = `product.html?id=${product.id}`;
    });

    featuredContainer.appendChild(productCard);
  });
}

// Create product grid layout
function renderProductGrid(products) {
  const catalogContainer = document.getElementById("catalog-items");
  if (!catalogContainer) return;
  catalogContainer.innerHTML = "";

  products.forEach(product => {
    if (!product.name || product.name.trim() === "") return;

    const productCard = document.createElement("li");
    productCard.classList.add("product-card");
    productCard.style.cursor = "pointer";

    productCard.innerHTML = `
      <h3>${product.name}</h3>
      <p>Price: $${product.price}</p>
      <p>Brand: ${product.brand}</p>
      <p>Size: ${product.size}</p>
      <p>Category: ${product.category}</p>
      <image src="${product.image_url}" alt="${product.name}" class="product-image">
    `;
    
    productCard.addEventListener("click", function() {
      window.location.href = `product.html?id=${product.id}`;
    });

    catalogContainer.appendChild(productCard);
  });
}

// Filter products by term and render
function filterAndRender(term) {
  if (!window.productsData) return;
  const q = (term || "").trim().toLowerCase();
  // start from base set
  let results = window.productsData.slice();

  // query text filter
  if (q !== "") {
    results = results.filter(p => {
      const name = (p.name || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const size = (p.size || "").toLowerCase();
      return name.includes(q) || brand.includes(q) || category.includes(q) || size.includes(q);
    });
    // update URL query param without reloading
    const newUrl = `${window.location.pathname}?q=${encodeURIComponent(term)}`;
    history.replaceState(null, '', newUrl);
  } else {
    // clear query param
    history.replaceState(null, '', window.location.pathname);
  }

  // sort
  const sortSelect = document.getElementById('sort-select');
  const sort = sortSelect ? sortSelect.value : 'none';
  if (sort === 'price-asc' || sort === 'price-desc') {
    results.sort((a, b) => {
      const pa = parseFloat(a.price) || 0;
      const pb = parseFloat(b.price) || 0;
      return sort === 'price-asc' ? pa - pb : pb - pa;
    });
  } else if (sort === 'size-asc' || sort === 'size-desc') {
    results.sort((a, b) => {
      const sa = extractSizeValue(a.size);
      const sb = extractSizeValue(b.size);
      return sort === 'size-asc' ? sa - sb : sb - sa;
    });
  } else if (sort === 'brand-asc' || sort === 'brand-desc') {
    results.sort((a, b) => {
      const ba = (a.brand || '').toLowerCase();
      const bb = (b.brand || '').toLowerCase();
      if (ba < bb) return sort === 'brand-asc' ? -1 : 1;
      if (ba > bb) return sort === 'brand-asc' ? 1 : -1;
      return 0;
    });
  }

  renderProductGrid(results);
}

function extractSizeValue(sizeStr) {
  if (!sizeStr) return 0;
  const m = String(sizeStr).match(/([0-9]+\.?[0-9]*)/);
  return m ? parseFloat(m[1]) : 0;
}

// Handle search submission or redirect from other pages
function handleSearchSubmit(term) {
  const isCatalog = !!document.getElementById('catalog-items');
  if (isCatalog) {
    filterAndRender(term);
  } else {
    window.location.href = `catalog.html?q=${encodeURIComponent(term)}`;
  }
}

// Wire up global search input
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  if (!searchInput) return;

  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit(searchInput.value.trim());
    }
  });

  // Add click handler for search button
  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      handleSearchSubmit(searchInput.value.trim());
    });
  }

  // Live-filter while on catalog page
  searchInput.addEventListener('input', function() {
    if (document.getElementById('catalog-items')) {
      filterAndRender(searchInput.value.trim());
    }
  });
});

// Load featured items on index page
if (document.getElementById("featured-items-list")) {
  loadFeaturedItems();
}

// Load catalog on catalog page
if (document.getElementById("catalog-items")) {
  loadCatalog();
}

// Load product detail on product page
if (document.getElementById("product-detail-container")) {
  loadProductDetail();
}