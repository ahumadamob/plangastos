import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlanPresupuestario } from '../plan-presupuestario/plan-presupuestario.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface Presupuesto {
  id: number;
  plan: PlanPresupuestario;
  nombre: string;
  codigo?: string | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  presupuestoOrigen?: Presupuesto | null;
  createdAt: string;
  updatedAt: string;
}

export interface PresupuestoRequestDto {
  planPresupuestario_id: number | null;
  nombre: string;
  codigo?: string | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  presupuestoOrigen_id?: number | null;
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

  getPlanesPresupuestarios(): Observable<ApiResponse<PlanPresupuestario[]>> {
    return this.http.get<ApiResponse<PlanPresupuestario[]>>(`${this.baseUrl}/plan-presupuestario`);
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
}
