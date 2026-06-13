import assert from "node:assert/strict";
import test from "node:test";

import { buildSourcePayload } from "./source-management.ts";

test("buildSourcePayload trims source fields and normalizes empty optional values", () => {
  assert.deepEqual(
    buildSourcePayload({
      nome: "  Ofertas Cooper  ",
      tipo: "site",
      id_estabelecimento: "",
      url: "  https://www.cooper.coop.br/ofertas/ibirama/  ",
      ativo: true,
    }),
    {
      nome: "Ofertas Cooper",
      tipo: "site",
      id_estabelecimento: null,
      url: "https://www.cooper.coop.br/ofertas/ibirama/",
      ativo: true,
    },
  );
});

test("buildSourcePayload preserves linked establishment and inactive state", () => {
  assert.deepEqual(
    buildSourcePayload({
      nome: "Rede Top",
      tipo: "rede_social",
      id_estabelecimento: "7bbfbf44-66e7-4c70-b2b9-8df69ee5a111",
      url: "",
      ativo: false,
    }),
    {
      nome: "Rede Top",
      tipo: "rede_social",
      id_estabelecimento: "7bbfbf44-66e7-4c70-b2b9-8df69ee5a111",
      url: null,
      ativo: false,
    },
  );
});
