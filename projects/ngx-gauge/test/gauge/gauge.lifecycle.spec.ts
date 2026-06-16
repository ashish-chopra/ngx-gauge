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
    // Known issue: _destroy() unconditionally calls _clear() which dereferences
    // this._context.clearRect(...). When called before _init has run, _context
    // is undefined and a TypeError is thrown. The fix (a `if (this._context)`
    // guard) is deferred to v14 to keep 13.x runtime behavior unchanged.
    it.todo('is safe to call before _init has run (deferred to v14)');
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

    it('sets canvas width to size', () => {
      const canvas: HTMLCanvasElement = hostEl.querySelector('canvas')!;
      expect(canvas.width).toBe(200);
    });

    it('sets canvas height to 0.85 * size for type "arch"', () => {
      const canvas: HTMLCanvasElement = hostEl.querySelector('canvas')!;
      expect(canvas.height).toBe(170); // 0.85 * 200
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
      expect(canvas.height).toBe(170);
    });

    it('uses 0.85 * size for type "semi"', () => {
      const { canvas } = setupWithType('semi');
      expect(canvas.height).toBe(170);
    });

    it('uses size (full square) for type "full"', () => {
      const { canvas } = setupWithType('full');
      expect(canvas.height).toBe(200);
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
