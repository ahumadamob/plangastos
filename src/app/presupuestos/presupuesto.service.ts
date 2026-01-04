import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface Presupuesto {
  id: number;
  nombre: string;
  codigo?: string | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  presupuestoOrigen_id?: number | null;
  presupuestoOrigen?: Presupuesto | null;
  createdAt: string;
  updatedAt: string;
}

export interface PresupuestoRequestDto {
  nombre: string;
  codigo?: string | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  presupuestoOrigen_id?: number | null;
}

export interface PresupuestoDropdown {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class PresupuestoService {
  private readonly baseUrl = '/api/v1';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<Presupuesto[]>> {
    return this.http.get<ApiResponse<Presupuesto[]>>(`${this.baseUrl}/presupuesto`);
  }

  create(payload: PresupuestoRequestDto): Observable<ApiResponse<Presupuesto>> {
    return this.http.post<ApiResponse<Presupuesto>>(`${this.baseUrl}/presupuesto`, payload);
  }

  update(id: number, payload: PresupuestoRequestDto): Observable<ApiResponse<Presupuesto>> {
    return this.http.put<ApiResponse<Presupuesto>>(`${this.baseUrl}/presupuesto/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/presupuesto/${id}`);
  }

  getDropdown(): Observable<ApiResponse<PresupuestoDropdown[]>> {
    return this.http.get<ApiResponse<PresupuestoDropdown[]>>(`${this.baseUrl}/presupuesto/dropdown`);
  }
}
