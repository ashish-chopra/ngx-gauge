import { Component, ElementRef, Renderer2, SimpleChange, SimpleChanges, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxGaugeModule } from '../../src/ngx-gauge.module';
import { NgxGauge, NgxGaugeMarkers, NgxGaugeThresholds } from '../../src/gauge/gauge';

@Component({
  standalone: true,
  imports: [NgxGaugeModule],
  template: `
    <ngx-gauge
      #gauge
      [size]="size"
      [thick]="thick"
      [type]="type"
      [cap]="cap"
      [value]="value"
      [min]="min"
      [max]="max"
      [animate]="animate"
      [markers]="markers"
      [thresholds]="thresholds"
      [foregroundColor]="foregroundColor"
      [backgroundColor]="backgroundColor"
    ></ngx-gauge>
  `,
})
class LifecycleHost {
  @ViewChild('gauge') gauge!: NgxGauge;
  size: any = 200;
  thick: any = 4;
  type: any = 'arch';
  cap: any = 'butt';
  value: any = 0;
  min: any = 0;
  max: any = 100;
  animate: any = false; // disable RAF for deterministic tests
  markers: NgxGaugeMarkers = {};
  thresholds: NgxGaugeThresholds = {};
  foregroundColor: any = 'rgba(0, 150, 136, 1)';
  backgroundColor: any = 'rgba(0, 0, 0, 0.1)';
}

/**
 * Build a "bare" NgxGauge instance for testing pure-logic lifecycle paths
 * (e.g. ngOnInit margin handling, ngOnChanges pre-init guard) without paying
 * for a full TestBed fixture.
 */
function makeBareGauge(): NgxGauge {
  const fakeEl = { nativeElement: document.createElement('div') } as ElementRef;
  const fakeRenderer = {
    setStyle: () => undefined,
    setAttribute: () => undefined,
    addClass: () => undefined,
    removeClass: () => undefined,
  } as unknown as Renderer2;
  return new NgxGauge(fakeEl, fakeRenderer);
}

function makeChange(prev: unknown, curr: unknown, firstChange = false): SimpleChange {
  return new SimpleChange(prev, curr, firstChange);
}

describe('NgxGauge lifecycle', () => {
  describe('ngOnInit (margin defaulting)', () => {
    it('sets margin to 10 when markers exist and margin is the default 0', () => {
      const gauge = makeBareGauge();
      gauge.markers = { '50': { color: 'red' } };
      gauge.ngOnInit();
      expect(gauge.margin).toBe(10);
    });

    it('keeps a non-zero margin already set by the user', () => {
      const gauge = makeBareGauge();
      gauge.markers = { '50': { color: 'red' } };
      gauge.margin = 25;
      gauge.ngOnInit();
      expect(gauge.margin).toBe(25);
    });

    it('does not change margin when there are no markers', () => {
      const gauge = makeBareGauge();
      gauge.ngOnInit();
      expect(gauge.margin).toBe(0);
    });

    it('does not change margin when markers is an empty object', () => {
      const gauge = makeBareGauge();
      gauge.markers = {};
      gauge.ngOnInit();
      expect(gauge.margin).toBe(0);
    });
  });

  describe('ngOnChanges (pre-init guard)', () => {
    it('does not invoke _update when _initialized is false', () => {
      const gauge = makeBareGauge();
      const updateSpy = vi.spyOn(gauge as any, '_update');
      const changes: SimpleChanges = {
        value: makeChange(0, 50, true),
      };
      gauge.ngOnChanges(changes);
      expect(updateSpy).not.toHaveBeenCalled();
      expect((gauge as any)._initialized).toBe(false);
    });
  });

  describe('ngOnDestroy (pre-init safety)', () => {
    // Issue #87: _destroy() unconditionally calls _clear() which dereferences
    // this._context.clearRect(...). When called before _init has run,
    // _context is undefined and a TypeError is thrown. Fix: null-guard
    // _clear and harden _destroy to be idempotent.
    it('is safe to call before _init has run', () => {
      const gauge = makeBareGauge();
      expect(() => gauge.ngOnDestroy()).not.toThrow();
    });

    it('is idempotent: calling _destroy twice does not throw', () => {
      const gauge = makeBareGauge();
      gauge.ngOnDestroy();
      expect(() => gauge.ngOnDestroy()).not.toThrow();
    });
  });

  describe('ngAfterViewInit (TestBed)', () => {
    let fixture: ComponentFixture<LifecycleHost>;
    let gauge: NgxGauge;
    let hostEl: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [LifecycleHost] });
      fixture = TestBed.createComponent(LifecycleHost);
      fixture.detectChanges();
      gauge = fixture.componentInstance.gauge;
      hostEl = fixture.nativeElement.querySelector('ngx-gauge');
    });

    it('marks _initialized = true', () => {
      expect((gauge as any)._initialized).toBe(true);
    });

    it('populates _context with a CanvasRenderingContext2D', () => {
      const ctx = (gauge as any)._context;
      expect(ctx).toBeDefined();
      expect(ctx).not.toBeNull();
    });

    it('sets canvas CSS width to size', () => {
      const canvas: HTMLCanvasElement = hostEl.querySelector('canvas')!;
      // Backing store may be size*dpr on high-DPR displays (#13/#156); the
      // consumer-facing dimension is the inline CSS width.
      expect(canvas.style.width).toBe('200px');
    });

    it('sets canvas CSS height to 0.85 * size for type "arch"', () => {
      const canvas: HTMLCanvasElement = hostEl.querySelector('canvas')!;
      expect(canvas.style.height).toBe('170px'); // 0.85 * 200
    });

    it('sets inline width/height styles on the host element', () => {
      expect(hostEl.style.width).toBe('200px');
      expect(hostEl.style.height).toBe('170px'); // arch → 0.85 * 200
    });
  });

  describe('ngAfterViewInit canvas height per type', () => {
    function setupWithType(type: 'arch' | 'semi' | 'full'): {
      fixture: ComponentFixture<LifecycleHost>;
      canvas: HTMLCanvasElement;
    } {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [LifecycleHost] });
      const fixture = TestBed.createComponent(LifecycleHost);
      fixture.componentInstance.type = type;
      fixture.detectChanges();
      const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas');
      return { fixture, canvas };
    }

    it('uses 0.85 * size for type "arch"', () => {
      const { canvas } = setupWithType('arch');
      expect(canvas.style.height).toBe('170px');
    });

    it('uses 0.85 * size for type "semi"', () => {
      // Note: #85 (shrink semi to ~0.55 × size) is deferred to v14 due to
      // its layout-affecting nature; semi continues to reserve the full
      // arch height in 13.x.
      const { canvas } = setupWithType('semi');
      expect(canvas.style.height).toBe('170px');
    });

    it('uses size (full square) for type "full"', () => {
      const { canvas } = setupWithType('full');
      expect(canvas.style.height).toBe('200px');
    });
  });

  // Issues #13 / #156: on high-DPR (Retina) displays, drawing onto a canvas
  // whose backing store matches its CSS size produces a blurry result. Fix:
  // size the backing store to size*dpr × canvasHeight*dpr, keep the inline
  // CSS size unchanged, and apply ctx.scale(dpr, dpr) once per init so the
  // drawing routines can keep working in CSS-pixel coordinates.
  describe('high-DPR canvas scaling', () => {
    let originalDpr: number;

    beforeEach(() => {
      originalDpr = window.devicePixelRatio;
      Object.defineProperty(window, 'devicePixelRatio', {
        configurable: true,
        get: () => 2,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'devicePixelRatio', {
        configurable: true,
        get: () => originalDpr,
      });
    });

    function setupAt2x(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [LifecycleHost] });
      const fixture = TestBed.createComponent(LifecycleHost);
      fixture.detectChanges();
      const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas');
      const gauge: NgxGauge = fixture.componentInstance.gauge;
      return { canvas, ctx: (gauge as any)._context };
    }

    it('scales canvas backing store by devicePixelRatio (arch, size=200)', () => {
      const { canvas } = setupAt2x();
      // Backing store: size*dpr × canvasHeight*dpr
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(340); // 0.85 * 200 * 2
    });

    it('keeps the inline CSS size at the unscaled (size, canvasHeight) values', () => {
      const { canvas } = setupAt2x();
      expect(canvas.style.width).toBe('200px');
      expect(canvas.style.height).toBe('170px');
    });

    it('applies ctx.scale(dpr, dpr) so drawing uses CSS-pixel coordinates', () => {
      const { ctx } = setupAt2x();
      // getTransform reflects all transforms applied since the last reset.
      const t = ctx.getTransform();
      expect(t.a).toBeCloseTo(2);
      expect(t.d).toBeCloseTo(2);
      expect(t.b).toBeCloseTo(0);
      expect(t.c).toBeCloseTo(0);
    });
  });

  describe('ngOnChanges (post-init)', () => {
    let fixture: ComponentFixture<LifecycleHost>;
    let host: LifecycleHost;
    let gauge: NgxGauge;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [LifecycleHost] });
      fixture = TestBed.createComponent(LifecycleHost);
      fixture.detectChanges(); // run init lifecycle
      host = fixture.componentInstance;
      gauge = host.gauge;
    });

    it('calls _update when value changes', () => {
      const updateSpy = vi.spyOn(gauge as any, '_update').mockImplementation(() => undefined);
      host.value = 50;
      fixture.detectChanges();
      expect(updateSpy).toHaveBeenCalled();
    });

    it('calls _update when min changes', () => {
      const updateSpy = vi.spyOn(gauge as any, '_update').mockImplementation(() => undefined);
      host.min = 10;
      fixture.detectChanges();
      expect(updateSpy).toHaveBeenCalled();
    });

    it('calls _update when max changes', () => {
      const updateSpy = vi.spyOn(gauge as any, '_update').mockImplementation(() => undefined);
      host.max = 250;
      fixture.detectChanges();
      expect(updateSpy).toHaveBeenCalled();
    });

    it('calls _destroy and _init when thick changes', () => {
      const destroySpy = vi.spyOn(gauge as any, '_destroy');
      const initSpy = vi.spyOn(gauge as any, '_init');
      host.thick = 10;
      fixture.detectChanges();
      expect(destroySpy).toHaveBeenCalled();
      expect(initSpy).toHaveBeenCalled();
    });

    it('calls _destroy and _init when type changes', () => {
      const destroySpy = vi.spyOn(gauge as any, '_destroy');
      const initSpy = vi.spyOn(gauge as any, '_init');
      host.type = 'full';
      fixture.detectChanges();
      expect(destroySpy).toHaveBeenCalled();
      expect(initSpy).toHaveBeenCalled();
    });

    it('calls _destroy and _init when cap changes', () => {
      const destroySpy = vi.spyOn(gauge as any, '_destroy');
      const initSpy = vi.spyOn(gauge as any, '_init');
      host.cap = 'round';
      fixture.detectChanges();
      expect(destroySpy).toHaveBeenCalled();
      expect(initSpy).toHaveBeenCalled();
    });

    it('calls _destroy and _init when size changes', () => {
      const destroySpy = vi.spyOn(gauge as any, '_destroy');
      const initSpy = vi.spyOn(gauge as any, '_init');
      host.size = 300;
      fixture.detectChanges();
      expect(destroySpy).toHaveBeenCalled();
      expect(initSpy).toHaveBeenCalled();
    });

    it('coerces NaN value to 0 before passing to _update', () => {
      const updateSpy = vi.spyOn(gauge as any, '_update').mockImplementation(() => undefined);
      host.value = 'not-a-number'; // coerceNumberProperty → 0, then ngOnChanges sees 0
      fixture.detectChanges();
      // Whatever the original previous value was, the new value passed to _update must be a number
      expect(updateSpy).toHaveBeenCalled();
      const callArgs = updateSpy.mock.calls[0];
      expect(Number.isNaN(callArgs[0])).toBe(false);
    });

    // Issue #150 Bug 2: _oldChangeVal is only updated in the `value` change
    // branch. When max (or min) changes alone after a previous value change,
    // _oldChangeVal carries a stale value from the previous (min, max) regime
    // and the next _create computes previousProgress from it, animating to a
    // wrong middle.
    it('resets _oldChangeVal to the current value when max changes', () => {
      vi.spyOn(gauge as any, '_update').mockImplementation(() => undefined);
      host.min = 0;
      host.max = 3;
      host.value = 1;
      fixture.detectChanges();
      host.value = 0;
      fixture.detectChanges();
      // After the value change, _oldChangeVal holds the previous value (1).
      expect((gauge as any)._oldChangeVal).toBe(1);

      host.max = 2; // max-only change → must NOT carry the stale _oldChangeVal
      fixture.detectChanges();

      expect((gauge as any)._oldChangeVal).toBe(host.value); // i.e. 0
    });

    it('resets _oldChangeVal to the current value when min changes', () => {
      vi.spyOn(gauge as any, '_update').mockImplementation(() => undefined);
      host.min = 0;
      host.max = 3;
      host.value = 2;
      fixture.detectChanges();
      host.value = 1;
      fixture.detectChanges();
      expect((gauge as any)._oldChangeVal).toBe(2);

      host.min = 1; // min-only change → must reset
      fixture.detectChanges();

      expect((gauge as any)._oldChangeVal).toBe(host.value); // i.e. 1
    });

    // Issues #97 / #151: changes to foregroundColor / backgroundColor /
    // thresholds / markers don't refresh the canvas because ngOnChanges only
    // checks value/min/max/thick/type/cap/size. Fix: extend isDataChanged to
    // include color/threshold/marker changes and redraw synchronously (no
    // animation re-run on color-only updates).
    it('redraws when foregroundColor changes', () => {
      const updateSpy = vi.spyOn(gauge as any, '_update').mockImplementation(() => undefined);
      const drawShellSpy = vi
        .spyOn(gauge as any, '_drawShell')
        .mockImplementation(() => undefined);

      host.foregroundColor = '#f00';
      fixture.detectChanges();

      // Either _update or _drawShell must fire so the canvas reflects the new color.
      expect(updateSpy.mock.calls.length + drawShellSpy.mock.calls.length).toBeGreaterThan(0);
    });

    it('redraws when backgroundColor changes', () => {
      const updateSpy = vi.spyOn(gauge as any, '_update').mockImplementation(() => undefined);
      const drawShellSpy = vi
        .spyOn(gauge as any, '_drawShell')
        .mockImplementation(() => undefined);

      host.backgroundColor = '#eee';
      fixture.detectChanges();

      expect(updateSpy.mock.calls.length + drawShellSpy.mock.calls.length).toBeGreaterThan(0);
    });

    it('redraws when thresholds reference changes', () => {
      const updateSpy = vi.spyOn(gauge as any, '_update').mockImplementation(() => undefined);
      const drawShellSpy = vi
        .spyOn(gauge as any, '_drawShell')
        .mockImplementation(() => undefined);

      host.thresholds = { '50': { color: 'red' } };
      fixture.detectChanges();

      expect(updateSpy.mock.calls.length + drawShellSpy.mock.calls.length).toBeGreaterThan(0);
    });

    it('redraws when markers reference changes', () => {
      const updateSpy = vi.spyOn(gauge as any, '_update').mockImplementation(() => undefined);
      const drawShellSpy = vi
        .spyOn(gauge as any, '_drawShell')
        .mockImplementation(() => undefined);

      host.markers = { '25': { color: '#000', label: '25' } };
      fixture.detectChanges();

      expect(updateSpy.mock.calls.length + drawShellSpy.mock.calls.length).toBeGreaterThan(0);
    });

    it('color-only changes do not schedule a new requestAnimationFrame (animation skipped)', () => {
      // animate=true so we'd otherwise expect RAF on data changes.
      host.animate = true;
      fixture.detectChanges();
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      host.foregroundColor = '#f00';
      fixture.detectChanges();

      // Color-only changes should trigger a synchronous redraw, not a new
      // animation frame. Without the fix, _update → _create on animate=true
      // would schedule RAF and re-run the 0 → value animation.
      expect(rafSpy).not.toHaveBeenCalled();

      rafSpy.mockRestore();
    });
  });

  describe('ngOnDestroy (post-init)', () => {
    let fixture: ComponentFixture<LifecycleHost>;
    let gauge: NgxGauge;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [LifecycleHost] });
      fixture = TestBed.createComponent(LifecycleHost);
      fixture.detectChanges();
      gauge = fixture.componentInstance.gauge;
    });

    it('clears _context to null', () => {
      fixture.destroy();
      expect((gauge as any)._context).toBeNull();
    });

    it('flips _initialized back to false', () => {
      fixture.destroy();
      expect((gauge as any)._initialized).toBe(false);
    });

    it('cancels the active animation frame request when one exists', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      (gauge as any)._animationRequestID = 42;
      fixture.destroy();
      expect(cancelSpy).toHaveBeenCalledWith(42);
      expect((gauge as any)._animationRequestID).toBe(0);
      cancelSpy.mockRestore();
    });

    it('skips cancelAnimationFrame when no request is pending', () => {
      (gauge as any)._animationRequestID = 0;
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      fixture.destroy();
      expect(cancelSpy).not.toHaveBeenCalled();
      cancelSpy.mockRestore();
    });
  });
});
