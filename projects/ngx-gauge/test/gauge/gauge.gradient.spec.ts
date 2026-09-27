import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxGaugeModule } from '../../src/ngx-gauge.module';

/**
 * Issue #61 — `foregroundGradient`: a conic gradient fixed to the scale.
 *
 * Stop placement is asserted by capturing `createConicGradient` /
 * `addColorStop` calls on the real context. The pixel tests at the bottom
 * render for real and sample the canvas to prove the colors land at the
 * right ends of the arc.
 */

@Component({
  standalone: true,
  imports: [NgxGaugeModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ngx-gauge
      [value]="value"
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
  type: 'arch' | 'full' | 'semi' = 'arch';
  thick = 10;
  cap: 'round' | 'butt' = 'butt';
  size = 200;
  thresholds: { [k: string]: { color?: string } } = {};
  foregroundColor = '#00ff00';
  foregroundGradient: string[] | null = ['#ff0000', '#0000ff'];
}

describe('NgxGauge foregroundGradient (#61)', () => {
  let fixture: ComponentFixture<GradientHost>;
  let host: GradientHost;
  let gauge: any;

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

  afterEach(() => fixture?.destroy());

  describe('color resolution', () => {
    it('falls back to foregroundColor when foregroundGradient is null', () => {
      setup({ foregroundGradient: null });
      expect(gauge._getForegroundColorByRange(50)).toBe('#00ff00');
    });

    it('falls back to foregroundColor when foregroundGradient is empty', () => {
      setup({ foregroundGradient: [] });
      expect(gauge._getForegroundColorByRange(50)).toBe('#00ff00');
    });

    it('uses a single color as a solid fill', () => {
      setup({ foregroundGradient: ['#123456'] });
      expect(gauge._getForegroundColorByRange(50)).toBe('#123456');
    });

    it('returns a CanvasGradient for two or more colors', () => {
      setup();
      expect(gauge._getForegroundColorByRange(50)).toBeInstanceOf(CanvasGradient);
    });

    it('a matching threshold color takes precedence over the gradient', () => {
      setup({ thresholds: { '0': { color: '#abcdef' } } });
      expect(gauge._getForegroundColorByRange(50)).toBe('#abcdef');
    });

    it('a matching threshold without a color still uses the gradient', () => {
      setup({ thresholds: { '0': {} } });
      expect(gauge._getForegroundColorByRange(50)).toBeInstanceOf(CanvasGradient);
    });

    it('falls back to foregroundColor when a color cannot be parsed', () => {
      setup({ foregroundGradient: ['#ff0000', 'not-a-color'] });
      expect(gauge._getForegroundColorByRange(50)).toBe('#00ff00');
    });

    it('uses the first color when conic gradients are unsupported', () => {
      setup();
      (gauge._context as any).createConicGradient = undefined;
      expect(gauge._getForegroundColorByRange(50)).toBe('#ff0000');
    });
  });

  describe('stop placement', () => {
    it("arch + butt cap: starts at the head and spreads stops across the full sweep", () => {
      setup({ foregroundGradient: ['#ff0000', '#00ff00', '#0000ff'] });
      const calls = captureGradient();
      gauge._getForegroundGradient();

      const radius = gauge._getRadius();
      const lead = (host.thick / 2) / radius;
      const sweep = 1.4 * Math.PI;
      const turn = 2 * Math.PI;

      const [angle, x, y] = calls.conic[0];
      expect(angle).toBeCloseTo(0.8 * Math.PI - lead);
      expect(x).toBe(100);
      expect(y).toBe(100);

      expect(calls.stops[0]).toEqual([0, '#ff0000']);
      expect(calls.stops[1][0]).toBeCloseTo(lead / turn);
      expect(calls.stops[2][0]).toBeCloseTo((lead + sweep / 2) / turn);
      expect(calls.stops[3][0]).toBeCloseTo((lead + sweep) / turn);
      expect(calls.stops.slice(1).map((s) => s[1])).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    });

    it('stops do not depend on the current value (fixed to scale)', () => {
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

    it("full: starts exactly at the top with no lead and ends at offset 1", () => {
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
    it('changing foregroundGradient redraws synchronously without re-animating', () => {
      setup();
      const redraw = vi.spyOn(gauge, '_redraw');
      const update = vi.spyOn(gauge, '_update');
      host.foregroundGradient = ['#000000', '#ffffff'];
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

    it('at max value: red at the start of the arc, blue at the end', () => {
      setup({ value: 100, type: 'semi' });
      const start = pixelAt(Math.PI + 0.05);
      const end = pixelAt(2 * Math.PI - 0.05);
      expect(start[0]).toBeGreaterThan(200);
      expect(start[2]).toBeLessThan(55);
      expect(end[2]).toBeGreaterThan(200);
      expect(end[0]).toBeLessThan(55);
    });

    it('at half value: the tip is a mid-scale blend and the rest is unpainted', () => {
      setup({ value: 50, type: 'semi' });
      const tip = pixelAt(1.5 * Math.PI - 0.02);
      expect(tip[0]).toBeGreaterThan(90);
      expect(tip[0]).toBeLessThan(170);
      expect(tip[2]).toBeGreaterThan(90);
      expect(tip[2]).toBeLessThan(170);
      // Past the value only the (transparent) background is drawn.
      expect(pixelAt(1.75 * Math.PI)[3]).toBe(0);
    });
  });
});
