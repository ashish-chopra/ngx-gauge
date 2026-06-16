import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxGaugeModule } from '../../src/ngx-gauge.module';
import { NgxGauge, NgxGaugeMarkers, NgxGaugeThresholds } from '../../src/gauge/gauge';

// Defaults host: no input bindings, just the bare element
@Component({
  standalone: true,
  imports: [NgxGaugeModule],
  template: `<ngx-gauge #gauge></ngx-gauge>`,
})
class DefaultsHost {
  @ViewChild('gauge') gauge!: NgxGauge;
}

// Binding host: every input is two-way-ish via host fields, all typed as `any`
// so we can pass strings/null/undefined to exercise coercion paths.
@Component({
  standalone: true,
  imports: [NgxGaugeModule],
  template: `
    <ngx-gauge
      #gauge
      [size]="size"
      [margin]="margin"
      [min]="min"
      [max]="max"
      [value]="value"
      [thick]="thick"
      [type]="type"
      [cap]="cap"
      [animate]="animate"
      [duration]="duration"
      [label]="label"
      [append]="append"
      [prepend]="prepend"
      [foregroundColor]="foregroundColor"
      [backgroundColor]="backgroundColor"
      [thresholds]="thresholds"
      [markers]="markers"
      [aria-label]="ariaLabel"
      [aria-labelledby]="ariaLabelledby"
    ></ngx-gauge>
  `,
})
class BindingHost {
  @ViewChild('gauge') gauge!: NgxGauge;
  size: any = 200;
  margin: any = 0;
  min: any = 0;
  max: any = 100;
  value: any = 0;
  thick: any = 4;
  type: any = 'arch';
  cap: any = 'butt';
  animate: any = true;
  duration: any = 1200;
  label: any = '';
  append: any = '';
  prepend: any = '';
  foregroundColor: any = 'rgba(0, 150, 136, 1)';
  backgroundColor: any = 'rgba(0, 0, 0, 0.1)';
  thresholds: NgxGaugeThresholds = {};
  markers: NgxGaugeMarkers = {};
  ariaLabel: any = '';
  ariaLabelledby: any = null;
}

describe('NgxGauge inputs', () => {
  describe('defaults (no input bindings)', () => {
    let fixture: ComponentFixture<DefaultsHost>;
    let gauge: NgxGauge;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [DefaultsHost] });
      fixture = TestBed.createComponent(DefaultsHost);
      fixture.detectChanges();
      gauge = fixture.componentInstance.gauge;
    });

    it('size defaults to 200', () => {
      expect(gauge.size).toBe(200);
    });

    it('min defaults to 0', () => {
      expect(gauge.min).toBe(0);
    });

    it('max defaults to 100', () => {
      expect(gauge.max).toBe(100);
    });

    it('thick defaults to 4', () => {
      expect(gauge.thick).toBe(4);
    });

    it('type defaults to "arch"', () => {
      expect(gauge.type).toBe('arch');
    });

    it('cap defaults to "butt"', () => {
      expect(gauge.cap).toBe('butt');
    });

    it('animate defaults to true', () => {
      expect(gauge.animate).toBe(true);
    });

    it('value defaults to 0', () => {
      expect(gauge.value).toBe(0);
    });

    it('duration defaults to 1200', () => {
      expect(gauge.duration).toBe(1200);
    });

    it('margin defaults to 0', () => {
      expect(gauge.margin).toBe(0);
    });

    it('foregroundColor defaults to rgba(0, 150, 136, 1)', () => {
      expect(gauge.foregroundColor).toBe('rgba(0, 150, 136, 1)');
    });

    it('backgroundColor defaults to rgba(0, 0, 0, 0.1)', () => {
      expect(gauge.backgroundColor).toBe('rgba(0, 0, 0, 0.1)');
    });

    it('thresholds defaults to an empty record', () => {
      expect(Object.keys(gauge.thresholds)).toHaveLength(0);
    });

    it('markers defaults to an empty record', () => {
      expect(Object.keys(gauge.markers)).toHaveLength(0);
    });

    it('ariaLabel defaults to ""', () => {
      expect(gauge.ariaLabel).toBe('');
    });

    it('ariaLabelledby defaults to null', () => {
      expect(gauge.ariaLabelledby).toBeNull();
    });
  });

  describe('numeric coercion', () => {
    let fixture: ComponentFixture<BindingHost>;
    let host: BindingHost;
    let gauge: NgxGauge;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [BindingHost] });
      fixture = TestBed.createComponent(BindingHost);
      fixture.detectChanges();
      host = fixture.componentInstance;
      gauge = host.gauge;
    });

    it('coerces string "150" to number for size', () => {
      host.size = '150';
      fixture.detectChanges();
      expect(gauge.size).toBe(150);
    });

    it('coerces invalid size value to fallback 0', () => {
      host.size = 'abc';
      fixture.detectChanges();
      expect(gauge.size).toBe(0);
    });

    it('coerces null size to fallback 0', () => {
      host.size = null;
      fixture.detectChanges();
      expect(gauge.size).toBe(0);
    });

    it('coerces string "20" to number for margin', () => {
      host.margin = '20';
      fixture.detectChanges();
      expect(gauge.margin).toBe(20);
    });

    it('coerces string "-10" to number for min', () => {
      host.min = '-10';
      fixture.detectChanges();
      expect(gauge.min).toBe(-10);
    });

    it('coerces invalid min to fallback DEFAULTS.MIN (0)', () => {
      host.min = 'not-a-number';
      fixture.detectChanges();
      expect(gauge.min).toBe(0);
    });

    it('coerces string "250" to number for max', () => {
      host.max = '250';
      fixture.detectChanges();
      expect(gauge.max).toBe(250);
    });

    it('coerces invalid max to fallback DEFAULTS.MAX (100)', () => {
      host.max = 'not-a-number';
      fixture.detectChanges();
      expect(gauge.max).toBe(100);
    });

    it('coerces string "42" to number for value', () => {
      host.value = '42';
      fixture.detectChanges();
      expect(gauge.value).toBe(42);
    });

    it('coerces "3.14" to a float for value', () => {
      host.value = '3.14';
      fixture.detectChanges();
      expect(gauge.value).toBe(3.14);
    });

    it('coerces invalid value to fallback 0', () => {
      host.value = 'NaN-ish';
      fixture.detectChanges();
      expect(gauge.value).toBe(0);
    });
  });

  describe('boolean coercion (animate)', () => {
    let fixture: ComponentFixture<BindingHost>;
    let host: BindingHost;
    let gauge: NgxGauge;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [BindingHost] });
      fixture = TestBed.createComponent(BindingHost);
      fixture.detectChanges();
      host = fixture.componentInstance;
      gauge = host.gauge;
    });

    it('coerces string "false" to boolean false', () => {
      host.animate = 'false';
      fixture.detectChanges();
      expect(gauge.animate).toBe(false);
    });

    it('coerces empty string to boolean true', () => {
      host.animate = '';
      fixture.detectChanges();
      expect(gauge.animate).toBe(true);
    });

    it('coerces null to boolean false', () => {
      host.animate = null;
      fixture.detectChanges();
      expect(gauge.animate).toBe(false);
    });

    it('coerces undefined to boolean false', () => {
      host.animate = undefined;
      fixture.detectChanges();
      expect(gauge.animate).toBe(false);
    });

    it('passes through native boolean true', () => {
      host.animate = true;
      fixture.detectChanges();
      expect(gauge.animate).toBe(true);
    });

    it('passes through native boolean false', () => {
      host.animate = false;
      fixture.detectChanges();
      expect(gauge.animate).toBe(false);
    });
  });

  describe('string and color inputs', () => {
    let fixture: ComponentFixture<BindingHost>;
    let host: BindingHost;
    let gauge: NgxGauge;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [BindingHost] });
      fixture = TestBed.createComponent(BindingHost);
      fixture.detectChanges();
      host = fixture.componentInstance;
      gauge = host.gauge;
    });

    it('binds label without coercion', () => {
      host.label = 'Speed';
      fixture.detectChanges();
      expect(gauge.label).toBe('Speed');
    });

    it('binds prepend and append', () => {
      host.prepend = '$';
      host.append = ' USD';
      fixture.detectChanges();
      expect(gauge.prepend).toBe('$');
      expect(gauge.append).toBe(' USD');
    });

    it('binds foregroundColor', () => {
      host.foregroundColor = '#ff0000';
      fixture.detectChanges();
      expect(gauge.foregroundColor).toBe('#ff0000');
    });

    it('binds backgroundColor', () => {
      host.backgroundColor = 'transparent';
      fixture.detectChanges();
      expect(gauge.backgroundColor).toBe('transparent');
    });
  });

  describe('type and cap enum bindings', () => {
    let fixture: ComponentFixture<BindingHost>;
    let host: BindingHost;
    let gauge: NgxGauge;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [BindingHost] });
      fixture = TestBed.createComponent(BindingHost);
      fixture.detectChanges();
      host = fixture.componentInstance;
      gauge = host.gauge;
    });

    it('accepts type "full"', () => {
      host.type = 'full';
      fixture.detectChanges();
      expect(gauge.type).toBe('full');
    });

    it('accepts type "semi"', () => {
      host.type = 'semi';
      fixture.detectChanges();
      expect(gauge.type).toBe('semi');
    });

    it('accepts type "arch"', () => {
      host.type = 'arch';
      fixture.detectChanges();
      expect(gauge.type).toBe('arch');
    });

    it('accepts cap "round"', () => {
      host.cap = 'round';
      fixture.detectChanges();
      expect(gauge.cap).toBe('round');
    });

    it('accepts cap "butt"', () => {
      host.cap = 'butt';
      fixture.detectChanges();
      expect(gauge.cap).toBe('butt');
    });
  });

  describe('thresholds and markers object inputs', () => {
    let fixture: ComponentFixture<BindingHost>;
    let host: BindingHost;
    let gauge: NgxGauge;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [BindingHost] });
      fixture = TestBed.createComponent(BindingHost);
      fixture.detectChanges();
      host = fixture.componentInstance;
      gauge = host.gauge;
    });

    it('binds a thresholds record by reference', () => {
      const t: NgxGaugeThresholds = {
        '40': { color: 'orange' },
        '75': { color: 'red', bgOpacity: 0.2 },
      };
      host.thresholds = t;
      fixture.detectChanges();
      expect(gauge.thresholds).toBe(t);
      expect(gauge.thresholds['40'].color).toBe('orange');
      expect(gauge.thresholds['75'].bgOpacity).toBe(0.2);
    });

    it('binds a markers record by reference', () => {
      const m: NgxGaugeMarkers = {
        '25': { color: '#ccc', type: 'line', size: 8, label: '25 lbs' },
      };
      host.markers = m;
      fixture.detectChanges();
      expect(gauge.markers).toBe(m);
      expect(gauge.markers['25'].label).toBe('25 lbs');
    });
  });

  describe('host element bindings', () => {
    let fixture: ComponentFixture<BindingHost>;
    let host: BindingHost;
    let gaugeEl: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [BindingHost] });
      fixture = TestBed.createComponent(BindingHost);
      fixture.detectChanges();
      host = fixture.componentInstance;
      gaugeEl = fixture.nativeElement.querySelector('ngx-gauge');
    });

    it('host element has role="slider"', () => {
      expect(gaugeEl.getAttribute('role')).toBe('slider');
    });

    it('host element has aria-readonly="true"', () => {
      expect(gaugeEl.getAttribute('aria-readonly')).toBe('true');
    });

    it('host element has class .ngx-gauge-meter', () => {
      expect(gaugeEl.classList.contains('ngx-gauge-meter')).toBe(true);
    });

    it('aria-valuemin reflects min input', () => {
      host.min = 25;
      fixture.detectChanges();
      expect(gaugeEl.getAttribute('aria-valuemin')).toBe('25');
    });

    it('aria-valuemax reflects max input', () => {
      host.max = 250;
      fixture.detectChanges();
      expect(gaugeEl.getAttribute('aria-valuemax')).toBe('250');
    });

    it('aria-valuenow reflects value input', () => {
      host.value = 42;
      fixture.detectChanges();
      expect(gaugeEl.getAttribute('aria-valuenow')).toBe('42');
    });

    it('aria-label propagates from input to host attribute', () => {
      host.ariaLabel = 'Volume gauge';
      fixture.detectChanges();
      expect(gaugeEl.getAttribute('aria-label')).toBe('Volume gauge');
    });

    it('aria-labelledby propagates from input to host attribute', () => {
      host.ariaLabelledby = 'volume-heading';
      fixture.detectChanges();
      expect(gaugeEl.getAttribute('aria-labelledby')).toBe('volume-heading');
    });

    it('aria-labelledby is absent when not bound', () => {
      // Default is null → Angular omits the attribute
      expect(gaugeEl.hasAttribute('aria-labelledby')).toBe(false);
    });
  });
});
