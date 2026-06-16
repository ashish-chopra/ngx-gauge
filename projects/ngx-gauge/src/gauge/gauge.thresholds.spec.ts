import { ElementRef, Renderer2 } from '@angular/core';
import { NgxGauge, NgxGaugeThresholds } from './gauge';

/**
 * Threshold algorithm tests.
 *
 * These methods are pure — they only depend on `this.thresholds`, `this.min`,
 * `this.max`, and `this.foregroundColor` — so we instantiate `NgxGauge`
 * directly with stub `ElementRef` / `Renderer2` rather than spinning up a
 * TestBed fixture. The methods are private; we cast to `any` to access them.
 */
function makeGauge(): NgxGauge {
  const fakeEl = { nativeElement: document.createElement('div') } as ElementRef;
  const fakeRenderer = {
    setStyle: () => undefined,
    setAttribute: () => undefined,
    addClass: () => undefined,
    removeClass: () => undefined,
  } as unknown as Renderer2;
  return new NgxGauge(fakeEl, fakeRenderer);
}

describe('NgxGauge threshold algorithms', () => {
  describe('_getThresholdMatchForValue', () => {
    it('returns undefined when thresholds is empty', () => {
      const gauge = makeGauge();
      expect((gauge as any)._getThresholdMatchForValue(50)).toBeUndefined();
    });

    it('returns undefined when value is below the lowest threshold', () => {
      const gauge = makeGauge();
      gauge.thresholds = { '50': { color: 'red' } };
      expect((gauge as any)._getThresholdMatchForValue(25)).toBeUndefined();
    });

    it('matches a threshold when the value equals the threshold key', () => {
      const gauge = makeGauge();
      gauge.thresholds = { '50': { color: 'red' } };
      const match = (gauge as any)._getThresholdMatchForValue(50);
      expect(match).toBeDefined();
      expect(match.color).toBe('red');
      expect(match.start).toBe(50);
    });

    it('returns the highest applicable threshold (reverse-sort)', () => {
      const gauge = makeGauge();
      gauge.thresholds = {
        '0': { color: 'green' },
        '40': { color: 'orange' },
        '75': { color: 'red' },
      };
      const match = (gauge as any)._getThresholdMatchForValue(80);
      expect(match.color).toBe('red');
      expect(match.start).toBe(75);
    });

    it('picks the middle threshold when value is between keys', () => {
      const gauge = makeGauge();
      gauge.thresholds = {
        '0': { color: 'green' },
        '40': { color: 'orange' },
        '75': { color: 'red' },
      };
      const match = (gauge as any)._getThresholdMatchForValue(60);
      expect(match.color).toBe('orange');
      expect(match.start).toBe(40);
    });

    it('filters out non-numeric keys without crashing', () => {
      const gauge = makeGauge();
      gauge.thresholds = {
        '0': { color: 'green' },
        bogus: { color: 'pink' },
        '50': { color: 'red' },
      };
      const match = (gauge as any)._getThresholdMatchForValue(75);
      expect(match.color).toBe('red');
      expect(match.start).toBe(50);
    });

    it('returns an object with start, end, color, backgroundColor and bgOpacity', () => {
      const gauge = makeGauge();
      gauge.max = 100;
      gauge.thresholds = {
        '40': {
          color: 'orange',
          backgroundColor: '#fee',
          bgOpacity: 0.2,
        },
      };
      const match = (gauge as any)._getThresholdMatchForValue(50);
      expect(match.start).toBe(40);
      expect(match.end).toBe(100); // _getNextThreshold returns max
      expect(match.color).toBe('orange');
      expect(match.backgroundColor).toBe('#fee');
      expect(match.bgOpacity).toBe(0.2);
    });

    it('chains end to the next threshold key when one exists', () => {
      const gauge = makeGauge();
      gauge.thresholds = {
        '0': { color: 'green' },
        '40': { color: 'orange' },
        '75': { color: 'red' },
      };
      const match = (gauge as any)._getThresholdMatchForValue(50);
      expect(match.start).toBe(40);
      expect(match.end).toBe(75);
    });
  });

  describe('_getNextThreshold', () => {
    it('returns max when thresholds is empty', () => {
      const gauge = makeGauge();
      gauge.max = 100;
      expect((gauge as any)._getNextThreshold(50)).toBe(100);
    });

    it('returns the smallest threshold when value is below all', () => {
      const gauge = makeGauge();
      gauge.max = 100;
      gauge.thresholds = {
        '40': { color: 'orange' },
        '75': { color: 'red' },
      };
      expect((gauge as any)._getNextThreshold(10)).toBe(40);
    });

    it('returns the next threshold above the value', () => {
      const gauge = makeGauge();
      gauge.max = 100;
      gauge.thresholds = {
        '0': { color: 'green' },
        '40': { color: 'orange' },
        '75': { color: 'red' },
      };
      expect((gauge as any)._getNextThreshold(40)).toBe(75);
    });

    it('returns max when value is above all thresholds', () => {
      const gauge = makeGauge();
      gauge.max = 100;
      gauge.thresholds = {
        '40': { color: 'orange' },
        '75': { color: 'red' },
      };
      expect((gauge as any)._getNextThreshold(80)).toBe(100);
    });

    it('respects custom max value', () => {
      const gauge = makeGauge();
      gauge.max = 250;
      gauge.thresholds = { '100': { color: 'red' } };
      expect((gauge as any)._getNextThreshold(150)).toBe(250);
    });
  });

  describe('_getBackgroundColorRanges', () => {
    it('returns [] when thresholds is empty', () => {
      const gauge = makeGauge();
      expect((gauge as any)._getBackgroundColorRanges()).toEqual([]);
    });

    it('returns one range for a single threshold covering min..max', () => {
      const gauge = makeGauge();
      gauge.min = 0;
      gauge.max = 100;
      gauge.thresholds = { '0': { color: 'red', bgOpacity: 0.1 } };
      const ranges = (gauge as any)._getBackgroundColorRanges();
      expect(ranges).toHaveLength(1);
      expect(ranges[0].start).toBe(0);
      expect(ranges[0].end).toBe(100);
      expect(ranges[0].color).toBe('red');
      expect(ranges[0].bgOpacity).toBe(0.1);
    });

    it('chains contiguous ranges so end[N] == start[N+1]', () => {
      const gauge = makeGauge();
      gauge.min = 0;
      gauge.max = 100;
      gauge.thresholds = {
        '0': { color: 'green' },
        '50': { color: 'orange' },
      };
      const ranges = (gauge as any)._getBackgroundColorRanges();
      expect(ranges).toHaveLength(2);
      expect(ranges[0].start).toBe(0);
      expect(ranges[0].end).toBe(50);
      expect(ranges[1].start).toBe(50);
      expect(ranges[1].end).toBe(100);
    });

    it('produces three ranges for three contiguous thresholds', () => {
      const gauge = makeGauge();
      gauge.min = 0;
      gauge.max = 100;
      gauge.thresholds = {
        '0': { color: 'green' },
        '40': { color: 'orange' },
        '75': { color: 'red' },
      };
      const ranges = (gauge as any)._getBackgroundColorRanges();
      expect(ranges).toHaveLength(3);
      expect(ranges.map((r: any) => [r.start, r.end])).toEqual([
        [0, 40],
        [40, 75],
        [75, 100],
      ]);
    });

    it('returns [] in the degenerate min == max case', () => {
      const gauge = makeGauge();
      gauge.min = 50;
      gauge.max = 50;
      gauge.thresholds = { '50': { color: 'red' } };
      // i = 50, thresh defined, but `i < this.max` → 50 < 50 is false → loop never runs
      expect((gauge as any)._getBackgroundColorRanges()).toEqual([]);
    });

    it('returns [] when no threshold key is at or below min', () => {
      const gauge = makeGauge();
      gauge.min = 0;
      gauge.max = 100;
      gauge.thresholds = { '50': { color: 'red' } };
      // i = 0, thresh undefined (no key ≤ 0) → loop never starts
      expect((gauge as any)._getBackgroundColorRanges()).toEqual([]);
    });

    it('produces exactly one range when threshold at min ends at max', () => {
      const gauge = makeGauge();
      gauge.min = 0;
      gauge.max = 100;
      gauge.thresholds = { '0': { color: 'red' } };
      const ranges = (gauge as any)._getBackgroundColorRanges();
      expect(ranges).toHaveLength(1);
      expect(ranges[0].start).toBe(0);
      expect(ranges[0].end).toBe(100);
    });
  });

  describe('_getForegroundColorByRange', () => {
    it('returns the default foregroundColor when no threshold matches', () => {
      const gauge = makeGauge();
      gauge.foregroundColor = '#000000';
      gauge.thresholds = { '50': { color: 'red' } };
      // value below lowest → no match → fallback to foregroundColor
      expect((gauge as any)._getForegroundColorByRange(25)).toBe('#000000');
    });

    it('returns the threshold color when a match has color', () => {
      const gauge = makeGauge();
      gauge.foregroundColor = '#000000';
      gauge.thresholds = { '50': { color: 'red' } };
      expect((gauge as any)._getForegroundColorByRange(75)).toBe('red');
    });

    it('falls back to foregroundColor when matched threshold has no color', () => {
      const gauge = makeGauge();
      gauge.foregroundColor = '#888';
      gauge.thresholds = {
        '50': { backgroundColor: '#ddd', bgOpacity: 0.5 } as NgxGaugeThresholds[string],
      };
      expect((gauge as any)._getForegroundColorByRange(75)).toBe('#888');
    });

    it('returns default foregroundColor when thresholds is empty', () => {
      const gauge = makeGauge();
      gauge.foregroundColor = '#deadbeef';
      expect((gauge as any)._getForegroundColorByRange(50)).toBe('#deadbeef');
    });
  });
});
