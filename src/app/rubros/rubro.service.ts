import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface NaturalezaMovimiento {
  id: number;
  codigo: string;
  descripcion: string;
}

export interface Rubro {
  id: number;
  nombre: string;
  naturaleza: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RubroRequestDto {
  naturalezaMovimiento_id: number | null;
  nombre: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RubroService {
  private readonly baseUrl = '/api/v1';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<Rubro[]>> {
    return this.http.get<ApiResponse<Rubro[]>>(`${this.baseUrl}/rubro`);
  }

  getNaturalezasMovimiento(): Observable<ApiResponse<NaturalezaMovimiento[]>> {
    return this.http.get<ApiResponse<NaturalezaMovimiento[]>>(
      `${this.baseUrl}/naturaleza-movimiento`
    );
  }

  create(payload: RubroRequestDto): Observable<ApiResponse<Rubro>> {
    return this.http.post<ApiResponse<Rubro>>(`${this.baseUrl}/rubro`, payload);
  }

  update(id: number, payload: RubroRequestDto): Observable<ApiResponse<Rubro>> {
    return this.http.put<ApiResponse<Rubro>>(`${this.baseUrl}/rubro/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/rubro/${id}`);
  }
}
