import "@testing-library/jest-dom";
import { expect, vi } from 'vitest';

global.expect = expect;
global.vi = vi;

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
  configurable: true,
  get: () => global._isOnline,
  set: (v) => global._isOnline = v,
});
global._isOnline = true;
