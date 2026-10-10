import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeDelta,
  formatCount,
  formatDay,
  formatListeningTime,
  formatTimeTick,
  labelIndexes,
  niceScale,
  niceTimeScale,
  sharePercent,
} from "./formatStats.ts";

describe("formatCount", () => {
  it("séparateur de milliers sous 10 000, compact au-delà", () => {
    assert.equal(formatCount(0), "0");
    assert.equal(formatCount(999), "999");
    assert.equal(formatCount(1284), "1,284");
    assert.equal(formatCount(9999), "9,999");
    assert.equal(formatCount(12_900), "12.9K");
    assert.equal(formatCount(12_000), "12K");
    assert.equal(formatCount(1_250_000), "1.3M");
  });
  it("ne plante pas sur une valeur invalide", () => {
    assert.equal(formatCount(NaN), "0");
  });
});

describe("formatListeningTime", () => {
  it("secondes, minutes, heures", () => {
    assert.equal(formatListeningTime(0), "0m");
    assert.equal(formatListeningTime(45), "45s");
    assert.equal(formatListeningTime(60), "1m");
    assert.equal(formatListeningTime(59 * 60 + 59), "59m");
    assert.equal(formatListeningTime(3600), "1h 0m");
    assert.equal(formatListeningTime(3 * 3600 + 12 * 60 + 40), "3h 12m");
  });
  it("au-delà de 100 h : heures seulement, avec séparateur de milliers", () => {
    assert.equal(formatListeningTime(123 * 3600 + 59 * 60), "123h");
    assert.equal(formatListeningTime(1234 * 3600), "1,234h");
  });
  it("valeurs négatives ou invalides -> 0m", () => {
    assert.equal(formatListeningTime(-5), "0m");
    assert.equal(formatListeningTime(NaN), "0m");
  });
});

describe("computeDelta", () => {
  it("rien à comparer : null", () => {
    assert.equal(computeDelta(0, 0), null);
  });
  it("précédent nul, actuel positif : « New », jamais un pourcentage infini", () => {
    assert.deepEqual(computeDelta(5, 0), { direction: "new", label: "New" });
  });
  it("hausse, baisse, stable", () => {
    assert.deepEqual(computeDelta(112, 100), { direction: "up", label: "+12%" });
    assert.deepEqual(computeDelta(92, 100), { direction: "down", label: "−8%" });
    assert.deepEqual(computeDelta(100, 100), { direction: "flat", label: "0%" });
  });
  it("tout perdre : −100%", () => {
    assert.deepEqual(computeDelta(0, 40), { direction: "down", label: "−100%" });
  });
  it("une variation réelle mais inférieure à 1 % n'est pas affichée comme 0%", () => {
    assert.deepEqual(computeDelta(100_001, 100_000), { direction: "up", label: "+<1%" });
    assert.deepEqual(computeDelta(99_999, 100_000), { direction: "down", label: "−<1%" });
  });
  it("plafonne les hausses énormes", () => {
    assert.deepEqual(computeDelta(100_000, 3), { direction: "up", label: "+999%+" });
  });
});

describe("formatDay", () => {
  it("formate un jour UTC sans glisser d'un jour (quel que soit le fuseau de la machine)", () => {
    assert.equal(formatDay("2026-10-09"), "Oct 9");
    assert.equal(formatDay("2026-01-01"), "Jan 1");
    assert.equal(formatDay("2026-12-31"), "Dec 31");
  });
  it("une date illisible est renvoyée telle quelle", () => {
    assert.equal(formatDay("n'importe quoi"), "n'importe quoi");
  });
});

describe("niceScale", () => {
  it("plafond rond et graduations régulières", () => {
    assert.deepEqual(niceScale(7), { max: 8, ticks: [0, 2, 4, 6, 8] });
    assert.deepEqual(niceScale(34), { max: 40, ticks: [0, 10, 20, 30, 40] });
    assert.deepEqual(niceScale(1284), { max: 1500, ticks: [0, 500, 1000, 1500] });
  });
  it("le plafond n'est jamais sous la valeur max (rien n'est coupé)", () => {
    for (const max of [1, 2, 3, 9, 10, 11, 99, 101, 999, 1001, 56_789]) {
      const scale = niceScale(max);
      assert.ok(scale.max >= max, `max=${max} -> ${scale.max}`);
      assert.equal(scale.ticks[0], 0);
      assert.equal(scale.ticks.at(-1), scale.max);
    }
  });
  it("comptes : graduations entières et distinctes, même pour un maximum de 1 ou 2", () => {
    assert.deepEqual(niceScale(1, 4, true), { max: 1, ticks: [0, 1] });
    assert.deepEqual(niceScale(2, 4, true), { max: 2, ticks: [0, 1, 2] });
    assert.deepEqual(niceScale(7, 4, true), { max: 8, ticks: [0, 2, 4, 6, 8] });
    for (let max = 1; max <= 60; max++) {
      const { max: top, ticks } = niceScale(max, 4, true);
      assert.ok(top >= max, `max=${max}`);
      assert.ok(ticks.every(Number.isInteger), `max=${max} ticks=${ticks}`);
      assert.equal(new Set(ticks.map((t) => String(t))).size, ticks.length, `max=${max} doublons`);
    }
  });
  it("sans l'option, une valeur décimale reste possible (échelle générale)", () => {
    assert.deepEqual(niceScale(1, 4), { max: 1, ticks: [0, 0.5, 1] });
  });
  it("aucune donnée : une échelle lisible quand même", () => {
    const scale = niceScale(0);
    assert.equal(scale.ticks[0], 0);
    assert.ok(scale.max > 0);
    assert.deepEqual(niceScale(NaN), scale);
  });
});

describe("niceTimeScale / formatTimeTick", () => {
  it("graduations sur des durées lisibles, jamais 3h 20m", () => {
    // ~10 h de pic : pas de 3 h (et non 3 h 20) -> 0, 3 h, 6 h, 9 h, 12 h
    assert.deepEqual(niceTimeScale(10 * 3600).ticks.map(formatTimeTick), ["0", "3h", "6h", "9h", "12h"]);
    // ~40 min de pic : pas de 10 min
    assert.deepEqual(niceTimeScale(40 * 60).ticks.map(formatTimeTick), ["0", "10m", "20m", "30m", "40m"]);
    // ~3 min : pas d'une minute
    assert.deepEqual(niceTimeScale(150).ticks.map(formatTimeTick), ["0", "1m", "2m", "3m"]);
  });
  it("le plafond n'est jamais sous la valeur max, et tous les pas sont réguliers", () => {
    for (const max of [30, 61, 599, 3600, 3601, 5 * 3600 + 1, 86_399, 86_400 * 3, 86_400 * 40, 86_400 * 400]) {
      const { max: top, ticks } = niceTimeScale(max);
      assert.ok(top >= max, `max=${max} -> ${top}`);
      assert.equal(ticks[0], 0);
      assert.equal(ticks.at(-1), top);
      const steps = new Set(ticks.slice(1).map((t, i) => t - ticks[i]));
      assert.equal(steps.size, 1, `max=${max} pas irréguliers`);
    }
  });
  it("aucune donnée : échelle lisible", () => {
    const scale = niceTimeScale(0);
    assert.ok(scale.max > 0);
    assert.equal(scale.ticks[0], 0);
  });
  it("formatTimeTick : court et sans zéro inutile", () => {
    assert.equal(formatTimeTick(0), "0");
    assert.equal(formatTimeTick(1800), "30m");
    assert.equal(formatTimeTick(5400), "1h 30m");
    assert.equal(formatTimeTick(7200), "2h");
    assert.equal(formatTimeTick(2 * 86400), "2d");
  });
});

describe("labelIndexes", () => {
  it("7 jours : des étiquettes à égale distance, jamais 0, 2, 3, 5, 6", () => {
    assert.deepEqual(labelIndexes(7, 5), [0, 2, 4, 6]);
    assert.deepEqual(labelIndexes(7, 3), [0, 3, 6]);
  });
  it("30 et 90 jours : cinq étiquettes, premier et dernier jour compris", () => {
    assert.deepEqual(labelIndexes(30, 5), [0, 7, 15, 22, 29]);
    assert.deepEqual(labelIndexes(90, 5), [0, 22, 45, 67, 89]);
    assert.deepEqual(labelIndexes(90, 3), [0, 45, 89]);
  });
  it("séries minuscules", () => {
    assert.deepEqual(labelIndexes(0, 5), []);
    assert.deepEqual(labelIndexes(1, 5), [0]);
    assert.deepEqual(labelIndexes(2, 5), [0, 1]);
    assert.deepEqual(labelIndexes(4, 5), [0, 1, 2, 3]); // « au plus 5 » : quatre points, quatre étiquettes
    assert.deepEqual(labelIndexes(5, 3), [0, 2, 4]);
  });
  it("jamais de doublon, toujours croissant, jamais hors série", () => {
    for (let n = 0; n <= 120; n++) {
      for (const max of [2, 3, 5]) {
        const idx = labelIndexes(n, max);
        assert.ok(idx.length <= Math.max(max, 1) || n <= 1, `n=${n} max=${max}`);
        assert.deepEqual(idx, [...new Set(idx)].sort((a, b) => a - b), `n=${n} max=${max}`);
        for (const i of idx) assert.ok(i >= 0 && i < n, `n=${n} i=${i}`);
        if (n > 1) assert.deepEqual([idx[0], idx.at(-1)], [0, n - 1], `n=${n} max=${max}`);
      }
    }
  });
});

describe("sharePercent", () => {
  it("part en pourcentage entier, 0 si le total est nul", () => {
    assert.equal(sharePercent(1, 4), 25);
    assert.equal(sharePercent(1, 3), 33);
    assert.equal(sharePercent(5, 0), 0);
  });
});
