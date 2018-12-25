import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'demo';
  currentValue: number = 0;
  changeValue() {
    this.currentValue = parseFloat((Math.random() * 100).toFixed(2));
  }
}
