import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxGaugeModule } from '../../src/ngx-gauge.module';
import {
  NgxGaugeAppend,
  NgxGaugeLabel,
  NgxGaugePrepend,
  NgxGaugeValue,
} from '../../src/gauge/gauge-directives';

@Component({
  standalone: true,
  imports: [NgxGaugeModule],
  template: `
    <ngx-gauge-append #appendRef="ngxGaugeAppend">a</ngx-gauge-append>
    <ngx-gauge-prepend #prependRef="ngxGaugePrepend">p</ngx-gauge-prepend>
    <ngx-gauge-value #valueRef="ngxGaugeValue">v</ngx-gauge-value>
    <ngx-gauge-label #labelRef="ngxGaugeLabel">l</ngx-gauge-label>
  `,
})
class HostComponent {
  @ViewChild('appendRef') append!: NgxGaugeAppend;
  @ViewChild('prependRef') prepend!: NgxGaugePrepend;
  @ViewChild('valueRef') value!: NgxGaugeValue;
  @ViewChild('labelRef') label!: NgxGaugeLabel;
}

describe('gauge directives', () => {
  describe('direct instantiation', () => {
    it('NgxGaugeAppend constructs', () => {
      expect(new NgxGaugeAppend()).toBeDefined();
    });

    it('NgxGaugePrepend constructs', () => {
      expect(new NgxGaugePrepend()).toBeDefined();
    });

    it('NgxGaugeValue constructs', () => {
      expect(new NgxGaugeValue()).toBeDefined();
    });

    it('NgxGaugeLabel constructs', () => {
      expect(new NgxGaugeLabel()).toBeDefined();
    });
  });

  describe('selector + exportAs (TestBed)', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HostComponent],
      });
      fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      host = fixture.componentInstance;
    });

    it('matches <ngx-gauge-append> and resolves exportAs="ngxGaugeAppend"', () => {
      expect(host.append).toBeInstanceOf(NgxGaugeAppend);
    });

    it('matches <ngx-gauge-prepend> and resolves exportAs="ngxGaugePrepend"', () => {
      expect(host.prepend).toBeInstanceOf(NgxGaugePrepend);
    });

    it('matches <ngx-gauge-value> and resolves exportAs="ngxGaugeValue"', () => {
      expect(host.value).toBeInstanceOf(NgxGaugeValue);
    });

    it('matches <ngx-gauge-label> and resolves exportAs="ngxGaugeLabel"', () => {
      expect(host.label).toBeInstanceOf(NgxGaugeLabel);
    });

    it('renders projected text content inside each directive host element', () => {
      const root: HTMLElement = fixture.nativeElement;
      expect(root.querySelector('ngx-gauge-append')?.textContent?.trim()).toBe('a');
      expect(root.querySelector('ngx-gauge-prepend')?.textContent?.trim()).toBe('p');
      expect(root.querySelector('ngx-gauge-value')?.textContent?.trim()).toBe('v');
      expect(root.querySelector('ngx-gauge-label')?.textContent?.trim()).toBe('l');
    });
  });
});
