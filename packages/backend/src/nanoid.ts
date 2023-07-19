import { customAlphabet } from 'nanoid';

const NANOID_LENGTH = 10;

// https://github.com/CyberAP/nanoid-dictionary#nolookalikes
const NO_LOOKALIKES = '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz';

export const generateId = customAlphabet(NO_LOOKALIKES, NANOID_LENGTH);
