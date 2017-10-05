import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { SobremiPage } from '../pages/sobremi/sobremi';
import { BlogPage } from '../pages/blog/blog';
import { ContactoPage } from '../pages/contacto/contacto';
import { WpProvider } from '../providers/wp/wp';

import { HttpModule } from '@angular/http';
import { Http } from '@angular/http';

import { 
  WpApiModule,
  WpApiLoader,
  WpApiStaticLoader
} from 'wp-api-angular'

export function WpApiLoaderFactory(http) {
  return new WpApiStaticLoader(http, 'https://blog.profesionalhosting.com/wp-json/');
}

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    SobremiPage,
    BlogPage,
    ContactoPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    WpApiModule.forRoot({
      provide: WpApiLoader,
      useFactory: (WpApiLoaderFactory),
      deps: [Http]
    }),
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    SobremiPage,
    BlogPage,
    ContactoPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    WpProvider
  ]
})
export class AppModule {}
