import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {PagedResult} from './PagedResult';

@Injectable({
  providedIn: 'root'
})
export class ProformaService {
  // private apiUrl = 'http://localhost:8081/proforma'; // Cambia si usas proxy
  private apiUrl = 'https://proformabackend-production.up.railway.app/proforma'; // Cambia si usas proxy

  constructor(private http: HttpClient) {}

  listPage(search: string = '', page: number = 0, size: number = 10): Observable<PagedResult<any>> {
    const params = new HttpParams()
      .set('search', search)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedResult<any>>(`${this.apiUrl}/page`, { params });
  }

  findById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  save(request: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  update(id: string, request: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


}
