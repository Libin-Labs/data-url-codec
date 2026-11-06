import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { parseDataUrl, encodeDataUrl } from '../dist/esm/index.js';

test('parses default and explicit media types plus parameters', () => {
  const parsed = parseDataUrl('data:text/plain;charset=utf-8,hello');
  assert.equal(parsed.mediaType, 'text/plain');
  assert.equal(parsed.parameters.get('charset'), 'utf-8');
  assert.equal(new TextDecoder().decode(parsed.data), 'hello');
});
test('decodes percent-encoded octets as bytes without guessing content', () => {
  assert.deepEqual([...parseDataUrl('data:application/octet-stream,%00%FF').data], [0, 255]);
});
test('parses strict base64 and roundtrips data URL encoding', () => {
  const original = new Uint8Array([0, 1, 2, 253, 254, 255]);
  const encoded = encodeDataUrl(original, 'application/octet-stream');
  assert.deepEqual([...parseDataUrl(encoded).data], [...original]);
});
test('rejects malformed payload escapes, data URLs, and duplicate parameters', () => {
  for (const value of [
    'not-a-url',
    'data:,%',
    'data:,a\nb',
    'data:,x\n',
    'data:text/plain;x=1;X=2,z',
  ])
    assert.throws(() => parseDataUrl(value), TypeError);
});
test('rejects noncanonical trailing base64 bits and oversized payloads', () => {
  assert.throws(() => parseDataUrl('data:;base64,AB=='), TypeError);
  assert.throws(() => parseDataUrl('data:,abcd', { maxBytes: 2 }), RangeError);
  assert.throws(() => parseDataUrl('data:,abcd', { maxCharacters: 3 }), TypeError);
});
test('validates media types and configurable limits', () => {
  assert.throws(() => encodeDataUrl(new Uint8Array(), 'bad media'), TypeError);
  assert.throws(() => parseDataUrl('data:,x', { maxBytes: -1 }), RangeError);
});
test('CommonJS exposes data URL encode and parse functions', () => {
  const api = createRequire(import.meta.url)('../dist/cjs/index.js');
  assert.deepEqual(Object.keys(api).sort(), ['encodeDataUrl', 'parseDataUrl']);
});
