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

  // Test for issue #159 - Negative threshold backgrounds
  negativeTestValue: number = -50;
  negativeThresholds = {
    '-100': { color: '#ff0000', bgOpacity: 0.2 },  // Red background for -100 to -80
    '-80': { color: '#ff9800', bgOpacity: 0.2 },   // Orange background for -80 to -60
    '-60': { color: '#ffeb3b', bgOpacity: 0.2 },   // Yellow background for -60 to 0
    '0': { color: '#4caf50', bgOpacity: 0.2 },     // Green background for 0 to 60
    '60': { color: '#2196f3', bgOpacity: 0.2 },    // Blue background for 60 to 80
    '80': { color: '#9c27b0', bgOpacity: 0.2 }     // Purple background for 80 to 100
  };

  changeValue() {
    //nothing
  }

  changeNegativeValue() {
    // Cycle through values to test all threshold ranges
    this.negativeTestValue = Math.floor(Math.random() * 201) - 100; // Random value from -100 to 100
  }

  ngOnInit() {
    setInterval(() => {
      this.currentValue = Math.floor(Math.random() * 100);
    }, this.time);

    // Auto-cycle negative test value
    setInterval(() => {
      this.changeNegativeValue();
    }, 2000);
  }
}
