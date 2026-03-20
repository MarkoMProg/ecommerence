/**
 * Rich storefront copy from product name + category.
 * Used by bulk JSON generation and optional DB refresh script.
 *
 * @param {string} name
 * @param {string} categoryId Drizzle category id: 1 tees, 2 hoodies, 3 hats, 4 accessories, 5 posters
 * @returns {string}
 */
export function buildRichDescription(name, categoryId) {
  const title = name.replace(/\s+/g, ' ').trim();
  const cid = String(categoryId);
  const lower = title.toLowerCase();
  const readsAsHoodie =
    lower.includes('hoodie') ||
    lower.includes('sweater') ||
    lower.includes('crewneck');

  if (cid === '5') {
    return (
      `${title} brings mood and momentum to your game space—whether you are building a campaign wall, dressing a stream backdrop, or gifting someone who lives in lore documents.\n\n` +
      `The artwork is tuned to read clearly from across the table: deep tones, crisp edges, and enough negative space to let minis and maps breathe. We ship prints rolled in protective packaging so corners stay sharp. Check the gallery for scale, finish, and framing context before you commit.\n\n` +
      `A natural fit for DMs who curate atmosphere as carefully as encounter balance.`
    );
  }

  if (cid === '4') {
    return (
      `${title} is the kind of piece people notice between rounds—the prop that starts a conversation about your last session, your home table, or the dice collection you swore was "complete."\n\n` +
      `Use it to anchor a shelf, light a late-night one-shot, or level up a gift swap without guessing someone’s shirt size. Materials and exact dimensions can vary slightly by batch; treat the product photos as the source of truth for colour, texture, and detailing.\n\n` +
      `Darkloom picks accessories that feel campaign-ready the moment you unbox them.`
    );
  }

  if (cid === '2' || (cid === '1' && readsAsHoodie)) {
    return (
      `${title} is built for the long session—layer-friendly weight, room to move, and enough attitude to carry you from character creation to closing credits.\n\n` +
      `Throw it over a tee for the game shop, zip it up for the walk home, or live in it through a weekend one-shot marathon. Follow the care label to keep fleece soft and colours honest after repeat washes.\n\n` +
      `Sized for real tables and real weather—check the product details for your best fit.`
    );
  }

  if (cid === '3') {
    return (
      `${title} finishes the look without overthinking it—structured where it matters, easy to adjust, and ready for con floors, coffee-shop prep, or the victory lap after a boss goes down.\n\n` +
      `Spot clean or follow the care guidance on the label so embroidery and panels stay crisp. One less thing between you and a clean initiative count.\n\n` +
      `See product images for brim shape, closure, and colour in natural light.`
    );
  }

  // 1 — T-Shirts (default apparel)
  return (
    `Roll initiative on your outfit. ${title} is made for players who want tabletop energy in a shirt that still works Monday afternoon.\n\n` +
    `The graphic leans into dungeon culture without shouting—readable up close, comfortable across a full session, and easy to pair with layers when the AC at the game store kicks in. Available sizes cover most party compositions; use the size chart and gallery shots to judge neckline, hem length, and print placement.\n\n` +
    `Wash cold, tumble or hang dry per the garment tag, and keep colours vivid for the long campaign ahead.`
  );
}
