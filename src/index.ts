export interface DataUrl {
  mediaType: string;
  parameters: ReadonlyMap<string, string>;
  base64: boolean;
  data: Uint8Array;
}
export interface DataUrlOptions {
  maxBytes?: number;
  maxCharacters?: number;
}
const MAX_BYTES = 16 * 1024 * 1024;
const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$(?![\s\S])/;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64(text: string, limit: number): Uint8Array {
  if (
    text.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$(?![\s\S])/.test(text)
  )
    throw new TypeError('Malformed data URL base64 payload.');
  const out: number[] = [];
  for (let i = 0; i < text.length; i += 4) {
    const a = ALPHABET.indexOf(text[i]!),
      b = ALPHABET.indexOf(text[i + 1]!);
    const c = text[i + 2] === '=' ? 0 : ALPHABET.indexOf(text[i + 2]!);
    const d = text[i + 3] === '=' ? 0 : ALPHABET.indexOf(text[i + 3]!);
    out.push((a << 2) | (b >> 4));
    if (text[i + 2] !== '=') out.push(((b & 15) << 4) | (c >> 2));
    if (text[i + 3] !== '=') out.push(((c & 3) << 6) | d);
    if (out.length > limit)
      throw new RangeError('Data URL payload exceeds the configured byte limit.');
  }
  const result = new Uint8Array(out);
  if (encodeBase64(result) !== text) throw new TypeError('Noncanonical data URL base64.');
  return result;
}

function encodeBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!,
      b = bytes[i + 1],
      c = bytes[i + 2];
    out += ALPHABET[a >> 2]! + ALPHABET[((a & 3) << 4) | ((b ?? 0) >> 4)]!;
    out +=
      b === undefined
        ? '=='
        : c === undefined
          ? ALPHABET[(b & 15) << 2]! + '='
          : ALPHABET[((b & 15) << 2) | (c >> 6)]! + ALPHABET[c & 63]!;
  }
  return out;
}

function percentBytes(text: string, limit: number): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '%') {
      if (!/^[0-9A-Fa-f]{2}$(?![\s\S])/.test(text.slice(i + 1, i + 3)))
        throw new TypeError('Malformed percent escape in data URL.');
      out.push(Number.parseInt(text.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      const code = text.charCodeAt(i);
      if (
        code > 0x7e ||
        code < 0x21 ||
        code === 0x22 ||
        code === 0x3c ||
        code === 0x3e ||
        code === 0x60
      )
        throw new TypeError('Data URL payload contains an unescaped character.');
      out.push(code);
    }
    if (out.length > limit)
      throw new RangeError('Data URL payload exceeds the configured byte limit.');
  }
  return new Uint8Array(out);
}

export function parseDataUrl(input: string, options: DataUrlOptions = {}): DataUrl {
  const maxBytes = options.maxBytes ?? MAX_BYTES,
    maxCharacters = options.maxCharacters ?? MAX_BYTES * 3;
  if (
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < 0 ||
    !Number.isSafeInteger(maxCharacters) ||
    maxCharacters < 0
  )
    throw new RangeError('Data URL limits must be nonnegative safe integers.');
  if (typeof input !== 'string' || input.length > maxCharacters || /[\r\n\0]/.test(input))
    throw new TypeError('Invalid or overlong data URL.');
  const comma = input.indexOf(',');
  if (!input.startsWith('data:') || comma < 5)
    throw new TypeError('Expected data: URL with a comma separator.');
  const metadata = input.slice(5, comma).split(';');
  let base64 = false;
  if (metadata.at(-1)?.toLowerCase() === 'base64') {
    metadata.pop();
    base64 = true;
  }
  let mediaType = metadata.shift() || 'text/plain';
  if (!mediaType.includes('/')) throw new TypeError('Invalid data URL media type.');
  const pieces = mediaType.split('/');
  if (pieces.length !== 2 || !TOKEN.test(pieces[0]!) || !TOKEN.test(pieces[1]!))
    throw new TypeError('Invalid data URL media type.');
  mediaType = `${pieces[0]!.toLowerCase()}/${pieces[1]!.toLowerCase()}`;
  const parameters = new Map<string, string>();
  for (const raw of metadata) {
    const equals = raw.indexOf('=');
    if (equals <= 0) throw new TypeError('Malformed data URL media parameter.');
    const name = raw.slice(0, equals).toLowerCase(),
      value = raw.slice(equals + 1);
    if (!TOKEN.test(name) || !TOKEN.test(value) || parameters.has(name))
      throw new TypeError('Invalid or duplicate data URL media parameter.');
    parameters.set(name, value);
  }
  return {
    mediaType,
    parameters,
    base64,
    data: base64
      ? decodeBase64(input.slice(comma + 1), maxBytes)
      : percentBytes(input.slice(comma + 1), maxBytes),
  };
}

export function encodeDataUrl(data: Uint8Array, mediaType = 'application/octet-stream'): string {
  if (!(data instanceof Uint8Array) || data.length > MAX_BYTES)
    throw new RangeError('Data must be a Uint8Array within the default size limit.');
  const pieces = mediaType.toLowerCase().split('/');
  if (pieces.length !== 2 || !TOKEN.test(pieces[0]!) || !TOKEN.test(pieces[1]!))
    throw new TypeError('Invalid data URL media type.');
  return `data:${pieces[0]}/${pieces[1]};base64,${encodeBase64(data)}`;
}
