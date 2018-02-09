import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  thresholdConfig = {
    '0': { color: '#ff0000' },
    '10': { color: '#ff5800' },
    '20': { color: '#ff8200' },
    '30': { color: '#ffa500' },
    '40': { color: '#ffc400' },
    '50': { color: '#ffe100' },
    '60': { color: '#ffff00' },
    '70': { color: '#b5d400' },
    '80': { color: '#6caa00' },
    '90': { color: '#008000' },
    '100': { color: '#00BFFF' }
  };

  formatValue = (value: number) => value > 0 ? value : `Neg ${value}`;
  appendValue = "%";

  _value: number = 0;
  get value(): number {
    return this._value;
  }
  set value(value: number) {
    this.appendValue = value > 0 ? "%" : "";
    this._value = value;
  }

  ngOnInit(): void {

    const INTERVAL: number = 3000;

    this.interval = setInterval(() => this.updateValue(), INTERVAL);
    this.updateValue();
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  interval: any;
  updateValue(): void {
    this.value = this.random(-50, 110);
  };

  private random(start: number, end: number) {
    return Math.floor(Math.random() * end) + start;
  }
}
