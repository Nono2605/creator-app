import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { trackReviewBlockers, type TrackReviewState } from "./reviewBlockers.ts";

const ready: TrackReviewState = {
  hasAudio: true,
  declaration: { provenance: "ai", status: "pending" },
  genreAvailable: true,
  hasGenre: true,
};

describe("trackReviewBlockers", () => {
  it("un morceau complet peut partir", () => {
    assert.deepEqual(trackReviewBlockers(ready), []);
  });

  it("morceau neuf : tout manque, dans l'ordre où le créateur le fait", () => {
    assert.deepEqual(
      trackReviewBlockers({ hasAudio: false, declaration: null, genreAvailable: true, hasGenre: false }),
      ["Add the audio file.", "Save an AI declaration (AI declaration section below).", "Choose a genre."]
    );
  });

  it("une déclaration « hybrid » ou l'ancienne « human » bloque : la bêta est 100 % IA", () => {
    for (const provenance of ["hybrid", "human"]) {
      assert.deepEqual(trackReviewBlockers({ ...ready, declaration: { provenance } }), [
        "The beta accepts AI-generated music only.",
      ]);
    }
  });

  it("une déclaration refusée par l'administration bloque, même « ai »", () => {
    assert.deepEqual(trackReviewBlockers({ ...ready, declaration: { provenance: "ai", status: "rejected" } }), [
      "Your AI declaration was rejected. Update it.",
    ]);
  });

  it("un nom d'artiste en attente ou refusé passe en premier : rien ne part tant qu'il n'est pas accepté", () => {
    assert.deepEqual(trackReviewBlockers({ ...ready, artistNameStatus: "pending" }), [
      "Your artist name is still being reviewed.",
    ]);
    assert.deepEqual(
      trackReviewBlockers({ hasAudio: false, declaration: null, genreAvailable: true, hasGenre: false, artistNameStatus: "rejected" })[0],
      "Choose another artist name (Profile page)."
    );
  });

  it("un nom accepté, ou un statut absent, ne bloque rien", () => {
    assert.deepEqual(trackReviewBlockers({ ...ready, artistNameStatus: "approved" }), []);
  });

  it("sans liste de genres (migration absente, API muette), le genre n'est pas exigé", () => {
    assert.deepEqual(trackReviewBlockers({ ...ready, genreAvailable: false, hasGenre: false }), []);
  });
});
