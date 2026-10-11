import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { friendlyUploadError } from "./uploadErrors.ts";

describe("friendlyUploadError", () => {
  it("fichier trop gros (limite du stockage)", () => {
    assert.match(friendlyUploadError(new Error("The object exceeded the maximum allowed size")), /larger than the upload limit/);
    assert.match(friendlyUploadError("Payload too large"), /larger than the upload limit/);
  });
  it("type de fichier refusé", () => {
    assert.match(friendlyUploadError("mime type audio/x-foo is not supported"), /isn't accepted/);
  });
  it("coupure réseau", () => {
    assert.match(friendlyUploadError(new TypeError("Failed to fetch")), /interrupted/);
    assert.match(friendlyUploadError("Load failed"), /interrupted/);
  });
  it("session expirée", () => {
    assert.match(friendlyUploadError("JWT expired"), /session expired/);
  });
  it("un message déjà clair de l'API est conservé tel quel", () => {
    const msg = "This file doesn't look like audio, or its format isn't supported.";
    assert.equal(friendlyUploadError(new Error(msg)), msg);
  });
  it("jamais de message vide", () => {
    assert.equal(friendlyUploadError(undefined), "The upload failed. Please try again.");
    assert.equal(friendlyUploadError(new Error("  ")), "The upload failed. Please try again.");
    assert.equal(friendlyUploadError({}), "The upload failed. Please try again.");
  });
});
