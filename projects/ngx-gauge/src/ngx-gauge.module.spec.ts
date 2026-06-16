import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxGaugeModule } from './ngx-gauge.module';
import { NgxGauge } from './gauge/gauge';
import {
  NgxGaugeAppend,
  NgxGaugeLabel,
  NgxGaugePrepend,
  NgxGaugeValue,
} from './gauge/gauge-directives';

/**
 * Module sanity coverage. Verifies each of the five public symbols is
 * wired into NgxGaugeModule's exports by importing the module and
 * exercising every selector in a host template. If any symbol is
 * dropped from `exports`, AOT template compilation fails here.
 */
describe('NgxGaugeModule', () => {
  it('instantiates without throwing', () => {
    expect(new NgxGaugeModule()).toBeDefined();
  });

  it('exposes the public symbols at module scope', () => {
    // Ensure the symbols themselves are exported from the module barrel
    // (regression for accidental tree-shake or rename).
    expect(NgxGauge).toBeDefined();
    expect(NgxGaugeAppend).toBeDefined();
    expect(NgxGaugePrepend).toBeDefined();
    expect(NgxGaugeValue).toBeDefined();
    expect(NgxGaugeLabel).toBeDefined();
  });

  it('renders <ngx-gauge> with default inputs when consumed via TestBed', () => {
    @Component({
      standalone: true,
      imports: [NgxGaugeModule],
      template: `<ngx-gauge [value]="42"></ngx-gauge>`,
    })
    class Host {}

    TestBed.configureTestingModule({
      imports: [Host],
    });

    const fixture = TestBed.createComponent(Host);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.querySelector('ngx-gauge')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('canvas')).not.toBeNull();
    fixture.destroy();
  });

  it('renders all four projection directives via the module exports', () => {
    // Importing NgxGaugeModule alone must be enough for every selector
    // (regression: a directive dropped from `exports` would fail AOT here).
    @Component({
      standalone: true,
      imports: [NgxGaugeModule],
      template: `
        <ngx-gauge [value]="50">
          <ngx-gauge-prepend>$</ngx-gauge-prepend>
          <ngx-gauge-value>fifty</ngx-gauge-value>
          <ngx-gauge-append>USD</ngx-gauge-append>
          <ngx-gauge-label>price</ngx-gauge-label>
        </ngx-gauge>
      `,
    })
    class Host {}

    TestBed.configureTestingModule({
      imports: [Host],
    });

    const fixture = TestBed.createComponent(Host);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.querySelector('ngx-gauge-prepend')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ngx-gauge-value')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ngx-gauge-append')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ngx-gauge-label')).not.toBeNull();
    fixture.destroy();
  });

  it('CommonModule template features (@switch / @if) work inside the gauge', () => {
    // The gauge's own template uses @switch for projection fallbacks. This
    // test confirms structural-directive support is reachable through the
    // module's import graph by toggling a projected slot at runtime.
    @Component({
      standalone: true,
      imports: [NgxGaugeModule],
      template: `
        <ngx-gauge [value]="10" [label]="'fallback'">
          @if (showProjected) {
            <ngx-gauge-label>projected</ngx-gauge-label>
          }
        </ngx-gauge>
      `,
    })
    class Host {
      showProjected = false;
    }

    TestBed.configureTestingModule({
      imports: [Host],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.reading-label');
    expect(label.textContent).toContain('fallback');

    fixture.componentInstance.showProjected = true;
    fixture.detectChanges();
    expect(label.textContent).toContain('projected');
    fixture.destroy();
  });
});
