import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addTag, formatFileSize, moveItem, normalizeTag, titleFromFilename, toggleGenre } from "./releaseMeta.ts";

describe("titleFromFilename", () => {
  it("enlève l'extension, le numéro de piste et les tirets bas", () => {
    assert.equal(titleFromFilename("01 - Midnight Drive.mp3"), "Midnight Drive");
    assert.equal(titleFromFilename("02. Neon_Lights.flac"), "Neon Lights");
    assert.equal(titleFromFilename("3) Sunrise.wav"), "Sunrise");
    assert.equal(titleFromFilename("Plain Title.m4a"), "Plain Title");
    assert.equal(titleFromFilename("04_Late_Night.mp3"), "Late Night");
  });

  it("garde un titre qui commence par des chiffres sans séparateur", () => {
    assert.equal(titleFromFilename("1999.mp3"), "1999");
    assert.equal(titleFromFilename("24 hours.mp3"), "24 hours");
  });

  it("ne sort jamais un titre vide", () => {
    assert.equal(titleFromFilename(".mp3"), "Untitled");
    assert.equal(titleFromFilename("   "), "Untitled");
  });

  it("borne la longueur", () => {
    assert.equal(titleFromFilename("a".repeat(300) + ".mp3").length, 200);
  });
});

describe("toggleGenre", () => {
  it("ajoute dans l'ordre, le premier est le principal", () => {
    assert.deepEqual(toggleGenre(toggleGenre([], "rock"), "pop"), ["rock", "pop"]);
  });

  it("retire un genre déjà choisi", () => {
    assert.deepEqual(toggleGenre(["rock", "pop"], "rock"), ["pop"]);
  });

  it("n'en prend pas plus de trois", () => {
    assert.deepEqual(toggleGenre(["a1", "b2", "c3"], "d4"), ["a1", "b2", "c3"]);
  });
});

describe("normalizeTag et addTag", () => {
  it("met en forme comme l'API", () => {
    assert.equal(normalizeTag("  #Late   Night "), "late night");
  });

  it("ajoute un style, sans doublon", () => {
    const first = addTag([], "Dark");
    assert.deepEqual(first, { tags: ["dark"], error: null });
    assert.deepEqual(addTag(first.tags, "dark"), { tags: ["dark"], error: null });
  });

  it("ignore un style vide", () => {
    assert.deepEqual(addTag(["dark"], "  # "), { tags: ["dark"], error: null });
  });

  it("explique un refus : trop de styles, ou caractères non permis", () => {
    const full = ["a1", "b2", "c3", "d4", "e5"];
    assert.match(addTag(full, "f6").error ?? "", /Up to 5/);
    assert.match(addTag([], "<b>").error ?? "", /letters, numbers/);
    assert.match(addTag([], "x").error ?? "", /letters, numbers/);
  });
});

describe("moveItem", () => {
  it("déplace un élément", () => {
    assert.deepEqual(moveItem(["a", "b", "c"], 0, 2), ["b", "c", "a"]);
    assert.deepEqual(moveItem(["a", "b", "c"], 2, 1), ["a", "c", "b"]);
  });

  it("un déplacement impossible laisse la liste telle quelle", () => {
    const list = ["a", "b"];
    assert.equal(moveItem(list, 0, 5), list);
    assert.equal(moveItem(list, -1, 0), list);
    assert.equal(moveItem(list, 1, 1), list);
  });
});

describe("formatFileSize", () => {
  it("écrit en Mo ou en Ko", () => {
    assert.equal(formatFileSize(3 * 1024 * 1024), "3.0 MB");
    assert.equal(formatFileSize(2048), "2 KB");
    assert.equal(formatFileSize(10), "1 KB");
  });
});
