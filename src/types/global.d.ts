import type { ExpectStatic, vitest } from 'vitest';

declare global {
  var expect: ExpectStatic;
  var vi: typeof vitest;
  var _isOnline: boolean;
}

export { }; 