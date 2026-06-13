import assert from "node:assert/strict";
import test from "node:test";

import { buildProductAliasTerms, normalizeCatalogUnit } from "./catalog-resolution.ts";

test("normalizeCatalogUnit maps common extracted units to catalog units", () => {
  assert.equal(normalizeCatalogUnit("unidade"), "un");
  assert.equal(normalizeCatalogUnit("UN."), "un");
  assert.equal(normalizeCatalogUnit("litro"), "L");
  assert.equal(normalizeCatalogUnit("pct"), "pct");
  assert.equal(normalizeCatalogUnit("garrafa"), null);
});

test("buildProductAliasTerms creates useful deduplicated aliases", () => {
  const aliases = buildProductAliasTerms({
    nomeOriginal: "  Café Melitta 160g Solúvel / Tradicional  ",
    marca: "Melitta",
    quantidade: 160,
    unidade: "g",
    embalagem: null,
    categoriaSugerida: null,
    preco: 19.99,
    validadeInicio: null,
    validadeFim: "2026-06-08",
    observacao: null,
    confidence: 0.92,
  });

  assert.deepEqual(aliases, ["Café Melitta 160g Solúvel / Tradicional", "Café Melitta 160g Solúvel Tradicional"]);
});

test("buildProductAliasTerms adds brand and amount when missing from product name", () => {
  const aliases = buildProductAliasTerms({
    nomeOriginal: "Azeite Extra Virgem",
    marca: "Borges",
    quantidade: 500,
    unidade: "ml",
    embalagem: "vidro",
    categoriaSugerida: null,
    preco: 29.99,
    validadeInicio: null,
    validadeFim: "2026-06-08",
    observacao: null,
    confidence: 0.9,
  });

  assert.deepEqual(aliases, ["Azeite Extra Virgem", "Azeite Extra Virgem Borges", "Azeite Extra Virgem 500ml"]);
});
