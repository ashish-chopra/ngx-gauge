import { NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgxGauge} from './gauge';

@NgModule({
    imports: [CommonModule],
    declarations: [NgxGauge],
    exports: [NgxGauge]
})
export class NgxGaugeModule { }