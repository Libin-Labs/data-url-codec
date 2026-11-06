import { parseDataUrl, encodeDataUrl, type DataUrl } from '@lp-labs/data-url-codec';
const parsed: DataUrl = parseDataUrl(encodeDataUrl(new Uint8Array([1])));
// @ts-expect-error payloads are byte arrays.
encodeDataUrl('text');
void parsed;
