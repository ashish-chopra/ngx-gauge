import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxGaugeModule } from '../ngx-gauge.module';

/**
 * Content-projection regression coverage for the four projected slots.
 *
 * gauge.html uses `@switch (_xChild != null)` to fall back to the string
 * input ({{label}}, {{prepend}}, {{append}}, {{value | number}}) when no
 * directive child is projected. The bug nearly missed in the lint-cleanup
 * PR was this fallback rendering — these tests guard against accidental
 * regressions in either direction (fallback when projection should win,
 * or projection silently winning when fallback should render).
 */
@Component({
  standalone: true,
  imports: [NgxGaugeModule],
  template: `
    <ngx-gauge
      [label]="label"
      [prepend]="prepend"
      [append]="append"
      [value]="value">
      @if (showLabel) {
        <ngx-gauge-label>{{ labelText }}</ngx-gauge-label>
      }
      @if (showPrepend) {
        <ngx-gauge-prepend>{{ prependText }}</ngx-gauge-prepend>
      }
      @if (showAppend) {
        <ngx-gauge-append>{{ appendText }}</ngx-gauge-append>
      }
      @if (showValue) {
        <ngx-gauge-value>{{ valueText }}</ngx-gauge-value>
      }
    </ngx-gauge>
  `,
})
class ProjectionHost {
  label = 'fallback-label';
  prepend = 'PRE';
  append = 'POST';
  value = 42;

  showLabel = false;
  showPrepend = false;
  showAppend = false;
  showValue = false;

  labelText = 'projected-label';
  prependText = 'projected-prepend';
  appendText = 'projected-append';
  valueText = 'projected-value';
}

function readingBlock(fixture: ComponentFixture<ProjectionHost>): HTMLElement {
  return fixture.nativeElement.querySelector('.reading-block');
}

function readingLabel(fixture: ComponentFixture<ProjectionHost>): HTMLElement {
  return fixture.nativeElement.querySelector('.reading-label');
}

describe('NgxGauge content projection', () => {
  let fixture: ComponentFixture<ProjectionHost>;
  let host: ProjectionHost;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProjectionHost] });
    fixture = TestBed.createComponent(ProjectionHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('label slot', () => {
    it('renders the [label] string when no <ngx-gauge-label> is projected', () => {
      expect(readingLabel(fixture).textContent).toContain('fallback-label');
      expect(fixture.nativeElement.querySelector('ngx-gauge-label')).toBeNull();
    });

    it('renders projected <ngx-gauge-label> content and suppresses the fallback', () => {
      host.showLabel = true;
      fixture.detectChanges();

      const projected: HTMLElement | null = fixture.nativeElement.querySelector('ngx-gauge-label');
      expect(projected).not.toBeNull();
      expect(projected!.textContent).toContain('projected-label');
      expect(readingLabel(fixture).textContent).not.toContain('fallback-label');
    });

    it('toggles between projected and fallback when *ngIf flips', () => {
      host.showLabel = true;
      fixture.detectChanges();
      expect(readingLabel(fixture).textContent).toContain('projected-label');

      host.showLabel = false;
      fixture.detectChanges();
      expect(readingLabel(fixture).textContent).toContain('fallback-label');
      expect(fixture.nativeElement.querySelector('ngx-gauge-label')).toBeNull();
    });

    it('reflects [label] input changes when fallback is active', () => {
      host.label = 'updated-label';
      fixture.detectChanges();
      expect(readingLabel(fixture).textContent).toContain('updated-label');
    });
  });

  describe('prepend slot', () => {
    it('renders the [prepend] string when no <ngx-gauge-prepend> is projected', () => {
      expect(readingBlock(fixture).textContent).toContain('PRE');
      expect(fixture.nativeElement.querySelector('ngx-gauge-prepend')).toBeNull();
    });

    it('renders projected <ngx-gauge-prepend> content', () => {
      host.showPrepend = true;
      fixture.detectChanges();

      const projected: HTMLElement | null = fixture.nativeElement.querySelector('ngx-gauge-prepend');
      expect(projected).not.toBeNull();
      expect(projected!.textContent).toContain('projected-prepend');
      expect(readingBlock(fixture).textContent).not.toContain('PRE');
    });

    it('toggles between projected and fallback when *ngIf flips', () => {
      host.showPrepend = true;
      fixture.detectChanges();
      expect(readingBlock(fixture).textContent).toContain('projected-prepend');

      host.showPrepend = false;
      fixture.detectChanges();
      expect(readingBlock(fixture).textContent).toContain('PRE');
      expect(fixture.nativeElement.querySelector('ngx-gauge-prepend')).toBeNull();
    });
  });

  describe('append slot', () => {
    it('renders the [append] string when no <ngx-gauge-append> is projected', () => {
      expect(readingBlock(fixture).textContent).toContain('POST');
      expect(fixture.nativeElement.querySelector('ngx-gauge-append')).toBeNull();
    });

    it('renders projected <ngx-gauge-append> content', () => {
      host.showAppend = true;
      fixture.detectChanges();

      const projected: HTMLElement | null = fixture.nativeElement.querySelector('ngx-gauge-append');
      expect(projected).not.toBeNull();
      expect(projected!.textContent).toContain('projected-append');
      expect(readingBlock(fixture).textContent).not.toContain('POST');
    });

    it('toggles between projected and fallback when *ngIf flips', () => {
      host.showAppend = true;
      fixture.detectChanges();
      expect(readingBlock(fixture).textContent).toContain('projected-append');

      host.showAppend = false;
      fixture.detectChanges();
      expect(readingBlock(fixture).textContent).toContain('POST');
    });
  });

  describe('value slot', () => {
    it('renders {{value | number}} fallback when no <ngx-gauge-value> is projected', () => {
      expect(readingBlock(fixture).textContent).toContain('42');
      expect(fixture.nativeElement.querySelector('ngx-gauge-value')).toBeNull();
    });

    it('renders projected <ngx-gauge-value> content and suppresses the fallback number', () => {
      host.showValue = true;
      fixture.detectChanges();

      const projected: HTMLElement | null = fixture.nativeElement.querySelector('ngx-gauge-value');
      expect(projected).not.toBeNull();
      expect(projected!.textContent).toContain('projected-value');
      // The fallback number ("42") should no longer be a direct text node of .reading-block.
      // Direct child text nodes are checked rather than full subtree because the
      // projected element itself may contain unrelated digits.
      const directText = Array.from(readingBlock(fixture).childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? '')
        .join('');
      expect(directText).not.toContain('42');
    });

    it('toggles between projected and fallback when *ngIf flips', () => {
      host.showValue = true;
      fixture.detectChanges();
      expect(readingBlock(fixture).textContent).toContain('projected-value');

      host.showValue = false;
      fixture.detectChanges();
      expect(readingBlock(fixture).textContent).toContain('42');
      expect(fixture.nativeElement.querySelector('ngx-gauge-value')).toBeNull();
    });

    it('reflects [value] input changes when fallback is active', () => {
      host.value = 87;
      fixture.detectChanges();
      expect(readingBlock(fixture).textContent).toContain('87');
    });
  });

  describe('all four slots active simultaneously', () => {
    it('renders projected content for every slot', () => {
      host.showLabel = true;
      host.showPrepend = true;
      host.showAppend = true;
      host.showValue = true;
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('ngx-gauge-label')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('ngx-gauge-prepend')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('ngx-gauge-append')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('ngx-gauge-value')).not.toBeNull();

      // Fallback strings should be absent
      expect(readingBlock(fixture).textContent).not.toContain('PRE');
      expect(readingBlock(fixture).textContent).not.toContain('POST');
      expect(readingLabel(fixture).textContent).not.toContain('fallback-label');
    });

    it('falls back to all string inputs when all slots are removed', () => {
      // First project everything, then remove
      host.showLabel = host.showPrepend = host.showAppend = host.showValue = true;
      fixture.detectChanges();
      host.showLabel = host.showPrepend = host.showAppend = host.showValue = false;
      fixture.detectChanges();

      expect(readingBlock(fixture).textContent).toContain('PRE');
      expect(readingBlock(fixture).textContent).toContain('42');
      expect(readingBlock(fixture).textContent).toContain('POST');
      expect(readingLabel(fixture).textContent).toContain('fallback-label');
    });
  });
});
