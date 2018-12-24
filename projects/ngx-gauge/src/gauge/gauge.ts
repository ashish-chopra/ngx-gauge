import {
    Component,
    Input,
    SimpleChanges,
    ViewEncapsulation,
    Renderer,
    AfterViewInit,
    ElementRef,
    OnChanges,
    OnDestroy,
    ViewChild, 
    ContentChild
} from '@angular/core';
import { NgxGaugeError } from './gauge-error';
import {
    clamp,
    coerceBooleanProperty,
    coerceNumberProperty,
    cssUnit,
    isNumber
} from '../common/util';
import { NgxGaugeLabel, NgxGaugeValue, NgxGaugePrepend, NgxGaugeAppend } from './gauge-directives';

const DEFAULTS = {
    MIN: 0,
    MAX: 100,
    TYPE: 'arch',
    THICK: 4,
    FOREGROUND_COLOR: 'rgba(0, 150, 136, 1)',
    BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.1)',
    CAP: 'butt',
    SIZE: 200
};

export type NgxGaugeType = 'full' | 'arch' | 'semi';
export type NgxGaugeCap = 'round' | 'butt';

@Component({
    selector: 'ngx-gauge',
    templateUrl: 'gauge.html',
    styleUrls: ['gauge.css'],
    host: {
        'role': 'meter',
        '[class.ngx-gauge-meter]': 'true',
        '[attr.aria-valuemin]': 'min',
        '[attr.aria-valuemax]': 'max',
        '[attr.aria-valuenow]': 'value'
    },
    encapsulation: ViewEncapsulation.None
})
export class NgxGauge implements AfterViewInit, OnChanges, OnDestroy {

    @ViewChild('canvas') _canvas: ElementRef;
    
    @ContentChild(NgxGaugeLabel) _labelChild: NgxGaugeLabel;
    @ContentChild(NgxGaugePrepend) _prependChild: NgxGaugePrepend;
    @ContentChild(NgxGaugeAppend) _appendChild: NgxGaugeAppend;
    @ContentChild(NgxGaugeValue) _valueDisplayChild: NgxGaugeValue;

    private _size: number = DEFAULTS.SIZE;
    private _min: number = DEFAULTS.MIN;
    private _max: number = DEFAULTS.MAX;

    private _initialized: boolean = false;
    private _context: CanvasRenderingContext2D;
    private _animationRequestID: number = 0;

    @Input()
    get size(): number { return this._size; }
    set size(value: number) {
        this._size = coerceNumberProperty(value);
    }

    @Input()
    get min(): number { return this._min; }
    set min(value: number) {
        this._min = coerceNumberProperty(value, DEFAULTS.MIN);
    }

    @Input() max: number = DEFAULTS.MAX;

    @Input() type: NgxGaugeType = DEFAULTS.TYPE as NgxGaugeType;

    @Input() cap: NgxGaugeCap = DEFAULTS.CAP as NgxGaugeCap;

    @Input() thick: number = DEFAULTS.THICK;

    @Input() label: string;

    @Input() append: string;

    @Input() prepend: string;

    @Input() foregroundColor: string = DEFAULTS.FOREGROUND_COLOR;

    @Input() backgroundColor: string = DEFAULTS.BACKGROUND_COLOR;

    @Input() thresholds: Object = Object.create(null);

    private _value: number = 0;

    @Input()
    get value() { return this._value; }
    set value(val: number) {
        this._value = coerceNumberProperty(val);
    }

    @Input() duration: number = 1200;

    constructor(private _elementRef: ElementRef, private _renderer: Renderer) { }

    ngOnChanges(changes: SimpleChanges) {
        const isTextChanged = changes['label'] || changes['append'] || changes['prepend'];
        const isDataChanged = changes['value'] || changes['min'] || changes['max'];

        if (this._initialized) {
            if (isDataChanged) {
                let nv, ov;
                if (changes['value']) {
                    nv = changes['value'].currentValue;
                    ov = changes['value'].previousValue;
                }
                this._update(nv, ov);
            } else if (!isTextChanged) {
                this._destroy();
                this._init();
            }
        }
    }

    private _updateSize() {
        this._renderer.setElementStyle(this._elementRef.nativeElement, 'width', cssUnit(this._size));
        this._renderer.setElementStyle(this._elementRef.nativeElement, 'height', cssUnit(this._size));
    }

    ngAfterViewInit() {
        if (this._canvas) {
            this._init();
        }
    }

    ngOnDestroy() {
        this._destroy();
    }

    private _getBounds(type: NgxGaugeType) {
        let head, tail;
        if (type == 'semi') {
            head = Math.PI;
            tail = 2 * Math.PI;
        } else if (type == 'full') {
            head = 1.5 * Math.PI;
            tail = 3.5 * Math.PI;
        } else if (type === 'arch') {
            head = 0.8 * Math.PI;
            tail = 2.2 * Math.PI;
        }
        return { head, tail };
    }

    private _drawShell(start: number, middle: number, tail: number, color: string) {
        let center = this._getCenter(),
            radius = this._getRadius();

        middle = Math.max(middle, start); // never below 0%
        middle = Math.min(middle, tail); // never exceed 100%

        this._clear();
        this._context.beginPath();
        this._context.strokeStyle = this.backgroundColor;
        this._context.arc(center.x, center.y, radius, middle, tail, false);
        this._context.stroke();

        this._context.beginPath();
        this._context.strokeStyle = color;
        this._context.arc(center.x, center.y, radius, start, middle, false);
        this._context.stroke();

    }

    private _clear() {
        this._context.clearRect(0, 0, this._getWidth(), this._getHeight());
    }

    private _getWidth() {
        return this.size;
    }

    private _getHeight() {
        return this.size;
    }

    private _getRadius() {
        var center = this._getCenter();
        return center.x - this.thick;
    }

    private _getCenter() {
        var x = this._getWidth() / 2,
            y = this._getHeight() / 2;
        return { x, y };
    }

    private _init() {
        this._context = (this._canvas.nativeElement as HTMLCanvasElement).getContext('2d');
        this._initialized = true;
        this._updateSize();
        this._setupStyles();
        this._create();
    }

    private _destroy() {
        if (this._animationRequestID) {
            window.cancelAnimationFrame(this._animationRequestID);
            this._animationRequestID = 0;
        }
        this._clear();
        this._context = null;
    }

    private _setupStyles() {
        this._context.canvas.width = this.size;
        this._context.canvas.height = this.size;
        this._context.lineCap = this.cap;
        this._context.lineWidth = this.thick;
    }

    private _getForegroundColorByRange(value) {

        const match = Object.keys(this.thresholds)
            .filter(function (item) { return isNumber(item) && Number(item) <= value })
            .sort((a, b) => Number(a) - Number(b))
            .reverse()[0];

        return match !== undefined
            ? this.thresholds[match].color || this.foregroundColor
            : this.foregroundColor;
    }

    private _create(nv?: number, ov?: number) {
        let self = this,
            type = this.type,
            bounds = this._getBounds(type),
            duration = this.duration,
            min = this.min,
            max = this.max,
            value = clamp(this.value, this.min, this.max),
            start = bounds.head,
            unit = (bounds.tail - bounds.head) / (max - min),
            displacement = unit * (value - min),
            tail = bounds.tail,
            color = this._getForegroundColorByRange(value),
            startTime;

        if (nv != undefined && ov != undefined) {
            displacement = unit * nv - unit * ov;
        }
        function animate(timestamp) {
            timestamp = timestamp || new Date().getTime();
            let runtime = timestamp - startTime;
            let progress = Math.min(runtime / duration, 1);
            let previousProgress = ov ? ov * unit : 0;
            let middle = start + previousProgress + displacement * progress;

            self._drawShell(start, middle, tail, color);
            if (self._animationRequestID && (runtime < duration)) {
                self._animationRequestID = window.requestAnimationFrame((timestamp) => animate(timestamp));
            } else {
                window.cancelAnimationFrame(self._animationRequestID);
            }
        }

        self._animationRequestID = window.requestAnimationFrame((timestamp) => {
            startTime = timestamp || new Date().getTime();
            animate(timestamp);
        });
    }

    private _update(nv: number, ov: number) {
        this._clear();
        this._create(nv, ov);
    }

}