import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxGauge } from './gauge/gauge';
import { NgxGaugeLabel, NgxGaugeValue, NgxGaugePrepend, NgxGaugeAppend } from './gauge/gauge-directives';

@NgModule({
  imports: [CommonModule],
  declarations: [NgxGauge, NgxGaugeAppend, NgxGaugePrepend, NgxGaugeValue, NgxGaugeLabel],
  exports: [NgxGauge, NgxGaugeAppend, NgxGaugePrepend, NgxGaugeValue, NgxGaugeLabel]
})
export class NgxGaugeModule { }