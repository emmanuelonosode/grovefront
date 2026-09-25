/**
 * Serialize a schema.org object for a <script type="application/ld+json"> tag.
 *
 * Plain JSON.stringify is not safe here: schemas embed CMS/API text (listing
 * descriptions, blog bodies, FAQ answers), and a literal "</script>" in any of
 * it would close the tag early and let the rest execute as HTML. Escaping "<"
 * (plus the JS line separators) keeps the payload valid JSON that parsers read
 * identically. See node_modules/next/dist/docs/01-app/02-guides/json-ld.md.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
