import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countryLabel, deviceLabel, sourceLabel } from "./statsLabels.ts";

describe("libellés de répartition", () => {
  it("sources et appareils connus", () => {
    assert.equal(sourceLabel("album"), "Album pages");
    assert.equal(sourceLabel("search"), "Search");
    assert.equal(deviceLabel("mobile"), "Mobile");
  });

  it("« unknown » et « other » ont le même nom partout", () => {
    for (const fn of [sourceLabel, deviceLabel, countryLabel]) {
      assert.equal(fn("unknown"), "Unknown");
      assert.equal(fn("other"), "Other");
    }
  });

  it("une clé inconnue est affichée telle quelle plutôt que de disparaître", () => {
    assert.equal(sourceLabel("nouveau-contexte"), "nouveau-contexte");
    assert.equal(deviceLabel("console"), "console");
  });

  it("pays : code ISO -> nom, code invalide -> tel quel", () => {
    assert.equal(countryLabel("FR"), "France");
    assert.equal(countryLabel("BE"), "Belgium");
    assert.equal(countryLabel("not a region"), "not a region");
  });
});
