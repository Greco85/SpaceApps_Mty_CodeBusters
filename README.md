# 🚀 Exoplanet Hunter - NASA Space Apps Challenge

**Desafío:** A World Away: Hunting for Exoplanets with AI

## 📋 Descripción del Proyecto

Sistema de detección automática de exoplanetas utilizando inteligencia artificial y datos de las misiones Kepler, K2 y TESS de la NASA. La aplicación incluye una interfaz web moderna para análisis de datos y visualización de resultados.

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **React Router DOM** para navegación
- **Lucide React** para iconos

### Backend
- **FastAPI** (Python)
- **Uvicorn** como servidor ASGI
- **Pydantic** para validación de datos
- **SQLAlchemy** para base de datos

### Machine Learning
- **Scikit-learn** para modelos ML
- **Pandas** y **NumPy** para procesamiento de datos

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 16+ 
- Python 3.9+
- Git

### Pasos de Instalación

1. **Clonar el repositorio:**
```bash
git clone [URL_DEL_REPOSITORIO]
cd SpaceApps_Mty_CodeBusters
```

2. **Configurar Backend (Python):**
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

3. **Configurar Frontend (React):**
```bash
cd frontend
npm install
```

## 🏃‍♂️ Ejecutar la Aplicación

### Opción 1: Script Automatizado (Recomendado)
```bash
# Windows
.\start_simple.bat
```

### Opción 2: Manual
```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm start
```

## 📁 Estructura del Proyecto

```
SpaceApps_Mty_CodeBusters/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── App.tsx         # Componente principal
│   │   └── index.tsx       # Punto de entrada
│   ├── package.json
│   └── tailwind.config.js
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── api/           # Endpoints de la API
│   │   ├── core/          # Configuración
│   │   └── main.py        # Aplicación principal
│   └── requirements.txt
├── ml_models/              # Modelos de Machine Learning
├── data/                   # Datos y datasets
├── docker-compose.yml      # Configuración Docker
└── README.md
```

## 🌐 URLs de Acceso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## 👥 Para el Equipo

### Comandos Útiles

```bash
# Ver logs del backend
cd backend && uvicorn app.main:app --reload

# Ver logs del frontend
cd frontend && npm start

# Instalar nueva dependencia (frontend)
cd frontend && npm install [paquete]

# Instalar nueva dependencia (backend)
cd backend
venv\Scripts\activate
pip install [paquete]
```

### Flujo de Desarrollo

1. **Crear rama:** `git checkout -b feature/nueva-funcionalidad`
2. **Desarrollar:** Hacer cambios en el código
3. **Probar:** Ejecutar `.\start_simple.bat` para verificar
4. **Commit:** `git add . && git commit -m "descripción"`
5. **Push:** `git push origin feature/nueva-funcionalidad`
6. **Pull Request:** Crear PR en GitHub

## 📚 Recursos Adicionales

- [Documentación FastAPI](https://fastapi.tiangolo.com/)
- [Documentación React](https://reactjs.org/docs)
- [Documentación Tailwind CSS](https://tailwindcss.com/docs)
- [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)

## 🎯 Próximos Pasos

1. Implementar modelo ML para detección de exoplanetas
2. Integrar APIs de datos de la NASA
3. Desarrollar visualizaciones de curvas de luz
4. Implementar sistema de análisis en tiempo real
5. Optimizar rendimiento y UX

---

**¡Buena suerte en el hackathon! 🚀✨**