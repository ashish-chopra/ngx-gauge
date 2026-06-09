/*
 * Public APIs of ngx-gauge
 */

export * from './ngx-gauge.module';
export {
    NgxGauge,
    NgxGaugeType,
    NgxGaugeCap,
    NgxGaugeThreshold,
    NgxGaugeThresholds,
    NgxGaugeMarker,
    NgxGaugeMarkers
} from './gauge/gauge';
export { NgxGaugeAppend, NgxGaugeLabel, NgxGaugePrepend, NgxGaugeValue } from './gauge/gauge-directives';
