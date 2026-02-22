document.addEventListener('DOMContentLoaded', function() {
  const sectionId = document.querySelector('[data-section-id]').getAttribute('data-section-id');
  const productData = JSON.parse(document.getElementById(`ProductJson-${sectionId}`).innerHTML);
  const selectors = document.querySelectorAll(`#product-${sectionId} .variant-select`);
  
  function updateVariant() {
    let options = Array.from(selectors).map(sel => sel.value);
    let matchedVariant = productData.variants.find(variant => {
      return options.every((opt, i) => variant.options[i] === opt);
    });

    if (matchedVariant) {
      // Update ID for ATC
      document.getElementById(`variant-id-${sectionId}`).value = matchedVariant.id;
      
      // Update Price with Currency Handling
      const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR', // You can dynamically get this from Shopify.currency.active
      }).format(matchedVariant.price / 100);
      
      document.getElementById(`price-${sectionId}`).innerText = formattedPrice;
    }
  }

  selectors.forEach(select => select.addEventListener('change', updateVariant));

  // Add to Cart Logic
  document.getElementById(`atc-button-${sectionId}`).addEventListener('click', function() {
    let variantId = document.getElementById(`variant-id-${sectionId}`).value;
    
    let formData = { 'items': [{ 'id': variantId, 'quantity': 1 }] };

    fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      window.location.href = '/cart'; // Redirects to cart page as requested
    })
    .catch((error) => console.error('Error:', error));
  });
});