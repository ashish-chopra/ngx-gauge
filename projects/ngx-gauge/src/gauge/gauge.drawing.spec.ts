import { Component, ElementRef, Renderer2 } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxGauge } from './gauge';
import { NgxGaugeModule } from '../ngx-gauge.module';

/**
 * Phase 2.6 — drawing pipeline coverage.
 *
 * Pure-logic methods (`_getBounds`, `_getDisplacement`, geometry helpers) are
 * exercised via direct instantiation with stubbed ElementRef/Renderer2.
 *
 * Methods that touch `this._context` (`_drawShell`, `_drawFill`, `_addMarker`,
 * `_drawMarkersAndTicks`) and the animation entry-point `_create` are
 * exercised through TestBed so a real CanvasRenderingContext2D is created
 * by `_init()`. Once the context exists, its methods are replaced with
 * `vi.fn()` spies and the private routines are invoked directly.
 */

@Component({
  standalone: true,
  imports: [NgxGaugeModule],
  template: `
    <ngx-gauge
      [value]="value"
      [min]="min"
      [max]="max"
      [animate]="animate"
      [type]="type"
      [thick]="thick"
      [cap]="cap"
      [size]="size"
      [margin]="margin"
      [thresholds]="thresholds"
      [markers]="markers"
      [foregroundColor]="foregroundColor"
      [backgroundColor]="backgroundColor">
    </ngx-gauge>
  `,
})
class DrawingHost {
  value = 50;
  min = 0;
  max = 100;
  animate: boolean | string = false;
  type: 'arch' | 'full' | 'semi' = 'arch';
  thick = 4;
  cap: 'round' | 'butt' = 'butt';
  size = 200;
  margin: number | undefined = undefined;
  thresholds: { [k: string]: { color?: string; backgroundColor?: string; bgOpacity?: number } } = {};
  markers: {
    [k: string]: { color?: string; label?: string; type?: 'line' | 'triangle'; size?: number; font?: string };
  } = {};
  foregroundColor = '#0f0';
  backgroundColor = '#000';
}

function makeRawGauge(): NgxGauge {
  const fakeEl = { nativeElement: document.createElement('div') } as ElementRef;
  const fakeRenderer = { setStyle: () => undefined } as unknown as Renderer2;
  return new NgxGauge(fakeEl, fakeRenderer);
}

describe('NgxGauge drawing pipeline — pure geometry', () => {
  describe('_getBounds', () => {
    let gauge: any;
    beforeEach(() => {
      gauge = makeRawGauge();
    });

    it("returns head=PI, tail=2PI, start=180, end=360 for 'semi'", () => {
      const b = gauge._getBounds('semi');
      expect(b.head).toBeCloseTo(Math.PI);
      expect(b.tail).toBeCloseTo(2 * Math.PI);
      expect(b.start).toBe(180);
      expect(b.end).toBe(360);
    });

    it("returns head=1.5PI, tail=3.5PI, start=270, end=630 for 'full'", () => {
      const b = gauge._getBounds('full');
      expect(b.head).toBeCloseTo(1.5 * Math.PI);
      expect(b.tail).toBeCloseTo(3.5 * Math.PI);
      expect(b.start).toBe(270);
      expect(b.end).toBe(630);
    });

    it("returns head=0.8PI, tail=2.2PI, start=144, end=396 for 'arch'", () => {
      const b = gauge._getBounds('arch');
      expect(b.head).toBeCloseTo(0.8 * Math.PI);
      expect(b.tail).toBeCloseTo(2.2 * Math.PI);
      expect(b.start).toBeCloseTo(144);
      expect(b.end).toBeCloseTo(396);
    });
  });

  describe('_getDisplacement', () => {
    it('maps min/mid/max to head/midpoint/tail for arch', () => {
      const gauge: any = makeRawGauge();
      gauge.min = 0;
      gauge.max = 100;
      gauge.type = 'arch';
      // arch: head=0.8π, tail=2.2π → unit=0.014π
      expect(gauge._getDisplacement(0)).toBeCloseTo(0.8 * Math.PI);
      expect(gauge._getDisplacement(50)).toBeCloseTo(1.5 * Math.PI);
      expect(gauge._getDisplacement(100)).toBeCloseTo(2.2 * Math.PI);
    });

    it('maps min/mid/max for semi', () => {
      const gauge: any = makeRawGauge();
      gauge.min = 0;
      gauge.max = 100;
      gauge.type = 'semi';
      expect(gauge._getDisplacement(0)).toBeCloseTo(Math.PI);
      expect(gauge._getDisplacement(50)).toBeCloseTo(1.5 * Math.PI);
      expect(gauge._getDisplacement(100)).toBeCloseTo(2 * Math.PI);
    });

    it('maps min/mid/max for full', () => {
      const gauge: any = makeRawGauge();
      gauge.min = 0;
      gauge.max = 100;
      gauge.type = 'full';
      expect(gauge._getDisplacement(0)).toBeCloseTo(1.5 * Math.PI);
      expect(gauge._getDisplacement(50)).toBeCloseTo(2.5 * Math.PI);
      expect(gauge._getDisplacement(100)).toBeCloseTo(3.5 * Math.PI);
    });

    it('clamps below-min values to head angle', () => {
      const gauge: any = makeRawGauge();
      gauge.min = 0;
      gauge.max = 100;
      gauge.type = 'semi';
      expect(gauge._getDisplacement(-50)).toBeCloseTo(Math.PI); // clamped to 0 → head
    });

    it('clamps above-max values to tail angle', () => {
      const gauge: any = makeRawGauge();
      gauge.min = 0;
      gauge.max = 100;
      gauge.type = 'semi';
      expect(gauge._getDisplacement(250)).toBeCloseTo(2 * Math.PI); // clamped to 100 → tail
    });

    it('respects non-zero min when computing the displacement', () => {
      const gauge: any = makeRawGauge();
      gauge.min = 50;
      gauge.max = 150;
      gauge.type = 'semi';
      expect(gauge._getDisplacement(50)).toBeCloseTo(Math.PI); // min → head
      expect(gauge._getDisplacement(100)).toBeCloseTo(1.5 * Math.PI); // midpoint
      expect(gauge._getDisplacement(150)).toBeCloseTo(2 * Math.PI); // max → tail
    });
  });

  describe('geometry helpers', () => {
    it('_getWidth/_getHeight return the size input', () => {
      const gauge: any = makeRawGauge();
      gauge.size = 240;
      expect(gauge._getWidth()).toBe(240);
      expect(gauge._getHeight()).toBe(240);
    });

    it('_getCenter returns size/2 on each axis', () => {
      const gauge: any = makeRawGauge();
      gauge.size = 200;
      expect(gauge._getCenter()).toEqual({ x: 100, y: 100 });
    });

    it("_getCanvasHeight scales by 0.85 for 'semi' and 'arch'", () => {
      const gauge: any = makeRawGauge();
      gauge.size = 200;
      gauge.type = 'semi';
      expect(gauge._getCanvasHeight()).toBeCloseTo(170);
      gauge.type = 'arch';
      expect(gauge._getCanvasHeight()).toBeCloseTo(170);
    });

    it("_getCanvasHeight returns full size for 'full'", () => {
      const gauge: any = makeRawGauge();
      gauge.size = 200;
      gauge.type = 'full';
      expect(gauge._getCanvasHeight()).toBe(200);
    });

    it('_getRadius subtracts thick from half-width (no margin)', () => {
      const gauge: any = makeRawGauge();
      gauge.size = 200; // center.x=100
      gauge.thick = 4;
      expect(gauge._getRadius()).toBe(96);
    });

    it('_getRadius subtracts thick AND margin when margin > 0', () => {
      const gauge: any = makeRawGauge();
      gauge.size = 200;
      gauge.thick = 4;
      // _margin is set internally by the setter; assign directly
      (gauge as any)._margin = 10;
      expect(gauge._getRadius()).toBe(86);
    });
  });
});

describe('NgxGauge drawing pipeline — context-dependent methods', () => {
  let fixture: ComponentFixture<DrawingHost>;
  let host: DrawingHost;
  let gauge: any;

  /**
   * Replace every CanvasRenderingContext2D method we care about with a
   * vi.fn() spy after init has populated `_context`. Property setters
   * (`strokeStyle`, `lineCap`, `lineWidth`, etc.) remain on the real
   * context — assertions on those use the post-call value.
   */
  function spyOnContext() {
    const ctx = gauge._context as CanvasRenderingContext2D;
    const methods: (keyof CanvasRenderingContext2D)[] = [
      'beginPath',
      'arc',
      'stroke',
      'moveTo',
      'lineTo',
      'closePath',
      'fill',
      'fillText',
      'save',
      'restore',
      'translate',
      'rotate',
      'clearRect',
    ];
    for (const m of methods) {
      (ctx as any)[m] = vi.fn();
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DrawingHost],
    });
    fixture = TestBed.createComponent(DrawingHost);
    host = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngAfterViewInit → _init → _context populated
    gauge = (fixture.debugElement.children[0] as any).componentInstance;
    spyOnContext();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('_drawShell', () => {
    it('with empty thresholds: clears, draws background arc, then fill arc', () => {
      const ctx = gauge._context as any;
      gauge._drawShell(0, 1, 2, '#abc');

      expect(ctx.clearRect).toHaveBeenCalled();
      // beginPath called twice: once for background arc, once for fill arc
      expect(ctx.beginPath).toHaveBeenCalledTimes(2);
      expect(ctx.arc).toHaveBeenCalledTimes(2);
      expect(ctx.stroke).toHaveBeenCalledTimes(2);
      // background arc uses host's [start, tail]
      expect(ctx.arc).toHaveBeenNthCalledWith(1, expect.any(Number), expect.any(Number), expect.any(Number), 0, 2, false);
      // foreground/fill arc uses [start, middle]
      expect(ctx.arc).toHaveBeenNthCalledWith(2, expect.any(Number), expect.any(Number), expect.any(Number), 0, 1, false);
    });

    it("propagates the 'cap' input to ctx.lineCap when no thresholds", () => {
      host.cap = 'round';
      fixture.detectChanges();
      spyOnContext();
      gauge._drawShell(0, 1, 2, '#abc');

      expect(gauge._context.lineCap).toBe('round');
    });

    it("uses lineCap='butt' when thresholds are configured", () => {
      host.thresholds = { '0': { color: 'red' }, '50': { color: 'green' } };
      fixture.detectChanges();
      spyOnContext();
      gauge._drawShell(0, 1, 2, '#abc');

      // Even if cap input is 'round', threshold rendering forces butt.
      expect(gauge._context.lineCap).toBe('butt');
    });

    it("propagates 'thick' to ctx.lineWidth", () => {
      host.thick = 12;
      fixture.detectChanges();
      spyOnContext();
      gauge._drawShell(0, 1, 2, '#abc');

      expect(gauge._context.lineWidth).toBe(12);
    });

    it('with thresholds: draws an arc per range plus a fill arc, restores globalAlpha', () => {
      host.thresholds = {
        '0': { color: 'red', bgOpacity: 0.4 },
        '50': { color: 'green', bgOpacity: 0.4 },
      };
      fixture.detectChanges();
      spyOnContext();
      const ctx = gauge._context as any;

      gauge._drawShell(0, 1, 2, '#abc');

      // 2 ranges → 2 background arcs + 1 foreground fill arc = 3
      expect(ctx.arc).toHaveBeenCalledTimes(3);
      // globalAlpha is reset to 1 after each range
      expect(ctx.globalAlpha).toBe(1);
    });

    it('does not draw when _initialized is false (pre-init guard)', () => {
      const ctx = gauge._context as any;
      gauge._initialized = false;

      gauge._drawShell(0, 1, 2, '#abc');

      expect(ctx.beginPath).not.toHaveBeenCalled();
      expect(ctx.arc).not.toHaveBeenCalled();
    });
  });

  describe('_drawFill', () => {
    it('draws a single arc clamped to [start, tail]', () => {
      const ctx = gauge._context as any;
      gauge._drawFill(1, 5, 3, '#fff'); // middle (5) > tail (3) → clamped to 3

      expect(ctx.beginPath).toHaveBeenCalledTimes(1);
      expect(ctx.arc).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.any(Number), 1, 3, false);
      expect(ctx.stroke).toHaveBeenCalledTimes(1);
    });

    it('clamps middle to start when below start', () => {
      const ctx = gauge._context as any;
      gauge._drawFill(2, 1, 5, '#fff'); // middle (1) < start (2) → clamped to 2

      expect(ctx.arc).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.any(Number), 2, 2, false);
    });

    it('uses the color argument for strokeStyle', () => {
      gauge._drawFill(0, 1, 2, '#abc123');
      expect(gauge._context.strokeStyle).toBe('#abc123');
    });
  });

  describe('_addMarker', () => {
    it("default type 'line': beginPath/moveTo/lineTo/closePath/stroke (no fill)", () => {
      const ctx = gauge._context as any;
      gauge._addMarker(0, '#000');

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalledTimes(1);
      expect(ctx.lineTo).toHaveBeenCalledTimes(1);
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.fill).not.toHaveBeenCalled();
    });

    it("type 'triangle': three lineTo calls + closePath + fill", () => {
      const ctx = gauge._context as any;
      gauge._addMarker(45, '#f00', undefined, 'triangle');

      // moveTo once, lineTo 3 times (back to start), closePath, stroke, fill
      expect(ctx.moveTo).toHaveBeenCalledTimes(1);
      expect(ctx.lineTo).toHaveBeenCalledTimes(3);
      expect(ctx.closePath).toHaveBeenCalledTimes(1);
      expect(ctx.fill).toHaveBeenCalledTimes(1);
    });

    it('renders label via save/translate/rotate/fillText/restore when label is provided', () => {
      const ctx = gauge._context as any;
      gauge._addMarker(90, '#000', '25 lbs');

      expect(ctx.save).toHaveBeenCalledTimes(1);
      expect(ctx.translate).toHaveBeenCalledTimes(1);
      expect(ctx.rotate).toHaveBeenCalledTimes(1);
      expect(ctx.fillText).toHaveBeenCalledWith('25 lbs', 0, -3);
      expect(ctx.restore).toHaveBeenCalledTimes(1);
    });

    it("uses provided font when label rendered, else defaults to '13px Arial'", () => {
      const ctx = gauge._context as any;
      gauge._addMarker(0, '#000', 'X');
      expect(ctx.fillText).toHaveBeenCalledTimes(1);
      // font is set via property; check the property was assigned default
      expect(gauge._context.font).toContain('Arial');

      // Now with a custom font
      spyOnContext();
      gauge._addMarker(0, '#000', 'Y', undefined, undefined, '11px verdana');
      expect(gauge._context.font).toContain('verdana');
    });

    it('does not call fillText when no label is provided', () => {
      const ctx = gauge._context as any;
      gauge._addMarker(0, '#000');
      expect(ctx.fillText).not.toHaveBeenCalled();
      expect(ctx.save).not.toHaveBeenCalled();
    });
  });

  describe('_drawMarkersAndTicks', () => {
    it('does nothing when markers is an empty object', () => {
      // Markers default to Object.create(null); spy on _addMarker.
      const addSpy = vi.spyOn(gauge, '_addMarker');
      gauge._drawMarkersAndTicks();
      expect(addSpy).not.toHaveBeenCalled();
    });

    it('calls _addMarker once per configured marker', () => {
      host.markers = {
        '25': { color: '#555', label: '25', type: 'line' },
        '50': { color: '#777', label: '50', type: 'triangle' },
        '75': { color: '#999', label: '75', type: 'line' },
      };
      fixture.detectChanges();
      spyOnContext();
      const addSpy = vi.spyOn(gauge, '_addMarker');

      gauge._drawMarkersAndTicks();

      expect(addSpy).toHaveBeenCalledTimes(3);
      // First arg is the angle (number) — verify it's finite for each
      for (const call of addSpy.mock.calls) {
        expect(Number.isFinite(call[0] as number)).toBe(true);
      }
    });

    it('forwards marker color/label/type/size/font to _addMarker', () => {
      host.markers = {
        '50': { color: 'cyan', label: 'mid', type: 'triangle', size: 12, font: '10px serif' },
      };
      fixture.detectChanges();
      spyOnContext();
      const addSpy = vi.spyOn(gauge, '_addMarker');

      gauge._drawMarkersAndTicks();

      const call = addSpy.mock.calls[0];
      expect(call[1]).toBe('cyan'); // color
      expect(call[2]).toBe('mid'); // label
      expect(call[3]).toBe('triangle'); // type
      expect(call[4]).toBe(12); // size/len
      expect(call[5]).toBe('10px serif'); // font
    });
  });
});

describe('NgxGauge animation pipeline', () => {
  let fixture: ComponentFixture<DrawingHost>;
  let host: DrawingHost;
  let gauge: any;
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DrawingHost],
    });
    rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    cafSpy = vi.spyOn(window, 'cancelAnimationFrame');
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  it('animate=false: _create draws synchronously without scheduling RAF', () => {
    fixture = TestBed.createComponent(DrawingHost);
    host = fixture.componentInstance;
    host.animate = false;
    fixture.detectChanges(); // init → _create runs sync path
    gauge = (fixture.debugElement.children[0] as any).componentInstance;

    // Replace context spies, call _create again, verify _drawShell is invoked
    // synchronously and no NEW RAF is scheduled.
    const drawSpy = vi.spyOn(gauge, '_drawShell').mockImplementation(() => undefined);
    const callsBefore = rafSpy.mock.calls.length;

    gauge._create();

    expect(drawSpy).toHaveBeenCalledTimes(1);
    expect(rafSpy.mock.calls.length).toBe(callsBefore);
  });

  it('animate=true: _create schedules a requestAnimationFrame', () => {
    fixture = TestBed.createComponent(DrawingHost);
    host = fixture.componentInstance;
    host.animate = true;
    fixture.detectChanges();
    gauge = (fixture.debugElement.children[0] as any).componentInstance;

    const drawSpy = vi.spyOn(gauge, '_drawShell').mockImplementation(() => undefined);
    const callsBefore = rafSpy.mock.calls.length;

    gauge._create();

    // Async path: RAF scheduled, _drawShell NOT called until callback fires.
    expect(rafSpy.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(drawSpy).not.toHaveBeenCalled();
  });

  it('animate=true: a previously scheduled frame is cancelled before scheduling a new one', () => {
    fixture = TestBed.createComponent(DrawingHost);
    host = fixture.componentInstance;
    host.animate = true;
    fixture.detectChanges();
    gauge = (fixture.debugElement.children[0] as any).componentInstance;

    // _animationRequestID was set during init's _create. Call _create again
    // and verify cancelAnimationFrame is invoked with the previous handle.
    const previousId = gauge._animationRequestID;
    expect(previousId).not.toBe(0);

    const cafCallsBefore = cafSpy.mock.calls.length;

    gauge._create();

    expect(cafSpy.mock.calls.length).toBeGreaterThan(cafCallsBefore);
    expect(cafSpy).toHaveBeenCalledWith(previousId);
  });

  it("animate=true: _update with new/old values recomputes displacement using nv-ov", () => {
    fixture = TestBed.createComponent(DrawingHost);
    host = fixture.componentInstance;
    host.animate = true;
    host.value = 25;
    fixture.detectChanges();
    gauge = (fixture.debugElement.children[0] as any).componentInstance;

    // _create(nv, ov) is the hot path of _update. We can't easily inspect
    // the closure-local `displacement`, but we can confirm it doesn't throw
    // and a new RAF is scheduled.
    const callsBefore = rafSpy.mock.calls.length;
    gauge._create(75, 25);
    expect(rafSpy.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
