/**
 * Input: cartItems → [{ itemId, name, category, unitPrice, qty }], coupon → { offerType, description }
 * Output: { polaroidTotal, othersTotal, grandTotal, lineItems, discountAmount }
 */
const { applySubstitution } = require('./couponSubstitution');

 * @param {Array} cartItems
 * @param {Object} coupon
 * @returns {{ polaroidTotal: number, othersTotal: number, grandTotal: number, lineItems: Array, discountAmount: number }}
 */
const calculateBill = (cartItems, coupon = null) => {
  let polaroidTotal = 0;
  let othersTotal = 0;
  let discountAmount = 0;

  const lineItems = cartItems.map((ci) => {
    const subtotal = parseFloat((ci.unitPrice * ci.qty).toFixed(2));

    if (ci.category === 'polaroid') {
      polaroidTotal += subtotal;
    } else {
      othersTotal += subtotal;
    }

    return {
      item: ci.itemId,
      name: ci.name,
      category: ci.category,
      unitPrice: ci.unitPrice,
      qty: ci.qty,
      subtotal,
    };
  });

  polaroidTotal = parseFloat(polaroidTotal.toFixed(2));
  othersTotal = parseFloat(othersTotal.toFixed(2));
  let grandTotal = parseFloat((polaroidTotal + othersTotal).toFixed(2));

  if (coupon) {
    // Flatten line items for substitution logic (expanding qty)
    const flatItems = [];
    lineItems.forEach(li => {
      for (let i = 0; i < li.qty; i++) {
        flatItems.push({ ...li, qty: 1 });
      }
    });

    discountAmount = applySubstitution(flatItems, coupon.offerType);
    discountAmount = parseFloat(discountAmount.toFixed(2));
    grandTotal = Math.max(0, parseFloat((grandTotal - discountAmount).toFixed(2)));
  }

  return { polaroidTotal, othersTotal, grandTotal, lineItems, discountAmount };
};

module.exports = { calculateBill };
