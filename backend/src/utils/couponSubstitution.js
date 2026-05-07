/**
 * couponSubstitution.js
 * Handles specific dice game offer logic.
 * These offers "substitute" the prices of items in the cart.
 */

const applySubstitution = (lineItems, offerType) => {
  let discount = 0;
  const items = [...lineItems];

  // Helper to find items by category/name and apply fixed price
  const applyFixedPrice = (targetItems, fixedTotal) => {
    const currentTotal = targetItems.reduce((sum, item) => sum + item.unitPrice, 0);
    return Math.max(0, currentTotal - fixedTotal);
  };

  switch (offerType) {
    case 'DICE_1_1': {
      // Get Another/Next polaroid at 99/-
      // Find all polaroids, sort by price (desc), the 2nd one becomes 99
      const polaroids = items.filter(i => i.category === 'polaroid');
      if (polaroids.length >= 2) {
        // We take the one with higher price as first, and second as 99
        // Or if they are multiple, we apply 99 to one of them
        // Let's find the one closest to a regular price and reduce it
        const target = polaroids.find(p => p.unitPrice > 99);
        if (target) {
          discount = target.unitPrice - 99;
        }
      }
      break;
    }

    case 'DICE_2_2': {
      // Get a polaroid + customized Polaroid at 229/-
      const p1 = items.find(i => i.category === 'polaroid' && !i.name.toLowerCase().includes('customized'));
      const p2 = items.find(i => i.category === 'polaroid' && i.name.toLowerCase().includes('customized'));
      if (p1 && p2) {
        discount = (p1.unitPrice + p2.unitPrice) - 229;
      }
      break;
    }

    case 'DICE_3_3': {
      // Get 3 Digital Photos at 99/-
      // Assuming 'Digital Photo' is a category or name
      const digitals = items.filter(i => i.name.toLowerCase().includes('digital') || i.category === 'digital');
      if (digitals.length >= 3) {
        const currentSum = digitals.slice(0, 3).reduce((s, i) => s + i.unitPrice, 0);
        discount = currentSum - 99;
      }
      break;
    }

    case 'DICE_4_4': {
      // Pack of 2 Customized Polaroids at ₹222
      const customized = items.filter(i => i.name.toLowerCase().includes('customized'));
      if (customized.length >= 2) {
        const currentSum = customized.slice(0, 2).reduce((s, i) => s + i.unitPrice, 0);
        discount = currentSum - 222;
      }
      break;
    }

    case 'DICE_5_5': {
      // 1 Normal + 1 Digital at ₹125
      const normal = items.find(i => !i.name.toLowerCase().includes('customized') && !i.name.toLowerCase().includes('digital'));
      const digital = items.find(i => i.name.toLowerCase().includes('digital'));
      if (normal && digital) {
        discount = (normal.unitPrice + digital.unitPrice) - 125;
      }
      break;
    }

    case 'DICE_6_6': {
      // Get a polaroid at 99/- in purchase
      const polaroid = items.find(i => i.category === 'polaroid');
      if (polaroid) {
        discount = polaroid.unitPrice - 99;
      }
      break;
    }

    default:
      break;
  }

  return Math.max(0, discount);
};

module.exports = { applySubstitution };
