import { Directive } from "@angular/core";

@Directive({
  selector: "ngx-gauge-append",
  exportAs: "ngxGaugeAppend"
})
export class NgxGaugeAppend {}

@Directive({
  selector: "ngx-gauge-prepend",
  exportAs: "ngxGaugePrepend"
})
export class NgxGaugePrepend {}

@Directive({
  selector: "ngx-gauge-value",
  exportAs: "ngxGaugeValue"
})
export class NgxGaugeValue {}

@Directive({
  selector: "ngx-gauge-label",
  exportAs: "ngxGaugeLabel"
})
export class NgxGaugeLabel {}
