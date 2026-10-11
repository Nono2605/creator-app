import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { COVER_MAX_SIDE, COVER_MIN_SIDE, planCoverCrop } from "./coverCrop.ts";

describe("planCoverCrop", () => {
  it("image carrée : tout est gardé, réduite à la taille maximale", () => {
    assert.deepEqual(planCoverCrop(3000, 3000), { ok: true, sx: 0, sy: 0, side: 3000, out: COVER_MAX_SIDE });
  });

  it("image carrée plus petite que le maximum : jamais agrandie", () => {
    assert.deepEqual(planCoverCrop(900, 900), { ok: true, sx: 0, sy: 0, side: 900, out: 900 });
  });

  it("paysage : on garde le carré du milieu", () => {
    assert.deepEqual(planCoverCrop(2000, 1000), { ok: true, sx: 500, sy: 0, side: 1000, out: 1000 });
  });

  it("portrait : on garde le carré du milieu", () => {
    assert.deepEqual(planCoverCrop(1000, 1601), { ok: true, sx: 0, sy: 300, side: 1000, out: 1000 });
  });

  it("le minimum est accepté, un pixel de moins est refusé", () => {
    assert.equal(planCoverCrop(COVER_MIN_SIDE, COVER_MIN_SIDE).ok, true);
    assert.deepEqual(planCoverCrop(COVER_MIN_SIDE - 1, 4000), { ok: false, reason: "too_small" });
    assert.deepEqual(planCoverCrop(4000, COVER_MIN_SIDE - 1), { ok: false, reason: "too_small" });
  });

  it("dimensions absurdes : refusées sans planter", () => {
    assert.deepEqual(planCoverCrop(0, 0), { ok: false, reason: "too_small" });
    assert.deepEqual(planCoverCrop(Number.NaN, 1000), { ok: false, reason: "too_small" });
  });
});
