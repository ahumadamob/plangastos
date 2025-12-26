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

export type TipoCuenta = 'EFECTIVO' | 'BANCO' | 'TARJETA' | 'BILLETERA' | 'OTRA';

export interface CuentaFinanciera {
  id: number;
  usuario: Usuario;
  divisa: Divisa;
  nombre: string;
  tipo: TipoCuenta;
  saldoInicial: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CuentaFinancieraRequestDto {
  usuario_id: number | null;
  divisa_id: number | null;
  nombre: string;
  tipo: TipoCuenta | '';
  saldoInicial: number | null;
  activo: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CuentaFinancieraService {
  private readonly baseUrl = '/api/v1';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<CuentaFinanciera[]>> {
    return this.http.get<ApiResponse<CuentaFinanciera[]>>(`${this.baseUrl}/cuenta-financiera`);
  }

  getUsuarios(): Observable<ApiResponse<Usuario[]>> {
    return this.http.get<ApiResponse<Usuario[]>>(`${this.baseUrl}/usuario`);
  }

  getDivisas(): Observable<ApiResponse<Divisa[]>> {
    return this.http.get<ApiResponse<Divisa[]>>(`${this.baseUrl}/divisa`);
  }

  create(payload: CuentaFinancieraRequestDto): Observable<ApiResponse<CuentaFinanciera>> {
    return this.http.post<ApiResponse<CuentaFinanciera>>(
      `${this.baseUrl}/cuenta-financiera`,
      payload
    );
  }

  update(id: number, payload: CuentaFinancieraRequestDto): Observable<ApiResponse<CuentaFinanciera>> {
    return this.http.put<ApiResponse<CuentaFinanciera>>(
      `${this.baseUrl}/cuenta-financiera/${id}`,
      payload
    );
  }

  delete(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/cuenta-financiera/${id}`);
  }
}
