import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxGaugeModule } from '../../src/ngx-gauge.module';

/**
 * Issue #61 — `foregroundGradient`: blend the `thresholds` colors into a
 * conic gradient, with each color stop pinned to its threshold key.
 *
 * Stop placement is asserted by capturing `createConicGradient` /
 * `addColorStop` calls on the real context. The pixel tests at the bottom
 * render for real and sample the canvas.
 */

interface Thresholds { [k: string]: { color?: string; bgOpacity?: number } }

@Component({
  standalone: true,
  imports: [NgxGaugeModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ngx-gauge
      [value]="value"
      [min]="min"
      [max]="max"
      [animate]="false"
      [type]="type"
      [thick]="thick"
      [cap]="cap"
      [size]="size"
      [thresholds]="thresholds"
      [foregroundColor]="foregroundColor"
      [foregroundGradient]="foregroundGradient"
      backgroundColor="rgba(0, 0, 0, 0)">
    </ngx-gauge>
  `,
})
class GradientHost {
  value = 50;
  min = 0;
  max = 100;
  type: 'arch' | 'full' | 'semi' = 'arch';
  thick = 10;
  cap: 'round' | 'butt' = 'butt';
  size = 200;
  thresholds: Thresholds = { '0': { color: '#ff0000' }, '100': { color: '#0000ff' } };
  foregroundColor = '#00ff00';
  foregroundGradient: boolean | string = true;
}

describe('NgxGauge foregroundGradient (#61)', () => {
  let fixture: ComponentFixture<GradientHost>;
  let host: GradientHost;
  let gauge: any;

  const turn = 2 * Math.PI;
  const archSweep = 1.4 * Math.PI;

  function setup(overrides: Partial<GradientHost> = {}) {
    TestBed.configureTestingModule({ imports: [GradientHost] });
    fixture = TestBed.createComponent(GradientHost);
    host = fixture.componentInstance;
    Object.assign(host, overrides);
    fixture.detectChanges();
    gauge = (fixture.debugElement.children[0] as any).componentInstance;
  }

  /** Capture createConicGradient args and every addColorStop call. */
  function captureGradient() {
    const ctx = gauge._context as CanvasRenderingContext2D;
    const real = ctx.createConicGradient.bind(ctx);
    const calls = { conic: [] as number[][], stops: [] as [number, string][] };
    (ctx as any).createConicGradient = vi.fn((a: number, x: number, y: number) => {
      calls.conic.push([a, x, y]);
      const g = real(a, x, y);
      const addStop = g.addColorStop.bind(g);
      g.addColorStop = (o: number, c: string) => {
        calls.stops.push([o, c]);
        addStop(o, c);
      };
      return g;
    });
    return calls;
  }

  /** Gradient offset for a scale value on an arch gauge with a butt cap. */
  function archOffset(value: number, min = 0, max = 100) {
    const lead = (host.thick / 2) / gauge._getRadius();
    return (lead + archSweep * (value - min) / (max - min)) / turn;
  }

  afterEach(() => fixture?.destroy());

  describe('color resolution', () => {
    it('is off by default and keeps per-threshold colors', () => {
      setup({ foregroundGradient: false });
      expect(gauge.foregroundGradient).toBe(false);
      expect(gauge._getForegroundColorByRange(50)).toBe('#ff0000');
    });

    it('returns a CanvasGradient with two or more colored thresholds', () => {
      setup();
      expect(gauge._getForegroundColorByRange(50)).toBeInstanceOf(CanvasGradient);
    });

    it('the gradient replaces the per-threshold color at every value', () => {
      setup({ thresholds: { '0': { color: '#ff0000' }, '40': { color: '#00ff00' }, '80': { color: '#0000ff' } } });
      for (const v of [0, 39, 40, 79, 80, 100]) {
        expect(gauge._getForegroundColorByRange(v)).toBeInstanceOf(CanvasGradient);
      }
    });

    it('falls back to foregroundColor with no thresholds', () => {
      setup({ thresholds: {} });
      expect(gauge._getForegroundColorByRange(50)).toBe('#00ff00');
    });

    it('with a single colored threshold behaves as if the gradient were off', () => {
      setup({ thresholds: { '50': { color: '#ff0000' } } });
      expect(gauge._getForegroundColorByRange(40)).toBe('#00ff00');
      expect(gauge._getForegroundColorByRange(60)).toBe('#ff0000');
    });

    it('ignores thresholds without a color', () => {
      setup({ thresholds: { '0': { bgOpacity: 0.2 }, '50': { color: '#ff0000' } } });
      expect(gauge._getForegroundColorByRange(60)).toBe('#ff0000');
    });

    it('coerces attribute strings to a boolean', () => {
      setup({ foregroundGradient: 'true' });
      expect(gauge.foregroundGradient).toBe(true);
      gauge.foregroundGradient = '';
      expect(gauge.foregroundGradient).toBe(true);
      gauge.foregroundGradient = 'false';
      expect(gauge.foregroundGradient).toBe(false);
    });

    it('falls back to per-threshold colors when a color cannot be parsed', () => {
      setup({ thresholds: { '0': { color: '#ff0000' }, '50': { color: 'not-a-color' } } });
      expect(gauge._getForegroundColorByRange(10)).toBe('#ff0000');
    });

    it('falls back to per-threshold colors when conic gradients are unsupported', () => {
      setup();
      (gauge._context as any).createConicGradient = undefined;
      expect(gauge._getForegroundColorByRange(50)).toBe('#ff0000');
    });
  });

  describe('stop placement', () => {
    it('pins each threshold color to its key on the scale', () => {
      setup({ thresholds: { '0': { color: '#ff0000' }, '40': { color: '#00ff00' }, '75.5': { color: '#0000ff' } } });
      const calls = captureGradient();
      gauge._getForegroundGradient();

      const lead = (host.thick / 2) / gauge._getRadius();
      const [angle, x, y] = calls.conic[0];
      expect(angle).toBeCloseTo(0.8 * Math.PI - lead);
      expect(x).toBe(100);
      expect(y).toBe(100);

      expect(calls.stops[0]).toEqual([0, '#ff0000']);
      expect(calls.stops.slice(1).map((s) => s[1])).toEqual(['#ff0000', '#00ff00', '#0000ff']);
      expect(calls.stops[1][0]).toBeCloseTo(archOffset(0));
      expect(calls.stops[2][0]).toBeCloseTo(archOffset(40));
      expect(calls.stops[3][0]).toBeCloseTo(archOffset(75.5));
    });

    it('sorts keys numerically and skips non-numeric keys', () => {
      setup({
        thresholds: {
          '80': { color: '#0000ff' },
          'abc': { color: '#123456' },
          '10': { color: '#ff0000' },
          '9': { color: '#00ff00' },
        },
      });
      const calls = captureGradient();
      gauge._getForegroundGradient();
      expect(calls.stops.slice(1).map((s) => s[1])).toEqual(['#00ff00', '#ff0000', '#0000ff']);
    });

    it('clamps keys outside min..max to the ends of the scale', () => {
      setup({ thresholds: { '-50': { color: '#ff0000' }, '150': { color: '#0000ff' } } });
      const calls = captureGradient();
      gauge._getForegroundGradient();
      expect(calls.stops[1][0]).toBeCloseTo(archOffset(0));
      expect(calls.stops[2][0]).toBeCloseTo(archOffset(100));
    });

    it('respects a custom min/max, including negative keys', () => {
      setup({
        min: -100,
        max: 100,
        value: 0,
        thresholds: { '-100': { color: '#ff0000' }, '0': { color: '#00ff00' }, '50': { color: '#0000ff' } },
      });
      const calls = captureGradient();
      gauge._getForegroundGradient();
      expect(calls.stops[1][0]).toBeCloseTo(archOffset(-100, -100, 100));
      expect(calls.stops[2][0]).toBeCloseTo(archOffset(0, -100, 100));
      expect(calls.stops[3][0]).toBeCloseTo(archOffset(50, -100, 100));
    });

    it('stops do not depend on the current value', () => {
      setup({ value: 10 });
      const low = captureGradient();
      gauge._getForegroundGradient();
      const lowStops = [...low.stops];
      host.value = 90;
      fixture.detectChanges();
      const high = captureGradient();
      gauge._getForegroundGradient();
      expect(high.stops).toEqual(lowStops);
    });

    it('full: starts exactly at the top with no lead and ends at offset 1', () => {
      setup({ type: 'full' });
      const calls = captureGradient();
      gauge._getForegroundGradient();
      expect(calls.conic[0][0]).toBeCloseTo(1.5 * Math.PI);
      expect(calls.stops[1][0]).toBeCloseTo(0);
      expect(calls.stops[calls.stops.length - 1][0]).toBeCloseTo(1);
    });

    it('all stop offsets stay within [0, 1] for every gauge type', () => {
      for (const type of ['arch', 'semi', 'full'] as const) {
        setup({ type, thick: 40 });
        const calls = captureGradient();
        gauge._getForegroundGradient();
        for (const [offset] of calls.stops) {
          expect(offset).toBeGreaterThanOrEqual(0);
          expect(offset).toBeLessThanOrEqual(1 + 1e-9);
        }
        fixture.destroy();
        TestBed.resetTestingModule();
      }
    });
  });

  describe('reactivity', () => {
    it('toggling foregroundGradient redraws synchronously without re-animating', () => {
      setup({ foregroundGradient: false });
      const redraw = vi.spyOn(gauge, '_redraw');
      const update = vi.spyOn(gauge, '_update');
      host.foregroundGradient = true;
      fixture.detectChanges();
      expect(redraw).toHaveBeenCalledTimes(1);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('rendered pixels', () => {
    /** Read the RGBA of the canvas at a point on the arc, in CSS pixels. */
    function pixelAt(angle: number) {
      const canvas = gauge._canvas.nativeElement as HTMLCanvasElement;
      const dpr = window.devicePixelRatio || 1;
      const { x, y } = gauge._getCenter();
      const r = gauge._getRadius();
      const px = Math.round((x + r * Math.cos(angle)) * dpr);
      const py = Math.round((y + r * Math.sin(angle)) * dpr);
      return Array.from(canvas.getContext('2d')!.getImageData(px, py, 1, 1).data);
    }

    it('at max value: first threshold color at the start, last at the end', () => {
      setup({ value: 100, type: 'semi' });
      const start = pixelAt(Math.PI + 0.05);
      const end = pixelAt(2 * Math.PI - 0.05);
      expect(start[0]).toBeGreaterThan(200);
      expect(start[2]).toBeLessThan(55);
      expect(end[2]).toBeGreaterThan(200);
      expect(end[0]).toBeLessThan(55);
    });

    it('the color follows the thresholds: past the last key the bar stays that color', () => {
      // semi: 0 → π, 50 → 1.5π, 100 → 2π
      setup({ value: 100, type: 'semi', thresholds: { '0': { color: '#ff0000' }, '50': { color: '#0000ff' } } });
      const quarter = pixelAt(1.25 * Math.PI);
      expect(quarter[0]).toBeGreaterThan(90);
      expect(quarter[2]).toBeGreaterThan(90);
      const threeQuarters = pixelAt(1.75 * Math.PI);
      expect(threeQuarters[2]).toBeGreaterThan(200);
      expect(threeQuarters[0]).toBeLessThan(55);
    });

    it('at half value the rest of the arc is unpainted', () => {
      setup({ value: 50, type: 'semi' });
      expect(pixelAt(1.75 * Math.PI)[3]).toBe(0);
    });
  });
});
