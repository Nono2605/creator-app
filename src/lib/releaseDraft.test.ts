import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  draftProblems,
  hybridCount,
  releaseDetailsPayload,
  trackPayload,
  type ReleaseFields,
  type TrackFields,
} from "./releaseDraft.ts";

const release: ReleaseFields = {
  type: "ep",
  title: "Night Drive",
  releaseDate: "",
  label: "",
  copyright: "",
  description: "",
  genres: ["electronic"],
  tags: ["dark"],
  provenance: "ai",
};

const track = (overrides: Partial<TrackFields> = {}): TrackFields => ({
  title: "Midnight",
  explicit: false,
  genres: null,
  tags: null,
  provenance: "inherit",
  credits: [],
  ...overrides,
});

describe("draftProblems", () => {
  it("une release complète peut être créée", () => {
    assert.deepEqual(draftProblems(release, [track(), track({ title: "Dawn" })], true), []);
  });

  it("dit ce qui manque, en clair", () => {
    const empty: ReleaseFields = { ...release, title: " ", genres: [], provenance: null };
    assert.deepEqual(draftProblems(empty, [], true), ["Give the release a title.", "Add at least one audio file."]);
  });

  it("compte les morceaux à compléter", () => {
    const problems = draftProblems(
      { ...release, genres: [], provenance: null },
      [track({ title: "" }), track({ title: "B" })],
      true
    );
    assert.deepEqual(problems, [
      "1 track needs a title.",
      "2 tracks need a genre.",
      "2 tracks need an AI declaration.",
    ]);
  });

  it("un genre ou une déclaration propre au morceau remplace celui de la release", () => {
    const bare: ReleaseFields = { ...release, genres: [], provenance: null };
    const own = track({ genres: ["pop"], provenance: "ai" });
    assert.deepEqual(draftProblems(bare, [own], true), []);
  });

  it("sans liste de genres, le genre n'est pas demandé", () => {
    assert.deepEqual(draftProblems({ ...release, genres: [] }, [track()], false), []);
  });

  it("un single n'a qu'un morceau", () => {
    const problems = draftProblems({ ...release, type: "single" }, [track(), track({ title: "B" })], true);
    assert.match(problems[0], /A single has one track/);
  });

  it("plafonne le nombre de morceaux", () => {
    const many = Array.from({ length: 31 }, (_, i) => track({ title: `T${i}` }));
    assert.match(draftProblems(release, many, true)[0], /up to 30 tracks/);
  });
});

describe("hybridCount", () => {
  it("compte les morceaux « AI-assisted », hérités ou propres", () => {
    const hybridRelease: ReleaseFields = { ...release, provenance: "hybrid" };
    assert.equal(hybridCount(hybridRelease, [track(), track({ provenance: "ai" }), track()]), 2);
    assert.equal(hybridCount(release, [track({ provenance: "hybrid" })]), 1);
  });
});

describe("trackPayload", () => {
  it("résout les valeurs par défaut de la release", () => {
    assert.deepEqual(trackPayload(track({ title: "  Midnight  " }), release), {
      title: "Midnight",
      explicit: false,
      genres: ["electronic"],
      tags: ["dark"],
      credits: [],
      provenance: "ai",
    });
  });

  it("garde ce qui est propre au morceau, et envoie les crédits au format de l'API", () => {
    const payload = trackPayload(
      track({
        explicit: true,
        genres: ["pop", "rock"],
        tags: [],
        provenance: "hybrid",
        credits: [{ role: "featured", artistId: "abc", name: "Nova" }, { role: "writer", artistId: null, name: "Sam" }],
      }),
      release
    );
    assert.deepEqual(payload.genres, ["pop", "rock"]);
    assert.deepEqual(payload.tags, []);
    assert.equal(payload.provenance, "hybrid");
    assert.equal(payload.explicit, true);
    assert.deepEqual(payload.credits, [
      { role: "featured", artist_id: "abc", name: "Nova" },
      { role: "writer", artist_id: null, name: "Sam" },
    ]);
  });
});

describe("releaseDetailsPayload", () => {
  it("n'envoie que les champs remplis", () => {
    assert.equal(releaseDetailsPayload(release), null);
    assert.deepEqual(releaseDetailsPayload({ ...release, label: " Indie Co ", releaseDate: "2026-11-01" }), {
      release_date: "2026-11-01",
      label: "Indie Co",
    });
  });
});
