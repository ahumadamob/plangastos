import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

export interface Divisa {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
}

export interface PlanPresupuestario {
  id: number;
  usuario: Usuario;
  divisa: Divisa;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanPresupuestarioRequestDto {
  usuario_id: number | null;
  divisa_id: number | null;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PlanPresupuestarioService {
  private readonly baseUrl = '/api/v1';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<PlanPresupuestario[]>> {
    return this.http.get<ApiResponse<PlanPresupuestario[]>>(`${this.baseUrl}/plan-presupuestario`);
  }

  getUsuarios(): Observable<ApiResponse<Usuario[]>> {
    return this.http.get<ApiResponse<Usuario[]>>(`${this.baseUrl}/usuario`);
  }

  getDivisas(): Observable<ApiResponse<Divisa[]>> {
    return this.http.get<ApiResponse<Divisa[]>>(`${this.baseUrl}/divisa`);
  }

  create(payload: PlanPresupuestarioRequestDto): Observable<ApiResponse<PlanPresupuestario>> {
    return this.http.post<ApiResponse<PlanPresupuestario>>(
      `${this.baseUrl}/plan-presupuestario`,
      payload
    );
  }

  update(id: number, payload: PlanPresupuestarioRequestDto): Observable<ApiResponse<PlanPresupuestario>> {
    return this.http.put<ApiResponse<PlanPresupuestario>>(
      `${this.baseUrl}/plan-presupuestario/${id}`,
      payload
    );
  }

  delete(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/plan-presupuestario/${id}`);
  }
}
