/**
 * couponSubstitution.js
 * Handles specific dice game offer logic.
 * These offers "substitute" the prices of items in the cart.
 * Targets the CHEAPEST eligible items.
 */

const applySubstitution = (lineItems, offerType) => {
  // Sort items by unitPrice ASCENDING to target cheapest items first
  const items = [...lineItems].sort((a, b) => a.unitPrice - b.unitPrice);

  switch (offerType) {
    case 'DICE_1_1': {
      // Get Another/Next polaroid at 99/- (Only for Single Polaroids)
      const allPolaroids = items.filter(i => i.category === 'polaroid');
      const single = items.find(p => p.category === 'polaroid' && p.unitPrice > 99 && (p.name.toLowerCase().includes('single') || p.piecesPerUnit === 1));
      
      if (allPolaroids.length >= 2 && single) {
        single.unitPrice = 99;
        single.subtotal = 99;
      }
      break;
    }

    case 'DICE_2_2': {
      // Get a polaroid + customized Polaroid at 229/-
      const p1 = items.find(i => i.category === 'polaroid' && !i.name.toLowerCase().includes('customized'));
      const p2 = items.find(i => i.category === 'polaroid' && i.name.toLowerCase().includes('customized'));
      if (p1 && p2) {
        // We set p1 to 229 and p2 to 0 (effectively total 229)
        p1.unitPrice = 229;
        p1.subtotal = 229;
        p2.unitPrice = 0;
        p2.subtotal = 0;
      }
      break;
    }

    case 'DICE_3_3': {
      // Get 3 Digital Photos at 99/-
      const digitals = items.filter(i => i.category === 'digital photo' || i.name.toLowerCase().includes('digital'));
      if (digitals.length >= 3) {
        digitals[0].unitPrice = 99;
        digitals[0].subtotal = 99;
        digitals[1].unitPrice = 0;
        digitals[1].subtotal = 0;
        digitals[2].unitPrice = 0;
        digitals[2].subtotal = 0;
      }
      break;
    }

    case 'DICE_4_4': {
      // Pack of 2 Polaroids at ₹222 (Directly once)
      const packs = items.filter(i => i.category === 'polaroid' && i.piecesPerUnit === 2);
      if (packs.length >= 1) {
        // items is sorted ASC, so packs[0] is the cheapest
        packs[0].unitPrice = 222;
        packs[0].subtotal = 222;
      }
      break;
    }

    case 'DICE_5_5': {
      // 1 Normal (Polaroid) + 1 Digital at ₹125
      const polaroid = items.find(i => i.category === 'polaroid' && !i.name.toLowerCase().includes('customized'));
      const digital = items.find(i => i.category === 'digital photo' || i.name.toLowerCase().includes('digital'));
      if (polaroid && digital) {
        polaroid.unitPrice = 125;
        polaroid.subtotal = 125;
        digital.unitPrice = 0;
        digital.subtotal = 0;
      }
      break;
    }

    case 'DICE_6_6': {
      // Get a polaroid at 99/- in purchase
      const polaroid = items.find(i => i.category === 'polaroid');
      if (polaroid) {
        polaroid.unitPrice = 99;
        polaroid.subtotal = 99;
      }
      break;
    }

    default:
      break;
  }

  return items;
};

module.exports = { applySubstitution };
