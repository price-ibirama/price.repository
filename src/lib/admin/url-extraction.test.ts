import assert from "node:assert/strict";
import test from "node:test";

import { extractReadableTextFromHtml, fetchSourceUrlText, resolveUrlIngestionContext, UrlIngestionError } from "./url-extraction.ts";

test("extractReadableTextFromHtml removes scripts styles tags and normalizes whitespace", () => {
  const text = extractReadableTextFromHtml(`
    <!doctype html>
    <html>
      <head>
        <style>.price { color: red; }</style>
        <script>window.__DATA__ = "ignore me";</script>
      </head>
      <body>
        <h1>Ofertas da semana</h1>
        <article>
          <p>Arroz Parboilizado 5kg</p>
          <strong>R$ 21,90</strong>
          <p>Validade 15/06</p>
        </article>
      </body>
    </html>
  `);

  assert.equal(text, "Ofertas da semana Arroz Parboilizado 5kg R$ 21,90 Validade 15/06");
});

test("resolveUrlIngestionContext blocks inactive sources", () => {
  assert.throws(
    () =>
      resolveUrlIngestionContext({
        source: {
          id: "source-1",
          nome: "Cooper",
          url: "https://example.com/ofertas",
          ativo: false,
          id_estabelecimento: "store-1",
        },
        fallbackEstablishmentId: null,
      }),
    (error) => error instanceof UrlIngestionError && error.message === "A fonte selecionada está inativa.",
  );
});

test("resolveUrlIngestionContext requires a source URL and establishment", () => {
  assert.throws(
    () =>
      resolveUrlIngestionContext({
        source: {
          id: "source-1",
          nome: "Cooper",
          url: null,
          ativo: true,
          id_estabelecimento: "store-1",
        },
        fallbackEstablishmentId: null,
      }),
    (error) => error instanceof UrlIngestionError && error.message === "A fonte selecionada não possui URL cadastrada.",
  );

  assert.throws(
    () =>
      resolveUrlIngestionContext({
        source: {
          id: "source-1",
          nome: "Cooper",
          url: "https://example.com/ofertas",
          ativo: true,
          id_estabelecimento: null,
        },
        fallbackEstablishmentId: null,
      }),
    (error) => error instanceof UrlIngestionError && error.message === "Selecione um estabelecimento para processar esta fonte.",
  );
});

test("fetchSourceUrlText fetches public HTML and returns readable offer text", async () => {
  const fetchMock = async () =>
    new Response("<html><body><h1>Ofertas</h1><p>Feijão Preto 1kg R$ 7,99</p></body></html>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    });

  const result = await fetchSourceUrlText("https://example.com/ofertas", { fetchImpl: fetchMock });

  assert.equal(result.url, "https://example.com/ofertas");
  assert.equal(result.contentType, "text/html; charset=utf-8");
  assert.equal(result.text, "Ofertas Feijão Preto 1kg R$ 7,99");
});
