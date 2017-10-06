# Para integrar WordPress con Ionic

```bash
npm install wp-api-angular --save
ionic g provider wpProvider
ionic g page PostPage
```

Para hacer uso del paquete Wp-api-angular tenemos que configurarlo para que pueda jugar con nuestra aplicación de Ionic. Por lo tanto, tenemos que exportar una función con la URL a nuestra propia página de WordPress. También necesitamos cargar algunas dependencias más (y nuestro propio provider creado WpProvider ) y usar nuestro especial WpApiLoaderFactorypara el WpApiModule.

Ahora vaya a su **src/app/app.module.ts** e inserte:

```javascript
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
```

Por supuesto esto utiliza actualmente la URL de Devdactic, así que asegúrese de cambiar esa URL a la suya. Si usted puede servir la aplicación ahora sin ningún problema, todo está bien configurado y podemos continuar con el uso de la biblioteca.

# Creación de un provider de WordPress

Podríamos utilizar la biblioteca directamente para nuestras llamadas, pero todavía prefiero poner la lógica en un proveedor adicional. Por lo tanto, envuelve nuestras llamadas a WordPress usando la biblioteca wp-api en nuestro proveedor creado.

Además, creamos 2 clases **Post** y **User** trazamos nuestros resultados de llamadas REST a objetos más amigables.

Dentro del constructor de nuestro proveedor también hacemos la lista de usuarios de WordPress para que podamos mostrar fácilmente un avatar para cada usuario en la lista de correos más tarde. De lo contrario, tendríamos que hacer la llamada para recuperar la información del usuario una y otra vez, por lo que nos ahorra algunas llamadas http.

Para obtener una lista de mensajes usamos la **getList** función que volverá como una matriz de objetos. Para cada uno de esos objetos creamos un nuevo **Post** objeto, y para obtener la imagen de cada post nos ponemos un poco extraño: Asignamos un Observable a la **media_url** propiedad que también utilizará el wp-api y cargará el enlace a la imagen.

Esto ayuda a crear fácilmente la vista más tarde, ya que sólo podemos utilizar la propiedad con la tubería de aync y nuestra imagen se mostrará, no más carga loca de cosas allí!

Ahora abra su **src/providers/wp/wp.ts** e inserte:

```javascript
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { WpApiPosts, WpApiMedia, WpApiUsers } from 'wp-api-angular';
import { Http, HttpModule } from '@angular/http';
 
export class Post {
  public media_url: Observable<string>;
  constructor(public authorId: number, public id: number, public title: string, public content: string, public excerpt: string, public date: string, public mediaId?: number) { }
}
 
export class User {
  constructor(public id: number, public name: string, public userImageUrl: string) { }
}

@Injectable()
export class WpProvider {

  users: User[];
  
   constructor(public wpApiPosts: WpApiPosts, public wpApiMedia: WpApiMedia, public wpApiUsers: WpApiUsers) {
     this.wpApiUsers.getList()
       .map(res => res.json())
       .subscribe(data => {
         this.users = [];
         for (let user of data) {
           let oneUser = new User(user[ 'id' ], user[ 'name' ], user[ 'avatar_urls' ][ '96' ]);
           this.users.push(oneUser);
         }
       })
   }

   getPosts(): Observable<Post[]> {
    return this.wpApiPosts.getList()
      .map(res => res.json())
      .map(data => {
        var posts = [];
        for (let post of data) {
          let onePost = new Post(post[ 'author' ], post[ 'id' ], post[ 'title' ][ 'rendered' ], post[ 'content' ][ 'rendered' ], post[ 'excerpt' ][ 'rendered' ], post[ 'date' ], post[ 'featured_media' ]);
          onePost.media_url = this.getMedia(onePost.mediaId);
          posts.push(onePost);
        }
        return posts;
      });
  }
 
  getMedia(id: number): Observable<string> {
    return this.wpApiMedia.get(id)
      .map(res => res.json())
      .map(data => {
        return data[ 'source_url' ];
      });
  }
 
  getUserImage(userId: number) {
    for (let usr of this.users) {
      if (usr.id === userId) {
        return usr.userImageUrl;
      }
    }
  }
 
  getUserName(userId: number) {
    for (let usr of this.users) {
      if (usr.id === userId) {
        return usr.name;
      }
    }
  }

}
```

Al cargar y llenar la matriz de usuarios dentro del constructor, podemos crear 2 funciones simples para buscar el usuario correcto por id dentro de esta matriz para obtener la imagen del usuario y el nombre de usuario.

Si desea cargar más atributos de una publicación, simplemente inspeccione el resultado de **getList()** y añada los de la clase Post. Por ejemplo usted podría agarrar las etiquetas o las categorías también, pero para el nuevo lo mantenemos simple y nos movemos encendido!

# Cargando nuestros datos de WordPress

Si queremos abrir una sola publicación, empujamos una nueva página en nuestra pila de navegación y pasamos el objeto de publicación a través de la navParams a nuestra siguiente página. Sólo estamos usando el nombre 'PostPage' como hacemos uso de la carga perezosa, que fue introducido con Ionic 3!

De lo contrario, continúe y abra su **src/pages/blog/blog.ts** e inserte:

```javascript
import { Component } from '@angular/core';
import { NavController, LoadingController, Loading } from 'ionic-angular';
import { WpProvider, Post } from '../../providers/wp/wp';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'page-blog',
  templateUrl: 'blog.html'
})
export class BlogPage {
  loader: Loading;
  posts: Observable<Post[]>;
 
  constructor(public navCtrl: NavController, public wpProvider: WpProvider, public loadingCtrl: LoadingController) {
    this.presentLoading();
    this.posts = this.wpProvider.getPosts();
    this.posts.subscribe(data => {
        this.loader.dismiss();
  });
  }
 
  getUserImage(id: number) {
    return this.wpProvider.getUserImage(id);
  }
 
  getUserName(id: number) {
    return this.wpProvider.getUserName(id);
  }
 
  openPost(post: Post) {
    this.navCtrl.push('PostPage', {post: post});
  }
 
  presentLoading() {
    this.loader = this.loadingCtrl.create({
      content: "Cargando..."
    });
    this.loader.present();
  }
}
```

El último paso para mostrar algo en nuestra aplicación es conectar la vista.
Prepare su vista dentro de **src/pages/blog/blog.html** e inserte:

```html
<ion-header>

  <ion-navbar color="primary">
    <ion-title>Blog ProfesionalHosting</ion-title>
  </ion-navbar>

</ion-header>


<ion-content>
  <ion-card *ngFor="let post of posts | async" (click)="openPost(post)" tappable>
    <img [src]="post.media_url | async">
    <ion-item>
      <ion-avatar item-left>
        <img [src]="getUserImage(post.authorId)">
      </ion-avatar>
      <h2>{{ getUserName(post.authorId) }}</h2>
    </ion-item>
    <ion-card-content>
      <ion-card-title>
        {{ post.title }}
      </ion-card-title>
      <div [innerHTML]="post.excerpt"></div>
    </ion-card-content>
  </ion-card>
</ion-content>
```

Nuestra aplicación ya está lista para ejecutarse, por lo que si la inicia, debe ver una lista de elementos publicitarios mostrados muy bien como en la imagen de abajo.

# Mostrando un solo mensaje de WordPress

La última pieza que falta es mostrar un post completo, pero ya hemos preparado todo para esto también. Si hacemos clic en una tarjeta, la siguiente página será empujada junto con el objeto de publicación.

Preparamos nuestro modulo dentro de **src/pages/post/post.module.ts** como abajo:

```javascript
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PostPage } from './post';

@NgModule({
  declarations: [
    PostPage,
  ],
  imports: [
    IonicPageModule.forChild(PostPage),
  ],
  exports: [
    PostPage
  ],
})
export class PostPageModule {}
```

Si todo esto es correcto, sólo tenemos que asignar el **navParams** valor a un objeto de publicación dentro de las páginas **src/pages/post/post.ts** así:

```javascript
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Post } from '../../providers/wp/wp';

@IonicPage()
@Component({
  selector: 'page-post',
  templateUrl: 'post.html',
})

export class PostPage {
  post: Post;
 
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.post = navParams.get('post');
  }
}
```

Finalmente, para mostrar los elementos del post usamos de nuevo la **innerHTML** sintaxis pero esta vez el contenido de nuestro objeto post. Continúe y termine la vista dentro de **src/pages/post/post.html** :

```javascript
<ion-header>
  <ion-navbar color="primary">
    <ion-title>{{ post.title }}</ion-title>
  </ion-navbar>
</ion-header>
 
<ion-content>
  <img [src]="post.media_url | async">
  <div [innerHTML]="post.content" padding></div>
</ion-content>
```

Ahora su propio pequeño cliente Ionic + WordPress está listo y se puede ampliar con todo tipo de características que te imagines!
