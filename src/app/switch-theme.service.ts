import { Injectable, RendererFactory2, Renderer2, Inject } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})

// Copied and modified from https://medium.com/better-programming/angular-multiple-themes-without-killing-bundle-size-with-material-or-not-5a80849b6b34

export class SwitchThemeService {
  private _theme: BehaviorSubject<string> = new BehaviorSubject("light");

  private _renderer: Renderer2;
  private head: HTMLElement;
  private themeLinks: HTMLElement[] = [];

  theme$: Observable<string>;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) document: Document
  ) {
    this.head = document.head;
    this._renderer = rendererFactory.createRenderer(null, null);
    this.theme$ = this._theme;
    this.theme$.subscribe(async (target) => {
      let cssFilename = target + ".css";
      if ('data_version' in window) {
        cssFilename = '/static/aktools/' + window['data_version'] + '/css/' + cssFilename;
      }
      await this.loadCss(cssFilename);
      if (this.themeLinks.length == 2)
        this._renderer.removeChild(this.head, this.themeLinks.shift());
    })
  }

  setTheme(name: string) {
    this._theme.next(name);
  }

  private async loadCss(filename: string) {
    return new Promise(resolve => {
      const linkEl: HTMLElement = this._renderer.createElement('link');
      this._renderer.setAttribute(linkEl, 'rel', 'stylesheet');
      this._renderer.setAttribute(linkEl, 'type', 'text/css');
      this._renderer.setAttribute(linkEl, 'href', filename);
      this._renderer.setProperty(linkEl, 'onload', resolve);
      this._renderer.appendChild(this.head, linkEl);
      this.themeLinks = [...this.themeLinks, linkEl];
    })
  }
}
