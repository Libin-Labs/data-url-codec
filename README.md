# @lp-labs/data-url-codec

Bounded `data:` URL parser and byte-array encoder. Payload bytes are decoded without sniffing or
trusting their media type. Independent, with zero runtime or peer dependencies.

## Install and quickstart

```bash
npm install @lp-labs/data-url-codec
```

```js
import { parseDataUrl, encodeDataUrl } from '@lp-labs/data-url-codec';

const encoded = encodeDataUrl(new Uint8Array([72, 105]), 'text/plain');
const parsed = parseDataUrl(encoded);
if (new TextDecoder().decode(parsed.data) !== 'Hi') throw new Error('Data URL roundtrip failed');
```

## API

- `parseDataUrl(input, options?): DataUrl` parses metadata, percent/base64 payload and returns
  `{ mediaType, parameters, base64, data }`.
- `encodeDataUrl(data, mediaType?): string` emits a Base64 data URL; media type defaults to
  `application/octet-stream`.
- `DataUrlOptions` supports `maxBytes` (default 16 MiB) and `maxCharacters` (default 48 MiB).
- `DataUrl` exposes lowercase `mediaType`, a string parameter map, a `base64` flag, and
  `Uint8Array data`.

The parser recognizes `;base64`, token media types/parameters, percent-encoded bytes, and the
default `text/plain` media type when omitted. Base64 alphabet, padding and trailing bits are
validated canonically. CR/LF/NUL, malformed escapes, duplicate parameters, non-ASCII unescaped
payload characters and limit violations fail with `TypeError` or `RangeError`. The encoder has a
16 MiB default maximum.

Work and memory are O(payload size); set smaller limits for untrusted input. The implementation
does not validate media-type registries, infer trust, sniff content, decode text, or support every
URI reserved-character spelling. Returned bytes are untrusted data; callers must apply their own
content validation and rendering policy.

Runtime exports: `parseDataUrl`, `encodeDataUrl`. Type exports: `DataUrl`, `DataUrlOptions`.
ESM/CommonJS declarations; Node.js 18+, ES2022, no browser globals.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
