import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.css']
})
export class PlaygroundComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  enableThresholds: boolean = false;
  value: number = 28.3;
  thick: number = 20;
  size: number = 300;
  type: any = "semi";
  cap: any = "round";
  label: string = "Speed";
  prepend: any = '';
  append: any = 'km/hr';
  min: number = 0;
  max: number = 100;
  foregroundColor: string = '#009688';
  backgroundColor: string = '#ebebeb';

  thresholdConfig = {
    '0': { color: 'green' },
    '40': { color: 'orange' },
    '75.5': { color: 'red' }
  };

  onClick(e) {
    console.log(this.foregroundColor, this.backgroundColor);
    this.foregroundColor = 'red';
  }

}
