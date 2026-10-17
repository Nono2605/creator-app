import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { describeNameStatus, nameStatusBlocker, nameStatusOf } from "./artistNameStatus.ts";

describe("nameStatusOf", () => {
  it("lit le statut de l'artiste", () => {
    assert.equal(nameStatusOf({ name_status: "pending" }), "pending");
    assert.equal(nameStatusOf({ name_status: "rejected" }), "rejected");
    assert.equal(nameStatusOf({ name_status: "approved" }), "approved");
  });

  it("un statut absent ou inconnu compte comme accepté : personne n'est bloqué à tort", () => {
    assert.equal(nameStatusOf({}), "approved");
    assert.equal(nameStatusOf({ name_status: null }), "approved");
    assert.equal(nameStatusOf({ name_status: "weird" }), "approved");
  });
});

describe("describeNameStatus", () => {
  it("un nom accepté n'affiche rien", () => {
    assert.equal(describeNameStatus("approved"), null);
  });

  it("un nom en attente : on peut préparer, on ne peut pas soumettre", () => {
    const notice = describeNameStatus("pending");
    assert.equal(notice?.tone, "info");
    assert.match(notice?.text ?? "", /You can prepare your music meanwhile/);
  });

  it("un nom refusé donne le motif puis dit quoi faire", () => {
    const notice = describeNameStatus("rejected", "Too close to a known artist.");
    assert.equal(notice?.tone, "error");
    assert.match(notice?.text ?? "", /^Too close to a known artist\. Choose another name on your Profile page/);
    assert.doesNotMatch(notice?.text ?? "", /\.\./);
  });

  it("un nom refusé sans motif reste compréhensible", () => {
    assert.match(describeNameStatus("rejected", null)?.text ?? "", /^Choose another name/);
  });
});

describe("nameStatusBlocker", () => {
  it("dit ce qui bloque, ou rien quand le nom est accepté", () => {
    assert.equal(nameStatusBlocker("approved"), null);
    assert.match(nameStatusBlocker("pending") ?? "", /still being reviewed/);
    assert.match(nameStatusBlocker("rejected") ?? "", /Choose another artist name/);
  });
});
