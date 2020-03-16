import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NONE_TYPE } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class FetchService {
  private cache = new Object();
  constructor(private http: HttpClient) { }
  public getJson(url: string): Observable<any> {
    if (url in this.cache) {
      return this.cache[url];
    }
    const resp = this.http.get<any>(url);
    this.cache[url] = resp;
    return resp;
  }

  public postJson(url: string, data: any): Observable<any> {
    const resp = this.http.post<any>(url, data);
    return resp;
  }

  public getLocalStorage(key: string, defaultVal: any = null): any {
    const val = localStorage.getItem(key);
    // console.log({ key: val });
    if (val === null) { return defaultVal; }
    return JSON.parse(val);
  }
  public setLocalStorage(key: string, val: any) {
    // console.log({ key: val });
    localStorage.setItem(key, JSON.stringify(val));
  }
  public removeLocalStorage(key: string) {
    localStorage.removeItem(key);
  }

  public getVersionData(name: string): Observable<any> {
    let url = this.getStaticPath() + 'data/' + name;
    if (url in this.cache) {
      return this.cache[url];
    }
    const resp = this.http.get<any>(url);
    this.cache[url] = resp;
    return resp;
  }

  public getStaticPath() {
    if ('data_version' in window) {
      return '/static/aktools/' + window['data_version'] + '/';
    } else {
      return '/static/';
    }
  }
}
