import { Directive } from "@angular/core";

@Directive({
    selector: "ngx-gauge-append",
    exportAs: "ngxGaugeAppend",
    standalone: false
})
export class NgxGaugeAppend {}

@Directive({
    selector: "ngx-gauge-prepend",
    exportAs: "ngxGaugePrepend",
    standalone: false
})
export class NgxGaugePrepend {}

@Directive({
    selector: "ngx-gauge-value",
    exportAs: "ngxGaugeValue",
    standalone: false
})
export class NgxGaugeValue {}

@Directive({
    selector: "ngx-gauge-label",
    exportAs: "ngxGaugeLabel",
    standalone: false
})
export class NgxGaugeLabel {}
