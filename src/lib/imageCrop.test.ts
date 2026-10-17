import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { IMAGE_SPECS, planImageCrop } from "./imageCrop.ts";

const { cover, avatar, banner } = IMAGE_SPECS;

describe("planImageCrop — pochette (carrée)", () => {
  it("image carrée : tout est gardé, réduite à la taille maximale", () => {
    assert.deepEqual(planImageCrop(3000, 3000, cover), {
      ok: true, sx: 0, sy: 0, sw: 3000, sh: 3000, outW: 1400, outH: 1400,
    });
  });

  it("image carrée plus petite que le maximum : jamais agrandie", () => {
    assert.deepEqual(planImageCrop(900, 900, cover), { ok: true, sx: 0, sy: 0, sw: 900, sh: 900, outW: 900, outH: 900 });
  });

  it("paysage : on garde le carré du milieu", () => {
    assert.deepEqual(planImageCrop(2000, 1000, cover), {
      ok: true, sx: 500, sy: 0, sw: 1000, sh: 1000, outW: 1000, outH: 1000,
    });
  });

  it("portrait : on garde le carré du milieu", () => {
    assert.deepEqual(planImageCrop(1000, 1601, cover), {
      ok: true, sx: 0, sy: 300, sw: 1000, sh: 1000, outW: 1000, outH: 1000,
    });
  });

  it("le minimum est accepté, un pixel de moins est refusé", () => {
    assert.equal(planImageCrop(cover.minWidth, cover.minWidth, cover).ok, true);
    assert.deepEqual(planImageCrop(cover.minWidth - 1, 4000, cover), { ok: false, reason: "too_small" });
    assert.deepEqual(planImageCrop(4000, cover.minWidth - 1, cover), { ok: false, reason: "too_small" });
  });

  it("dimensions absurdes : refusées sans planter", () => {
    assert.deepEqual(planImageCrop(0, 0, cover), { ok: false, reason: "too_small" });
    assert.deepEqual(planImageCrop(Number.NaN, 1000, cover), { ok: false, reason: "too_small" });
    assert.deepEqual(planImageCrop(1000, -5, cover), { ok: false, reason: "too_small" });
  });
});

describe("planImageCrop — photo d'artiste", () => {
  it("minimum plus bas que la pochette, maximum à 1000 px", () => {
    assert.equal(planImageCrop(400, 400, avatar).ok, true);
    assert.equal(planImageCrop(399, 399, avatar).ok, false);
    const big = planImageCrop(4000, 3000, avatar);
    assert.deepEqual(big, { ok: true, sx: 500, sy: 0, sw: 3000, sh: 3000, outW: 1000, outH: 1000 });
  });
});

describe("planImageCrop — bannière 3:1", () => {
  it("déjà au bon format : tout est gardé, réduite à 2100 × 700", () => {
    assert.deepEqual(planImageCrop(3000, 1000, banner), {
      ok: true, sx: 0, sy: 0, sw: 3000, sh: 1000, outW: 2100, outH: 700,
    });
  });

  it("image 16:9 : on garde une bande centrale", () => {
    // 1920 × 1080 → bande de 1920 × 640, prise au milieu (220 px en haut)
    assert.deepEqual(planImageCrop(1920, 1080, banner), {
      ok: true, sx: 0, sy: 220, sw: 1920, sh: 640, outW: 1920, outH: 640,
    });
  });

  it("image carrée : bande centrale sur toute la largeur", () => {
    assert.deepEqual(planImageCrop(2400, 2400, banner), {
      ok: true, sx: 0, sy: 800, sw: 2400, sh: 800, outW: 2100, outH: 700,
    });
  });

  it("image très large : on garde le milieu", () => {
    assert.deepEqual(planImageCrop(6000, 1000, banner), {
      ok: true, sx: 1500, sy: 0, sw: 3000, sh: 1000, outW: 2100, outH: 700,
    });
  });

  it("trop étroite une fois recadrée : refusée", () => {
    // 1000 × 1000 donnerait une bande de 1000 × 333 : moins de 1200 px de large
    assert.deepEqual(planImageCrop(1000, 1000, banner), { ok: false, reason: "too_small" });
    assert.equal(planImageCrop(1200, 400, banner).ok, true);
  });
});
