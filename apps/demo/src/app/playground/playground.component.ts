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
  type: string = "semi";
  cap: string = "round";
  label: string = "Speed";
  prepend: string = '';
  append: any = 'km/hr';
  min: number = 0;
  max: number = 100;
  foregroundColor: string = '#009688';
  backgroundColor: string = '#ebebeb';

  enableMarkers: boolean = false;

  thresholdConfig = {
    '0': { color: 'green', bgOpacity: .2 },
    '40': { color: 'orange', bgOpacity: .2 },
    '75.5': { color: 'red', bgOpacity: .2 }
  };

  markerConfig = {
      "-10": { color: '#555', size: 8, label: '-10', type: 'line'},
      "0": { color: '#555', size: 8, label: '0', type: 'line'},
      "30": { color: '#555', size: 8, label: '30', type: 'line'},
      "70.5": { color: '#555', size: 8, label: '70.5', type: 'line'},
      "100": { color: '#555', size: 8, label: '100', type: 'line'},
  }

  onClick(e) {
    console.log(this.foregroundColor, this.backgroundColor);
    this.foregroundColor = 'red';
  }

}
