/**
 * billCalculator.js
 * Pure utility — no Express, no DB imports.
 * Only billController.js should call this module.
 *
 * Input: cartItems → [{ itemId, name, category, unitPrice, qty }]
 * Output: { polaroidTotal, othersTotal, grandTotal, lineItems }
 */

/**
 * @param {Array} cartItems
 * @returns {{ polaroidTotal: number, othersTotal: number, grandTotal: number, lineItems: Array }}
 */
const calculateBill = (cartItems) => {
  let polaroidTotal = 0;
  let othersTotal = 0;

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
  const grandTotal = parseFloat((polaroidTotal + othersTotal).toFixed(2));

  return { polaroidTotal, othersTotal, grandTotal, lineItems };
};

module.exports = { calculateBill };
