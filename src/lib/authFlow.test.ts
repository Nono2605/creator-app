import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { friendlyLoginError, isExistingAccountError, safeNext } from "./authFlow.ts";

describe("safeNext", () => {
  it("accepte un chemin du site, avec ses paramètres", () => {
    assert.equal(safeNext("/onboarding"), "/onboarding");
    assert.equal(safeNext("/tracks/new?x=1"), "/tracks/new?x=1");
  });

  it("refuse toute adresse extérieure ou ambiguë", () => {
    for (const bad of [
      "https://autre.site",
      "//autre.site",
      "/\\autre.site",
      "/\t/autre.site",
      "/\n/autre.site",
      "autre.site",
      "javascript:alert(1)",
      "",
    ]) {
      assert.equal(safeNext(bad), "/", `refusé : ${JSON.stringify(bad)}`);
    }
  });

  it("refuse l'absence de valeur, un type inattendu et une valeur démesurée", () => {
    assert.equal(safeNext(null), "/");
    assert.equal(safeNext(undefined), "/");
    assert.equal(safeNext("/" + "a".repeat(300)), "/");
  });

  it("utilise le repli demandé", () => {
    assert.equal(safeNext("https://autre.site", "/onboarding"), "/onboarding");
  });
});

describe("isExistingAccountError", () => {
  it("reconnaît une adresse déjà inscrite", () => {
    assert.equal(isExistingAccountError({ code: "user_already_exists" }), true);
    assert.equal(isExistingAccountError({ code: "email_exists" }), true);
    assert.equal(isExistingAccountError({ message: "User already registered" }), true);
  });

  it("ne confond pas avec les autres refus", () => {
    assert.equal(isExistingAccountError({ code: "weak_password", message: "Password is too short" }), false);
    assert.equal(isExistingAccountError({ status: 429 }), false);
    assert.equal(isExistingAccountError({}), false);
  });
});

describe("friendlyLoginError", () => {
  it("explique des identifiants refusés en rappelant que le compte est le même que l'écoute", () => {
    assert.match(friendlyLoginError({ code: "invalid_credentials" }), /same Vynl account as the listening app/);
    assert.match(friendlyLoginError({ message: "Invalid login credentials" }), /incorrect/);
  });

  it("dit de confirmer le courriel", () => {
    assert.match(friendlyLoginError({ code: "email_not_confirmed" }), /Confirm your email/);
  });

  it("demande d'attendre après trop d'essais", () => {
    assert.match(friendlyLoginError({ status: 429 }), /Wait a minute/);
  });

  it("garde le message de Supabase pour le reste, ou un message de repli", () => {
    assert.equal(friendlyLoginError({ message: "Something odd" }), "Something odd");
    assert.equal(friendlyLoginError({}), "Could not log in. Please try again.");
  });
});
