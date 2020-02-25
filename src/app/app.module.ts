import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxGaugeModule } from 'projects/ngx-gauge/src/ngx-gauge.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxGaugeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
