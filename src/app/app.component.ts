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
  changeValue() {
    //nothing
  }

  ngOnInit() {
    setInterval(() => {
      this.currentValue = Math.floor(Math.random() * 100);
    }, this.time);
  }
}
