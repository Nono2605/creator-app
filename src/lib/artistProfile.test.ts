import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { joinParts, missingProfileParts } from "./artistProfile.ts";

describe("missingProfileParts", () => {
  it("profil vide : tout manque", () => {
    assert.deepEqual(missingProfileParts({ avatar_url: null, banner_url: null, bio: null }), ["photo", "banner", "bio"]);
  });

  it("une bio faite d'espaces ne compte pas", () => {
    assert.deepEqual(missingProfileParts({ avatar_url: "a", banner_url: "b", bio: "   " }), ["bio"]);
    assert.deepEqual(missingProfileParts({ avatar_url: "a", banner_url: "b", bio: "" }), ["bio"]);
  });

  it("profil complet : rien ne manque", () => {
    assert.deepEqual(missingProfileParts({ avatar_url: "a", banner_url: "b", bio: "Hello" }), []);
  });
});

describe("joinParts", () => {
  it("assemble en anglais courant", () => {
    assert.equal(joinParts([]), "");
    assert.equal(joinParts(["photo"]), "photo");
    assert.equal(joinParts(["photo", "bio"]), "photo and bio");
    assert.equal(joinParts(["photo", "banner", "bio"]), "photo, banner and bio");
  });
});
