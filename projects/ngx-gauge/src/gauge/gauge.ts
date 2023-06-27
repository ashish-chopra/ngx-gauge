import {
    Component,
    Input,
    SimpleChanges,
    ViewEncapsulation,
    Renderer2,
    AfterViewInit,
    ElementRef,
    OnChanges,
    OnDestroy,
    ViewChild,
    ContentChild,
    OnInit
} from '@angular/core';
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
        'role': 'slider',
        'aria-readonly': 'true',
        '[class.ngx-gauge-meter]': 'true',
        '[attr.aria-valuemin]': 'min',
        '[attr.aria-valuemax]': 'max',
        '[attr.aria-valuenow]': 'value',
        '[attr.aria-label]': 'ariaLabel',
        '[attr.aria-labelledby]': 'ariaLabelledby'

    },
    encapsulation: ViewEncapsulation.None
})
export class NgxGauge implements AfterViewInit, OnChanges, OnDestroy, OnInit {

    @ViewChild('canvas', { static: true }) _canvas: ElementRef;
    @ViewChild('rLabel', { static: true }) _label: ElementRef;
    @ViewChild('reading', { static: true }) _reading: ElementRef;

    @ContentChild(NgxGaugeLabel) _labelChild: NgxGaugeLabel;
    @ContentChild(NgxGaugePrepend) _prependChild: NgxGaugePrepend;
    @ContentChild(NgxGaugeAppend) _appendChild: NgxGaugeAppend;
    @ContentChild(NgxGaugeValue) _valueDisplayChild: NgxGaugeValue;

    private _size: number = DEFAULTS.SIZE;
    private _min: number = DEFAULTS.MIN;
    private _max: number = DEFAULTS.MAX;
    private _animate: boolean = true;
    private _margin: number = 0;

    private _initialized: boolean = false;
    private _context: CanvasRenderingContext2D;
    private _animationRequestID: number = 0;

    @Input('aria-label') ariaLabel: string = '';

    @Input('aria-labelledby') ariaLabelledby: string | null = null;

    @Input()
    get size(): number { return this._size; }
    set size(value: number) {
        this._size = coerceNumberProperty(value);
    }

    @Input()
    get margin(): number { return this._margin; }
    set margin(value: number) {
        this._margin = coerceNumberProperty(value);
    }    

    @Input()
    get min(): number { return this._min; }
    set min(value: number) {
        this._min = coerceNumberProperty(value, DEFAULTS.MIN);
    }
    @Input()
    get animate(): boolean { return this._animate; }
    set animate(value) {
        this._animate = coerceBooleanProperty(value);
    }

    @Input()
    get max(): number { return this._max; }
    set max(value: number) {
        this._max = coerceNumberProperty(value, DEFAULTS.MAX);
    }

    @Input() type: NgxGaugeType = DEFAULTS.TYPE as NgxGaugeType;

    @Input() cap: NgxGaugeCap = DEFAULTS.CAP as NgxGaugeCap;

    @Input() thick: number = DEFAULTS.THICK;

    @Input() label: string;

    @Input() append: string;

    @Input() prepend: string;

    @Input() foregroundColor: string = DEFAULTS.FOREGROUND_COLOR;

    @Input() backgroundColor: string = DEFAULTS.BACKGROUND_COLOR;

    // { "40" : { color: "green", bgOpacity: .2 }, ... }
    @Input() thresholds: Object = Object.create(null);

    // { "25": { color: '#ccc', type: 'line', size: 8, label: "25 lbs" }, ... }
    @Input() markers: Object = Object.create(null);
    
    private _value: number = 0;

    @Input()
    get value() { return this._value; }
    set value(val: number) {
        this._value = coerceNumberProperty(val);
    }

    @Input() duration: number = 1200;

    /** keep track of previous value in case of negative numbers or mistypes */
    private _oldChangeVal: number;

    constructor(private _elementRef: ElementRef, private _renderer: Renderer2) { }

    ngOnInit() {
        // if markers are to be added, but no margin specified then here we add 10 px.
        if (this.markers && Object.keys(this.markers).length > 0 && !this._margin) this._margin = 10;
    }

    ngOnChanges(changes: SimpleChanges) {
        const isCanvasPropertyChanged = changes['thick'] || changes['type'] || changes['cap'] || changes['size'];
        const isDataChanged = changes['value'] || changes['min'] || changes['max'];

        if (this._initialized) {
            if (isDataChanged) {
                let nv;
                if (changes['value']) {
                    nv = Number(changes['value'].currentValue);
                    nv = isNaN(nv) ? 0 : nv;
                    const prevVal = Number(changes['value'].previousValue);
                    this._oldChangeVal = isNaN(prevVal) ? this._oldChangeVal : prevVal;
                }
                this._update(nv, this._oldChangeVal);
            }
            if (isCanvasPropertyChanged) {
                this._destroy();
                this._init();
            }
        }
    }

    private _updateSize() {
        this._renderer.setStyle(this._elementRef.nativeElement, 'width', cssUnit(this._getWidth()));
        this._renderer.setStyle(this._elementRef.nativeElement, 'height', cssUnit(this._getCanvasHeight()));
        this._canvas.nativeElement.width = this._getWidth();
        this._canvas.nativeElement.height = this._getCanvasHeight();
        this._renderer.setStyle(this._label.nativeElement,
            'transform', 'translateY(' + (this.size / 3 * 2 - this.size / 13 / 4) + 'px)');
        this._renderer.setStyle(this._reading.nativeElement,
            'transform', 'translateY(' + (this.size / 2 - this.size * 0.22 / 2) + 'px)');
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
        let head, tail, start, end;
        if (type == 'semi') {
            head = Math.PI;
            tail = 2 * Math.PI;
            start = 180;
            end = 360;
        } else if (type == 'full') {
            head = 1.5 * Math.PI;
            tail = 3.5 * Math.PI;
            start = 270;
            end = start + 360;
        } else if (type === 'arch') {
            head = 0.8 * Math.PI;
            tail = 2.2 * Math.PI;
            start = 180 - (0.2 * 180);
            end = 360 + (0.2 * 180);
        }
        return { head, tail, start, end };
    }

    private _drawShell(start: number, middle: number, tail: number, color: string) {
        let center = this._getCenter(),
            radius = this._getRadius();

        if (this._initialized) {
            this._clear();
            this._drawMarkersAndTicks();

            let ranges = this._getBackgroundColorRanges();

            this._context.lineWidth = this.thick;
            
            if (ranges && ranges.length > 0) {
                // if background color is not specified then use default background, unless opacity is provided in which case use the color
                // and opactity against color, to form the background color.
                this._context.lineCap = 'butt'
                for(let i = 0; i < ranges.length; ++i) {
                    let r = ranges[i];
                    this._context.beginPath();
                    this._context.strokeStyle = r.backgroundColor ? r.backgroundColor : (r.bgOpacity) ? r.color : this.backgroundColor;
                    if (r.bgOpacity !== undefined && r.bgOpacity !== null) {
                        this._context.globalAlpha = r.bgOpacity;
                    }
                    this._context.arc(center.x, center.y, radius, this._getDisplacement(r.start),this._getDisplacement(r.end), false);
                    this._context.stroke();         
                    this._context.globalAlpha = 1;                    
                }
            } else {
                this._context.lineCap = this.cap;
                this._context.beginPath();
                this._context.strokeStyle = this.backgroundColor;
                this._context.arc(center.x, center.y, radius, start, tail, false);
                this._context.stroke();
            }
            this._drawFill(start, middle, tail, color);
        }
    }

    private _drawFill(start: number, middle: number, tail: number, color: string) {
        let center = this._getCenter(),
            radius = this._getRadius();

        this._context.lineCap = this.cap;
        this._context.lineWidth = this.thick;            

        middle = Math.max(middle, start); // never below 0%
        middle = Math.min(middle, tail); // never exceed 100%

        this._context.lineCap = this.cap;
        this._context.lineWidth = this.thick;

        this._context.beginPath();
        this._context.strokeStyle = color;
        this._context.arc(center.x, center.y, radius, start, middle, false);
        this._context.stroke();

    }

    private _addMarker(angle,color,label?,type?,len?,font?) {

        var rad = angle * Math.PI / 180; 

        let offset = 2;

        if (!len) len = 8;

        if (!type) type = 'line';

        let center = this._getCenter(),
            radius = this._getRadius();

        let x =  (radius + this.thick/2 + offset) * Math.cos(rad) + center.x;
        let y =  (radius + this.thick/2 + offset) * Math.sin(rad) + center.y;    
        let x2 = (radius + this.thick/2 + offset + len) * Math.cos(rad) + center.x;
        let y2= (radius + this.thick/2 + offset + len) * Math.sin(rad) + center.y;
        
        if (type == 'triangle') {

            //Draw the triangle marker
            this._context.beginPath();
            this._context.strokeStyle = color;
            this._context.moveTo(x,y);

            this._context.lineWidth = 1;

            let a2 = angle - 45;
            let a3 = angle + 45;

            if (a2 < 0) a2 += 360;
            if (a2 > 360) a2 -= 360;

            if (a3 < 0) a3 += 360;
            if (a3 > 360) a3 -= 360;

            let rad2 = a2 * Math.PI / 180;  
            let x3 =  len * Math.cos(rad2) + x;
            let y3 =  len * Math.sin(rad2) + y;
            this._context.lineTo(x3,y3);

            let rad3 = a3 * Math.PI / 180;  
            let x4 =  len * Math.cos(rad3) + x;
            let y4 =  len * Math.sin(rad3) + y;

            this._context.lineTo(x4,y4);
            this._context.lineTo(x,y);

            this._context.closePath();
            this._context.stroke();

            this._context.fillStyle = color;
            this._context.fill();

        } else { //line
            this._context.beginPath();
            this._context.lineWidth = .5;
            this._context.strokeStyle = color;
     
            this._context.moveTo(x,y);
            this._context.lineTo(x2,y2);
    
            this._context.closePath();
            this._context.stroke();
        }

        if (label) {
            this._context.save();
            this._context.translate(x2, y2);
            this._context.rotate((angle + 90) * (Math.PI / 180));
            this._context.textAlign = "center";
            this._context.font = (font) ? font : '13px Arial';
            this._context.fillText(label,0,-3);
            this._context.restore();
        }

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

    // canvas height will be shorter for type 'semi' and 'arch'
    private _getCanvasHeight() {
        return (this.type == 'arch' || this.type == 'semi')
            ? 0.85 * this._getHeight()
            : this._getHeight();
    }

    private _getRadius() {
        const center = this._getCenter();
        var rad = center.x - this.thick;
        if (this._margin > 0) rad -= this._margin;
        return rad;
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
        this._create();
    }

    private _destroy() {
        if (this._animationRequestID) {
            window.cancelAnimationFrame(this._animationRequestID);
            this._animationRequestID = 0;
        }
        this._clear();
        this._context = null;
        this._initialized = false;
    }

    private _getForegroundColorByRange(value) {

        const thresh = this._getThresholdMatchForValue(value);
        return thresh && thresh.color ? thresh.color : this.foregroundColor;
    }

    private _getThresholdMatchForValue(value) {
        const match = Object.keys(this.thresholds)
            .filter(function (item) { return isNumber(item) && Number(item) <= value })
            .sort((a, b) => Number(a) - Number(b))
            .reverse()[0];

        if (match !== undefined) {
            const thresh = this.thresholds[match];
            const t = {
                color:thresh.color,
                backgroundColor:thresh.backgroundColor,
                bgOpacity: thresh.bgOpacity,
                start:Number(match),
                end:this._getNextThreshold(Number(match))
            };
            return t;
        }
    }

    private _getNextThreshold(value) :number {
        const match = Object.keys(this.thresholds)
            .filter(function (item) { return isNumber(item) && Number(item) > value })
            .sort((a, b) => Number(a) - Number(b)) 

        if (match && match[0] !== undefined) {
            return Number(match[0]);
        }
        else {
            return this.max;
        }           
    }

    private _getBackgroundColorRanges() {

        let i = 0,ranges = [];
        do {
            let thresh = this._getThresholdMatchForValue(i);
            if (thresh) {
                ranges.push({
                    start:thresh.start,
                    end:thresh.end,
                    color: thresh.color,
                    backgroundColor: thresh.backgroundColor,
                    bgOpacity: thresh.bgOpacity
                });
                i = thresh.end;
                if (i >= this.max) break;
            }
            else break;
        } while(true);

        return ranges;
    }
    private _getDisplacement(v:number) {
        let  type = this.type,
            bounds = this._getBounds(type),
            min = this.min,
            max = this.max,
            start = bounds.head,
            value = clamp(v, this.min, this.max),
            unit = (bounds.tail - bounds.head) / (max - min),
            displacement = unit * (value - min);
        
        return start + displacement;
            
    }

    private _create(nv?: number, ov?: number) {
        const self = this;
        const type = this.type;
        const bounds = this._getBounds(type);
        const duration = this.duration;
        const min = this.min;
        const max = this.max;
        const value = clamp(this.value, min, max);
        const start = bounds.head;
        const unit = (bounds.tail - bounds.head) / (max - min);
        let displacement = unit * (value - min);
        const tail = bounds.tail;
        const color = this._getForegroundColorByRange(value);
        let startTime;

        if (self._animationRequestID) {
            window.cancelAnimationFrame(self._animationRequestID);
        }

        const animate = (timestamp: number) => {
            timestamp = timestamp || new Date().getTime();
            const runtime = timestamp - startTime;
            const progress = Math.min(runtime / duration, 1);
            const previousProgress = ov ? (ov - min) * unit : 0;
            const middle = start + previousProgress + displacement * progress;
            self._drawShell(start, middle, tail, color);
            if (self._animationRequestID && (runtime < duration)) {
                self._animationRequestID = window.requestAnimationFrame((ts) => animate(ts));
            } else {
                window.cancelAnimationFrame(self._animationRequestID);
            }
        };

        if (this._animate) {
            if (nv !== undefined && ov !== undefined && ov !== 0) {
                displacement = unit * nv - unit * ov;
            }
            self._animationRequestID = window.requestAnimationFrame((timestamp) => {
                startTime = timestamp || new Date().getTime();
                animate(startTime);
            });
        } else {
            self._drawShell(start, start + displacement, tail, color);
        }
    }

    private _drawMarkersAndTicks() {
        /*
         * example:
        this.markers = {
            '-10': {
                color: '#555',
                size: 5,
                label: '-10',
                font: '11px verdana',
                type: 'line',
            },
            '10': {
                color: '#555',
                size: 5,
                label: '10',
                font: '11px verdana',
                type: 'line',
            },
            '20': {
                color: '#555',
                size: 5,
                label: '20',
                type: 'line',
            },
        };
        */
        if (this.markers) {
            const bounds = this._getBounds(this.type);
            const degrees = (bounds.end - bounds.start);
            const perD =  degrees / (this.max - this.min);
            for (const mv in this.markers) {
                const n = Number(mv) - this.min;
                const angle = bounds.start + n * perD;
                const m = this.markers[mv];
                this._addMarker(angle,m.color,m.label,m.type,m.size,m.font);
            }
        }
    }

    private _update(nv: number, ov: number) {
        this._clear();
        this._create(nv, ov);
    }

}
