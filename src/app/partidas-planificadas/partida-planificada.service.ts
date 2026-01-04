import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CuentaFinanciera } from '../cuentas-financieras/cuenta-financiera.service';
import { Presupuesto } from '../presupuestos/presupuesto.service';
import { Rubro } from '../rubros/rubro.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PartidaPlanificadaTransaccion {
  id: number;
  presupuesto: Presupuesto;
  rubro: Rubro;
  descripcion: string;
  cuenta: CuentaFinanciera;
  fecha: string;
  monto: number;
  referenciaExterna?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartidaPlanificada {
  id: number;
  presupuesto: Presupuesto;
  rubro: Rubro;
  descripcion: string;
  montoComprometido: number;
  fechaObjetivo?: string | null;
  cuota?: number | null;
  cantidadCuotas?: number | null;
  consolidado?: boolean;
  transacciones?: PartidaPlanificadaTransaccion[];
  createdAt: string;
  updatedAt: string;
}

export interface PartidaPlanificadaRequestDto {
  presupuesto_id: number | null;
  rubro_id: number | null;
  descripcion: string;
  montoComprometido: number | null;
  fechaObjetivo?: string | null;
  cuota?: number | null;
  cantidadCuotas?: number | null;
}

export interface ActualizarMontoComprometidoRequestDto {
  montoComprometido?: number | null;
  porcentaje?: number | null;
  solicitudValida?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PartidaPlanificadaService {
  private readonly baseUrl = '/api/v1';

  constructor(private readonly http: HttpClient) {}

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  private normalizePayload(payload: PartidaPlanificadaRequestDto): PartidaPlanificadaRequestDto {
    return {
      ...payload,
      presupuesto_id: this.toNumberOrNull(payload.presupuesto_id),
      rubro_id: this.toNumberOrNull(payload.rubro_id),
      montoComprometido: this.toNumberOrNull(payload.montoComprometido),
      cuota: this.toNumberOrNull(payload.cuota),
      cantidadCuotas: this.toNumberOrNull(payload.cantidadCuotas),
    };
  }

  getAll(): Observable<ApiResponse<PartidaPlanificada[]>> {
    return this.http.get<ApiResponse<PartidaPlanificada[]>>(`${this.baseUrl}/partida-planificada`);
  }

  getPresupuestos(): Observable<ApiResponse<Presupuesto[]>> {
    return this.http.get<ApiResponse<Presupuesto[]>>(`${this.baseUrl}/presupuesto`);
  }

  getRubros(): Observable<ApiResponse<Rubro[]>> {
    return this.http.get<ApiResponse<Rubro[]>>(`${this.baseUrl}/rubro`);
  }

  getIngresosByPresupuesto(presupuestoId: number): Observable<ApiResponse<PartidaPlanificada[]>> {
    return this.http.get<ApiResponse<PartidaPlanificada[]>>(
      `${this.baseUrl}/partida-planificada/${presupuestoId}/ingresos`
    );
  }

  getGastosByPresupuesto(presupuestoId: number): Observable<ApiResponse<PartidaPlanificada[]>> {
    return this.http.get<ApiResponse<PartidaPlanificada[]>>(
      `${this.baseUrl}/partida-planificada/${presupuestoId}/gastos`
    );
  }

  getAhorroByPresupuesto(presupuestoId: number): Observable<ApiResponse<PartidaPlanificada[]>> {
    return this.http.get<ApiResponse<PartidaPlanificada[]>>(
      `${this.baseUrl}/partida-planificada/${presupuestoId}/ahorro`
    );
  }

  create(payload: PartidaPlanificadaRequestDto): Observable<ApiResponse<PartidaPlanificada>> {
    const normalizedPayload = this.normalizePayload(payload);
    return this.http.post<ApiResponse<PartidaPlanificada>>(
      `${this.baseUrl}/partida-planificada`,
      normalizedPayload
    );
  }

  update(id: number, payload: PartidaPlanificadaRequestDto): Observable<ApiResponse<PartidaPlanificada>> {
    const normalizedPayload = this.normalizePayload(payload);
    return this.http.patch<ApiResponse<PartidaPlanificada>>(
      `${this.baseUrl}/partida-planificada/${id}`,
      normalizedPayload
    );
  }

  consolidate(id: number): Observable<ApiResponse<PartidaPlanificada>> {
    return this.http.patch<ApiResponse<PartidaPlanificada>>(`${this.baseUrl}/partida-planificada/${id}`, {
      consolidado: true,
    });
  }

  updateMontoComprometido(
    id: number,
    payload: ActualizarMontoComprometidoRequestDto
  ): Observable<ApiResponse<PartidaPlanificada>> {
    const normalizedPayload = {
      ...payload,
      montoComprometido: this.toNumberOrNull(payload.montoComprometido),
      porcentaje: this.toNumberOrNull(payload.porcentaje),
    };

    return this.http.patch<ApiResponse<PartidaPlanificada>>(
      `${this.baseUrl}/partida-planificada/${id}/monto-comprometido`,
      normalizedPayload
    );
  }

  delete(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/partida-planificada/${id}`);
  }
}
