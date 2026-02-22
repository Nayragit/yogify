class StickyCTA extends HTMLElement {
  constructor() {
    super();
    this.button = this.querySelector('.sticky-cta__button');
    this.priceElement = this.querySelector('.sticky-cta__price');
    this.scrollThreshold = parseInt(this.dataset.scrollThreshold, 10) || 400;
    
    // Parse the hidden JSON map of variants to prices
    this.variantMap = {};
    const mapScript = this.querySelector('.sticky-cta-variant-map');
    if (mapScript) {
      try {
        this.variantMap = JSON.parse(mapScript.textContent);
      } catch (e) {
        console.error("StickyCTA: Failed to parse variant map.");
      }
    }

    this.bindEvents();
    this.initUniversalPriceSync();
  }

  // --- 1. Universal Price Syncing ---
  initUniversalPriceSync() {
    const updatePriceDisplay = () => {
      let currentVariantId = null;

      // Method A: Check URL parameters (Standard OS 2.0 behavior)
      const urlParams = new URLSearchParams(window.location.search);
      currentVariantId = urlParams.get('variant');

      // Method B: Check the main form ID input directly
      if (!currentVariantId) {
        const idInput = document.querySelector('input[name="id"], select[name="id"]');
        if (idInput) currentVariantId = idInput.value;
      }

      // If we found a variant ID and it exists in our JSON map, update the text instantly
      if (currentVariantId && this.variantMap[currentVariantId] && this.priceElement) {
        this.priceElement.innerHTML = this.variantMap[currentVariantId];
      }
    };

    // Listen for form changes (Dropdowns/Swatches clicking)
    document.addEventListener('change', (e) => {
      if (e.target.closest('form[action*="/cart/add"]') || e.target.name === 'id' || e.target.name.includes('options')) {
        setTimeout(updatePriceDisplay, 50); // Small delay to let theme finish updating inputs
      }
    });

    // Listen for URL changes (Intercepting history updates used by modern themes)
    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      setTimeout(updatePriceDisplay, 50);
    };

    const originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      setTimeout(updatePriceDisplay, 50);
    };

    window.addEventListener('popstate', () => {
      setTimeout(updatePriceDisplay, 50);
    });
  }

  // --- 2. Scroll Visibility & Universal Add To Cart ---
  bindEvents() {
    // Scroll visibility
    window.addEventListener('scroll', () => {
      if (window.innerWidth < 768) {
        if (window.scrollY > this.scrollThreshold) {
          this.classList.add('is-visible');
        } else {
          this.classList.remove('is-visible');
        }
      }
    });

    // Pure Instant Cart Redirect (No text changes, no AJAX lag)
    if (this.button) {
      this.button.addEventListener('click', (e) => {
        e.preventDefault();
        
        let variantId = null;
        const idInput = document.querySelector('input[name="id"], select[name="id"]');
        
        if (idInput) variantId = idInput.value;
        if (!variantId) {
          const urlParams = new URLSearchParams(window.location.search);
          variantId = urlParams.get('variant');
        }
        if (!variantId) variantId = this.dataset.defaultVariant;

        if (!variantId) return; // Silent fail if strictly no variant found

        // Create a hidden form and native submit for zero-lag redirect
        const form = document.createElement('form');
        form.method = 'post';
        form.action = window.Shopify.routes.root + 'cart/add';
        form.style.display = 'none';

        const inputId = document.createElement('input');
        inputId.type = 'hidden';
        inputId.name = 'id';
        inputId.value = variantId;
        
        const inputQty = document.createElement('input');
        inputQty.type = 'hidden';
        inputQty.name = 'quantity';
        inputQty.value = '1';

        const inputReturn = document.createElement('input');
        inputReturn.type = 'hidden';
        inputReturn.name = 'return_to';
        inputReturn.value = '/cart';

        form.appendChild(inputId);
        form.appendChild(inputQty);
        form.appendChild(inputReturn);
        
        document.body.appendChild(form);
        form.submit();
      });
    }
  }
}

// Register the custom web component
if (!customElements.get('sticky-cta')) {
  customElements.define('sticky-cta', StickyCTA);
}