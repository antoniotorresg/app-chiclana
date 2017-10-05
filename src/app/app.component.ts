import { Component, ViewChild } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { SobremiPage } from '../pages/sobremi/sobremi';
import { BlogPage } from '../pages/blog/blog';
import { ContactoPage } from '../pages/contacto/contacto';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {

  @ViewChild('NAV') nav: NavController
  public rootPage: any;
  public pages: Array<{ titulo: string, component: any, icon: string }>; 

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen) {

    this.rootPage = HomePage;
    this.pages = [
      { titulo: "Inicio", component: HomePage, icon: "home" },
      { titulo: "Sobre Mi", component: SobremiPage, icon: "person" },
      { titulo: "Blog", component: BlogPage, icon: "logo-wordpress" },
      { titulo: "Contacto", component: ContactoPage, icon: "mail" },
    ];

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  goToPage(page){
    this.nav.push(page);
  }
}

