import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'demo';
  currentValue: number = 0;
  time = 700;

  thresholds = {
    '0': { 
      color: '#cc0000',
      fallbackColor: '#ff9999'
    },
    '25': { 
      color: '#ffa500',
      fallbackColor: '#ffc966'
    },
    '50': { 
      color: '#e5e500',
      fallbackColor: '#ffffe5' 
    },
    '75': { 
      color: '#006600',
      fallbackColor: '#99cc99'
    }
  };
  changeValue(value: number) {
    this.currentValue = value;
    console.log(this.currentValue);
  }

  ngOnInit() {
    this.currentValue = 10;
    // setInterval(() => {
    //   this.currentValue = Math.floor(Math.random() * 100);
    // }, this.time);
  }
}
