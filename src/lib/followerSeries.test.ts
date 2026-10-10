import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { followerSeries } from "./followerSeries.ts";

const now = new Date("2026-10-10T12:00:00Z");

describe("followerSeries", () => {
  it("renvoie exactement `days` points, du plus ancien à aujourd'hui", () => {
    const { points } = followerSeries([], 7, now);
    assert.equal(points.length, 7);
    assert.equal(points[0].day, "2026-10-04");
    assert.equal(points.at(-1)!.day, "2026-10-10");
  });

  it("les follows d'avant la fenêtre forment la base du cumul", () => {
    const { points, total, newInWindow } = followerSeries(["2026-01-01T10:00:00Z", "2026-09-01T10:00:00Z"], 7, now);
    assert.equal(points[0].value, 2);
    assert.equal(total, 2);
    assert.equal(newInWindow, 0);
  });

  it("cumule jour après jour, y compris le premier jour de la fenêtre et aujourd'hui", () => {
    const { points, total, newInWindow } = followerSeries(
      ["2026-10-04T00:00:00Z", "2026-10-06T08:00:00Z", "2026-10-06T09:00:00Z", "2026-10-10T11:59:00Z"],
      7,
      now
    );
    assert.deepEqual(
      points.map((p) => p.value),
      [1, 1, 3, 3, 3, 3, 4]
    );
    assert.equal(total, 4);
    assert.equal(newInWindow, 4); // le follow du premier jour compte (l'ancien calcul l'oubliait)
  });

  it("`daily` donne les nouveaux followers de chaque jour, et leur somme est newInWindow", () => {
    const { daily, newInWindow } = followerSeries(
      ["2026-01-01T00:00:00Z", "2026-10-04T00:00:00Z", "2026-10-06T08:00:00Z", "2026-10-06T09:00:00Z"],
      7,
      now
    );
    assert.deepEqual(
      daily.map((p) => p.value),
      [1, 0, 2, 0, 0, 0, 0]
    );
    assert.equal(
      daily.reduce((sum, p) => sum + p.value, 0),
      newInWindow
    );
  });

  it("ignore le futur et les dates illisibles", () => {
    const { total } = followerSeries(["2026-10-11T00:00:00Z", "pas une date", "2026-10-10T08:00:00Z"], 7, now);
    assert.equal(total, 1);
  });

  it("minuit exact : le jour UTC change, pas le jour local", () => {
    const { points } = followerSeries(["2026-10-09T23:59:59Z", "2026-10-10T00:00:00Z"], 2, now);
    assert.deepEqual(
      points.map((p) => [p.day, p.value]),
      [
        ["2026-10-09", 1],
        ["2026-10-10", 2],
      ]
    );
  });
});
