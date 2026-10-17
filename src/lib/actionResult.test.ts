import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { failure, OK } from "./actionResult.ts";

// Même forme que ApiError (lib/api.ts) sans importer ce module, qui lit l'environnement.
class FakeApiError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

describe("failure", () => {
  it("garde le message de l'API : il est écrit pour le créateur", () => {
    assert.deepEqual(failure(new FakeApiError("Add the audio file first."), "Could not do it."), {
      ok: false,
      error: "Add the audio file first.",
    });
  });

  it("remplace une panne technique par le message de repli", () => {
    assert.deepEqual(failure(new TypeError("fetch failed"), "Could not do it."), { ok: false, error: "Could not do it." });
    assert.deepEqual(failure("boom", "Could not do it."), { ok: false, error: "Could not do it." });
    assert.deepEqual(failure(undefined, "Could not do it."), { ok: false, error: "Could not do it." });
  });

  it("une erreur serveur (5xx) passe au repli : « Internal server error » ne dit rien au créateur", () => {
    assert.deepEqual(failure(new FakeApiError("Internal server error", 500), "Could not do it."), {
      ok: false,
      error: "Could not do it.",
    });
    assert.deepEqual(failure(new FakeApiError("Service unavailable", 503), "Could not do it."), {
      ok: false,
      error: "Could not do it.",
    });
  });

  it("une erreur de l'API sans message passe au repli", () => {
    assert.deepEqual(failure(new FakeApiError("  "), "Could not do it."), { ok: false, error: "Could not do it." });
  });

  it("OK est un succès", () => {
    assert.deepEqual(OK, { ok: true });
  });
});
