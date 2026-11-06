import api = require('@lp-labs/data-url-codec');
const bytes: Uint8Array = api.parseDataUrl('data:,x').data;
void bytes;
