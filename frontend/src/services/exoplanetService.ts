// Servicio para manejar las llamadas a la API de exoplanetas
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface ExoplanetData {
  id: string;
  name: string;
  classification: 'exoplanet' | 'candidate' | 'false_positive';
  coordinates: {
    rightAscension: number;
    declination: number;
  };
  radius: number;
  orbitalPeriod: number;
  discoveryYear: number;
  mission: string;
  stellarTemperature: number;
}

export interface ExoplanetStats {
  total: number;
  exoplanets: number;
  candidates: number;
  false_positives: number;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
}

class ExoplanetService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en request a ${endpoint}:`, error);
      throw error;
    }
  }

  async getExoplanets(classification: string = 'all', limit: number = 1000): Promise<ExoplanetData[]> {
    const params = new URLSearchParams({
      classification,
      limit: limit.toString(),
    });
    
    const url = `${API_BASE_URL}/api/v1/exoplanets?${params}`;
    console.log('ExoplanetService: Llamando a:', url);
    
    try {
      const response = await fetch(url);
      console.log('ExoplanetService: Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('ExoplanetService: Datos recibidos:', data.length, 'exoplanetas');
      return data;
    } catch (error) {
      console.error('ExoplanetService: Error:', error);
      throw error;
    }
  }

  async getExoplanetStats(): Promise<ExoplanetStats> {
    return this.makeRequest<ExoplanetStats>('/api/v1/exoplanets/stats');
  }

  async getExoplanetById(id: string): Promise<ExoplanetData> {
    return this.makeRequest<ExoplanetData>(`/api/v1/exoplanets/${id}`);
  }

  async seedSampleData(): Promise<{ message: string; status: string }> {
    return this.makeRequest<{ message: string; status: string }>('/api/v1/exoplanets/seed', {
      method: 'POST',
    });
  }
}

export const exoplanetService = new ExoplanetService();