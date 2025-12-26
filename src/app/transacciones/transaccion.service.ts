import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CuentaFinanciera } from '../cuentas-financieras/cuenta-financiera.service';
import { PartidaPlanificada } from '../partidas-planificadas/partida-planificada.service';
import { Presupuesto } from '../presupuestos/presupuesto.service';
import { Rubro } from '../rubros/rubro.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface Transaccion {
  id: number;
  presupuesto: Presupuesto;
  rubro: Rubro;
  descripcion: string;
  cuenta: CuentaFinanciera;
  fecha: string;
  monto: number;
  referenciaExterna?: string | null;
  partidaPlanificada?: PartidaPlanificada | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransaccionRequestDto {
  presupuesto_id: number | null;
  rubro_id: number | null;
  descripcion: string;
  cuentaFinanciera_id: number | null;
  fecha: string | null;
  monto: number | null;
  referenciaExterna?: string | null;
  partidaPlanificada_id?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class TransaccionService {
  private readonly baseUrl = '/api/v1';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<Transaccion[]>> {
    return this.http.get<ApiResponse<Transaccion[]>>(`${this.baseUrl}/transaccion`);
  }

  getPresupuestos(): Observable<ApiResponse<Presupuesto[]>> {
    return this.http.get<ApiResponse<Presupuesto[]>>(`${this.baseUrl}/presupuesto`);
  }

  getRubros(): Observable<ApiResponse<Rubro[]>> {
    return this.http.get<ApiResponse<Rubro[]>>(`${this.baseUrl}/rubro`);
  }

  getCuentasFinancieras(): Observable<ApiResponse<CuentaFinanciera[]>> {
    return this.http.get<ApiResponse<CuentaFinanciera[]>>(`${this.baseUrl}/cuenta-financiera`);
  }

  getPartidasPlanificadas(): Observable<ApiResponse<PartidaPlanificada[]>> {
    return this.http.get<ApiResponse<PartidaPlanificada[]>>(`${this.baseUrl}/partida-planificada`);
  }

  create(payload: TransaccionRequestDto): Observable<ApiResponse<Transaccion>> {
    return this.http.post<ApiResponse<Transaccion>>(`${this.baseUrl}/transaccion`, payload);
  }

  update(id: number, payload: TransaccionRequestDto): Observable<ApiResponse<Transaccion>> {
    return this.http.put<ApiResponse<Transaccion>>(`${this.baseUrl}/transaccion/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/transaccion/${id}`);
  }
}
