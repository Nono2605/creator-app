import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isStatsUnavailable } from "./statsErrors.ts";

describe("isStatsUnavailable", () => {
  it("migration pas encore appliquée (503) : indisponible", () => {
    assert.equal(isStatsUnavailable(503, "Listening stats are not available yet"), true);
  });

  it("route absente d'une API pas encore redéployée (404 « Not found: … ») : indisponible", () => {
    assert.equal(isStatsUnavailable(404, "Not found: GET /creator/stats"), true);
  });

  it("un vrai « introuvable » reste une erreur", () => {
    assert.equal(isStatsUnavailable(404, "Track not found"), false);
    assert.equal(isStatsUnavailable(404, "Artist profile not found"), false);
  });

  it("les autres pannes restent des erreurs", () => {
    for (const status of [400, 401, 403, 500, 502]) {
      assert.equal(isStatsUnavailable(status, "Not found: GET /creator/stats"), false, String(status));
    }
  });
});
