import {
  clamp,
  coerceBooleanProperty,
  coerceNumberProperty,
  cssUnit,
  isNumber,
} from './util';

describe('util', () => {
  describe('clamp', () => {
    it('returns the value unchanged when in range', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    it('clamps below-minimum values up to min', () => {
      expect(clamp(-10, 0, 100)).toBe(0);
    });

    it('clamps above-maximum values down to max', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it('returns min when value equals min', () => {
      expect(clamp(0, 0, 100)).toBe(0);
    });

    it('returns max when value equals max', () => {
      expect(clamp(100, 0, 100)).toBe(100);
    });

    it('returns the bound when min equals max', () => {
      expect(clamp(42, 5, 5)).toBe(5);
      expect(clamp(-1, 5, 5)).toBe(5);
    });

    it('handles fully-negative ranges', () => {
      expect(clamp(-50, -100, -10)).toBe(-50);
      expect(clamp(-200, -100, -10)).toBe(-100);
      expect(clamp(0, -100, -10)).toBe(-10);
    });

    it('returns NaN when value is NaN (Math.min/max propagation)', () => {
      expect(clamp(NaN, 0, 100)).toBeNaN();
    });
  });

  describe('coerceBooleanProperty', () => {
    it('treats empty string as true (Angular attribute presence idiom)', () => {
      expect(coerceBooleanProperty('')).toBe(true);
    });

    it('treats the literal string "false" as false', () => {
      expect(coerceBooleanProperty('false')).toBe(false);
    });

    it('treats the literal string "true" as true', () => {
      expect(coerceBooleanProperty('true')).toBe(true);
    });

    it('treats null as false', () => {
      expect(coerceBooleanProperty(null)).toBe(false);
    });

    it('treats undefined as false', () => {
      expect(coerceBooleanProperty(undefined)).toBe(false);
    });

    it('treats numeric 0 as true (presence semantics, not truthiness)', () => {
      expect(coerceBooleanProperty(0)).toBe(true);
    });

    it('treats arbitrary objects as true', () => {
      expect(coerceBooleanProperty({})).toBe(true);
      expect(coerceBooleanProperty([])).toBe(true);
    });

    it('treats actual boolean inputs correctly', () => {
      expect(coerceBooleanProperty(true)).toBe(true);
      expect(coerceBooleanProperty(false)).toBe(false);
    });
  });

  describe('coerceNumberProperty', () => {
    it('coerces an integer string', () => {
      expect(coerceNumberProperty('42')).toBe(42);
    });

    it('coerces a float string', () => {
      expect(coerceNumberProperty('3.14')).toBe(3.14);
    });

    it('coerces scientific notation', () => {
      expect(coerceNumberProperty('1e3')).toBe(1000);
    });

    it('coerces negative numbers', () => {
      expect(coerceNumberProperty('-7')).toBe(-7);
      expect(coerceNumberProperty(-7)).toBe(-7);
    });

    it('returns the default fallback (0) for non-numeric strings', () => {
      expect(coerceNumberProperty('abc')).toBe(0);
    });

    it('honors a custom fallback', () => {
      expect(coerceNumberProperty('abc', 99)).toBe(99);
      expect(coerceNumberProperty(undefined, -1)).toBe(-1);
    });

    it('returns fallback for null', () => {
      expect(coerceNumberProperty(null, 7)).toBe(7);
    });

    it('returns fallback for undefined', () => {
      expect(coerceNumberProperty(undefined, 7)).toBe(7);
    });

    it('returns fallback for NaN', () => {
      expect(coerceNumberProperty(NaN, 7)).toBe(7);
    });

    it('returns fallback for the empty string', () => {
      expect(coerceNumberProperty('', 7)).toBe(7);
    });

    it('passes actual numeric inputs through', () => {
      expect(coerceNumberProperty(42)).toBe(42);
      expect(coerceNumberProperty(0)).toBe(0);
    });
  });

  describe('cssUnit', () => {
    it('appends "px" to integers', () => {
      expect(cssUnit(10)).toBe('10px');
    });

    it('appends "px" to floats', () => {
      expect(cssUnit(3.5)).toBe('3.5px');
    });

    it('handles zero', () => {
      expect(cssUnit(0)).toBe('0px');
    });

    it('handles negatives', () => {
      expect(cssUnit(-5)).toBe('-5px');
    });
  });

  describe('isNumber', () => {
    it('accepts integer strings', () => {
      expect(isNumber('42')).toBe(true);
    });

    it('accepts float strings', () => {
      expect(isNumber('3.14')).toBe(true);
    });

    it('accepts scientific notation', () => {
      expect(isNumber('1e3')).toBe(true);
    });

    it('accepts negative number strings', () => {
      expect(isNumber('-7')).toBe(true);
    });

    it('rejects non-numeric strings', () => {
      expect(isNumber('abc')).toBe(false);
    });

    it('rejects the empty string', () => {
      expect(isNumber('')).toBe(false);
    });

    it('rejects whitespace-only strings', () => {
      expect(isNumber(' ')).toBe(false);
    });

    it('rejects null', () => {
      expect(isNumber(null as unknown as string)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(isNumber(undefined as unknown as string)).toBe(false);
    });
  });
});
