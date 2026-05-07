const { applySubstitution } = require('./couponSubstitution');

const calculateBill = (cartItems, coupon = null) => {
  let polaroidTotal = 0;
  let othersTotal = 0;
  let discountAmount = 0;

  // Initial map to get base line items
  let lineItems = cartItems.map((ci) => {
    const subtotal = parseFloat((ci.unitPrice * ci.qty).toFixed(2));
    return {
      item: ci.itemId,
      name: ci.name,
      category: ci.category,
      unitPrice: ci.unitPrice,
      qty: ci.qty,
      subtotal,
      piecesPerUnit: ci.piecesPerUnit || 1
    };
  });

  if (coupon) {
    // Flatten line items for substitution logic (expanding qty)
    let flatItems = [];
    lineItems.forEach(li => {
      for (let i = 0; i < li.qty; i++) {
        flatItems.push({ ...li, qty: 1 });
      }
    });

    // Apply substitution (this now modifies the items in flatItems)
    flatItems = applySubstitution(flatItems, coupon.offerType);

    // Re-group flat items back into line items to preserve the structure
    // But since the bill model expects the original items, we just use the flattened ones 
    // to calculate the new totals.
    
    // Calculate new totals from modified flat items
    polaroidTotal = 0;
    othersTotal = 0;
    flatItems.forEach(fi => {
      if (fi.category === 'polaroid') {
        polaroidTotal += fi.subtotal;
      } else {
        othersTotal += fi.subtotal;
      }
    });

    // We replace lineItems with the modified ones for saving to DB
    lineItems = flatItems;
  } else {
    // Standard total calculation if no coupon
    lineItems.forEach(li => {
      if (li.category === 'polaroid') {
        polaroidTotal += li.subtotal;
      } else {
        othersTotal += li.subtotal;
      }
    });
  }

  polaroidTotal = parseFloat(polaroidTotal.toFixed(2));
  othersTotal = parseFloat(othersTotal.toFixed(2));
  let grandTotal = parseFloat((polaroidTotal + othersTotal).toFixed(2));

  // Calculate the tracked discount amount for reporting
  const originalTotal = cartItems.reduce((s, i) => s + (i.unitPrice * i.qty), 0);
  discountAmount = parseFloat(Math.max(0, originalTotal - grandTotal).toFixed(2));

  return { polaroidTotal, othersTotal, grandTotal, lineItems, discountAmount };
};

module.exports = { calculateBill };
