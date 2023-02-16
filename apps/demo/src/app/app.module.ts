import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';
import { GettingStartedComponent } from './getting-started/getting-started.component';
import { DocumentationComponent } from './documentation/documentation.component';
import { NgxGaugeModule } from 'ngx-gauge';
import { PlaygroundComponent } from './playground/playground.component';
import { DemosComponent } from './demos/demos.component';

import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { FormsModule } from '@angular/forms';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import {MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';


@NgModule({
  declarations: [
    AppComponent,
    GettingStartedComponent,
    DocumentationComponent,
    PlaygroundComponent,
    DemosComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule, 
    NgxGaugeModule,
    HighlightModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule, 
    MatToolbarModule,
    MatSelectModule, 
    MatSliderModule,
    MatSlideToggleModule, 
    MatCardModule,
    MatTabsModule
  ],
  providers: [
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        lineNumbersLoader: () => import('highlightjs-line-numbers.js'),
        languages: {
          typescript: () => import('highlight.js/lib/languages/typescript'),
          css: () => import('highlight.js/lib/languages/css'),
          xml: () => import('highlight.js/lib/languages/xml'),
          bash: () => import('highlight.js/lib/languages/bash')
        }
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
