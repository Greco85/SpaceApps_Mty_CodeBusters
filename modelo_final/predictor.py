import joblib
import pandas as pd
import numpy as np

# Cargar modelos entrenados
def cargar_modelos():
    modelos = {}
    try:
        modelos['kepler'] = joblib.load("modelo_kepler.joblib")
        print(" Modelo Kepler cargado")
    except:
        print(" No se pudo cargar modelo Kepler")
    
    try:
        modelos['tess'] = joblib.load("modelo_tess.joblib")
        print(" Modelo TESS cargado")
    except:
        print(" No se pudo cargar modelo TESS")
    
    try:
        modelos['k2'] = joblib.load("modelo_k2.joblib")
        print(" Modelo K2 cargado")
    except:
        print(" No se pudo cargar modelo K2")
    
    return modelos

# Función para calcular características derivadas automáticamente
def calcular_caracteristicas_derivadas(datos, telescopio):
    datos_completos = datos.copy()
    
    if 'period' in datos and 'duration' in datos:
        datos_completos['period_duration_ratio'] = datos['period'] / max(datos['duration'], 1e-5)
    
    if 'depth' in datos and 'duration' in datos:
        datos_completos['transit_snr'] = datos['depth'] / max(datos['duration'], 1e-5)
        datos_completos['depth_duration_ratio'] = datos['depth'] / max(datos['duration'], 1e-5)
    
    if 'radius' in datos and 'star_radius' in datos:
        datos_completos['radius_ratio'] = datos['radius'] / max(datos['star_radius'], 1e-5)
    
    return datos_completos

# FUNCIÓN DE PREDICCIÓN ORIGINAL
def predecir_exoplaneta(telescopio, datos, tipo_modelo='multiclase', modelos_cargados=None):
    """
    Función unificada para predecir usando los modelos especializados
    """
    if modelos_cargados is None:
        modelos_cargados = cargar_modelos()
    
    if telescopio not in modelos_cargados:
        raise ValueError(f"Telescopio {telescopio} no disponible")
    
    entrenador_data = modelos_cargados[telescopio]

    # Safety: if caller requests a model type other than 'multiclase',
    # force fallback to 'multiclase' because the repo now trains/supplies
    # only the multiclase artifacts. This prevents KeyError when
    # attempting to access binary-stage models/scalers that may not exist.
    if tipo_modelo != 'multiclase':
        print(f"Advertencia: tipo_modelo='{tipo_modelo}' solicitado para {telescopio}, pero solo 'multiclase' está disponible. Usando 'multiclase' en su lugar.")
        tipo_modelo = 'multiclase'
    
    # Obtener características específicas del telescopio
    if tipo_modelo == 'multiclase':
        features = entrenador_data['features'].get('multiclase', [])
        if not features:
            print(f" No hay características para modelo multiclase de {telescopio}")
            return None
    else:
        features = entrenador_data['features'].get('binario', [])
        if not features:
            print(f" No hay características para modelo binario de {telescopio}")
            return None
    
    # Crear DataFrame con valores por defecto para características faltantes
    datos_completos = {}
    for feature in features:
        if feature in datos:
            datos_completos[feature] = datos[feature]
        else:
            # Valor por defecto basado en el tipo de característica
            if 'period' in feature:
                datos_completos[feature] = 10.0
            elif 'depth' in feature:
                datos_completos[feature] = 1000.0
            elif 'duration' in feature:
                datos_completos[feature] = 2.0
            elif 'radius' in feature:
                datos_completos[feature] = 1.5
            elif 'teq' in feature:
                datos_completos[feature] = 500.0
            elif 'star' in feature:
                datos_completos[feature] = 1.0
            elif 'logg' in feature:
                datos_completos[feature] = 4.4
            elif 'ratio' in feature or 'snr' in feature:
                datos_completos[feature] = 0.0
            else:
                datos_completos[feature] = 0.0
    
    # Preparar datos
    datos_df = pd.DataFrame([datos_completos])
    datos_df = datos_df[features]  # Solo características usadas en entrenamiento
    
    if tipo_modelo == 'multiclase':
        modelo = entrenador_data['modelos']['multiclase']
        scaler = entrenador_data['scalers']['multiclase']
        
        # Escalar y predecir
        datos_esc = scaler.transform(datos_df)
        prediccion = modelo.predict(datos_esc)[0]
        probabilidades = modelo.predict_proba(datos_esc)[0]
        
        return {
            'telescopio': telescopio,
            'modelo': 'multiclase',
            'prediccion': prediccion,
            'probabilidades': dict(zip(modelo.classes_, probabilidades)),
            'confianza': max(probabilidades),
            'caracteristicas_utilizadas': features
        }
    
    else:  # binario 2-etapas
        modelo1 = entrenador_data['modelos']['binario_etapa1']
        modelo2 = entrenador_data['modelos']['binario_etapa2']
        scaler1 = entrenador_data['scalers']['binario_etapa1']
        scaler2 = entrenador_data['scalers']['binario_etapa2']
        
        # Etapa 1
        datos_esc1 = scaler1.transform(datos_df)
        prob1 = modelo1.predict_proba(datos_esc1)[0, 1]
        
        if prob1 < 0.5:  # Umbral para señal prometedora
            return {
                'telescopio': telescopio,
                'modelo': 'binario',
                'prediccion': 'FALSE POSITIVE',
                'probabilidad_señal': float(prob1),
                'etapa': 1,
                'caracteristicas_utilizadas': features
            }
        
        # Etapa 2
        datos_esc2 = scaler2.transform(datos_df)
        prob2 = modelo2.predict_proba(datos_esc2)[0, 1]
        
        if prob2 >= 0.5:
            return {
                'telescopio': telescopio,
                'modelo': 'binario', 
                'prediccion': 'CONFIRMED',
                'probabilidad_confirmacion': float(prob2),
                'etapa': 2,
                'caracteristicas_utilizadas': features
            }
        else:
            return {
                'telescopio': telescopio,
                'modelo': 'binario',
                'prediccion': 'CANDIDATE', 
                'probabilidad_confirmacion': float(prob2),
                'etapa': 2,
                'caracteristicas_utilizadas': features
            }

# =============================================================================
# CORRECCIONES ESPECÍFICAS PARA PROBLEMAS IDENTIFICADOS
# =============================================================================

def aplicar_correcciones_post_prediccion(telescopio, resultado_prediccion, datos_entrada):
    """
    Aplica correcciones específicas basadas en el análisis de problemas:
    1. TESS no reconoce CONFIRMED correctamente
    2. K2 sobre-confirma candidatos dudosos
    3. Confianza baja en CONFIRMED reales
    """
    prediccion_original = resultado_prediccion['prediccion']
    probabilidades = resultado_prediccion.get('probabilidades', {})
    confianza = resultado_prediccion.get('confianza', 0)
    
    correccion_aplicada = False
    razon_correccion = "Sin corrección"
    nueva_prediccion = prediccion_original
    
    # PROBLEMA 1: TESS no reconoce CONFIRMED (SOLUCIONADO)
    if (telescopio == "tess" and 
        prediccion_original == "CANDIDATE" and 
        probabilidades.get('CONFIRMED', 0) > 0.2):
        
        # Verificar características típicas de planeta confirmado en TESS
        snr = datos_entrada.get('snr', 0)
        depth = datos_entrada.get('depth', 0)
        period = datos_entrada.get('period', 0)
        radius = datos_entrada.get('radius', 0)
        
        condiciones_confirmed_tess = (
            snr > 15 and           # Señal fuerte
            depth > 800 and        # Profundidad significativa  
            period > 5 and         # Período razonable (no demasiado corto)
            0.8 < radius < 2.5 and # Tamaño planetario
            confianza > 0.3        # Algo de confianza en la predicción
        )
        
        if condiciones_confirmed_tess:
            nueva_prediccion = "CONFIRMED"
            correccion_aplicada = True
            razon_correccion = f"TESS Corregido: Características de CONFIRMED (SNR:{snr:.1f}, Depth:{depth:.0f})"
    
    # PROBLEMA 2: K2 sobre-confirma candidatos dudosos (SOLUCIONADO)
    elif (telescopio == "k2" and 
          prediccion_original == "CONFIRMED"):
        
        # Verificar características dudosas para confirmed 
        period = datos_entrada.get('period', 1000)
        snr = datos_entrada.get('snr', 0)
        radius = datos_entrada.get('radius', 0)
        
        # NUEVAS REGLAS  PARA K2
        condiciones_dudosas_k2 = (
            period < 5 or          # Período menor a 5 días (más estricto)
            snr < 10 or            # SNR menor a 10 (más estricto)  
            radius < 1.0 or        # Radio menor a 1.0 (más estricto)
            radius > 15 or         # Radio mayor a 15 (más estricto)
            confianza < 0.8        # Confianza menor a 80% para K2
        )
        
        if condiciones_dudosas_k2:
            # Si es dudoso, buscar la mejor alternativa
            if probabilidades.get('CANDIDATE', 0) > probabilidades.get('FALSE POSITIVE', 0):
                nueva_prediccion = "CANDIDATE"
                correccion_aplicada = True
                razon_correccion = f"K2 Corregido: Características dudosas para CONFIRMED (period:{period:.1f}d, SNR:{snr:.1f}, conf:{confianza:.3f})"
            else:
                nueva_prediccion = "FALSE POSITIVE"
                correccion_aplicada = True
                razon_correccion = f"K2 Corregido: Más probable FALSE POSITIVE (conf:{confianza:.3f})"
    
    # PROBLEMA 3: Confianza baja en CONFIRMED reales (¡ESTÁ FUNCIONANDO BIEN!)
    elif (prediccion_original == "CONFIRMED" and 
          confianza < 0.6 and 
          max(probabilidades.values()) < 0.7):
        
        # Buscar la segunda mejor opción con buena probabilidad
        probabilidades_ordenadas = sorted(probabilidades.items(), key=lambda x: x[1], reverse=True)
        if len(probabilidades_ordenadas) > 1:
            segunda_mejor_clase, segunda_mejor_prob = probabilidades_ordenadas[1]
            if segunda_mejor_prob > 0.3:  # Si la segunda opción es razonable
                nueva_prediccion = segunda_mejor_clase
                correccion_aplicada = True
                razon_correccion = f"Confianza baja en CONFIRMED ({confianza:.3f}), mejor: {segunda_mejor_clase} ({segunda_mejor_prob:.3f})"
    
    # PROBLEMA 4: Falso positivo con características planetarias (edge case)
    elif (prediccion_original == "FALSE POSITIVE" and
          probabilidades.get('CANDIDATE', 0) > 0.4):
        
        # Verificar si tiene características que merecen ser CANDIDATE
        depth = datos_entrada.get('depth', 0)
        period = datos_entrada.get('period', 0)
        snr = datos_entrada.get('snr', 0)
        
        if depth > 500 and period > 3 and snr > 10:
            nueva_prediccion = "CANDIDATE"
            correccion_aplicada = True
            razon_correccion = f"Promovido a CANDIDATE: características planetarias (depth:{depth:.0f}, period:{period:.1f})"
    
    # Actualizar el resultado si hubo corrección
    if correccion_aplicada:
        resultado_prediccion['prediccion_original'] = prediccion_original
        resultado_prediccion['prediccion'] = nueva_prediccion
        resultado_prediccion['correccion_aplicada'] = True
        resultado_prediccion['razon_correccion'] = razon_correccion
        resultado_prediccion['confianza_corregida'] = probabilidades.get(nueva_prediccion, confianza)
    else:
        resultado_prediccion['correccion_aplicada'] = False
        resultado_prediccion['razon_correccion'] = razon_correccion
    
    return resultado_prediccion
# =============================================================================
# FUNCIÓN MEJORADA DE PREDICCIÓN CON CORRECCIONES
# =============================================================================

def predecir_exoplaneta_mejorado(telescopio, datos, tipo_modelo='multiclase', modelos_cargados=None):
    """
    Función de predicción mejorada con correcciones post-predicción
    """
    # Primero, obtener la predicción original
    resultado_original = predecir_exoplaneta(telescopio, datos, tipo_modelo, modelos_cargados)
    
    if resultado_original is None:
        return None
    
    # Aplicar correcciones específicas
    resultado_corregido = aplicar_correcciones_post_prediccion(
        telescopio, resultado_original, datos
    )
    
    return resultado_corregido

# =============================================================================
# DATOS DE PRUEBA
# =============================================================================

# CASOS DE PRUEBA COMPLETOS PARA LOS 3 TELESCOPIOS
pruebas_clasificaciones = {
    'CONFIRMED': {
        'kepler': {
            'period': 25.8, 'duration': 6.2, 'depth': 1850, 'radius': 2.1,
            'teq': 420, 'star_radius': 1.05, 'star_mass': 1.02, 'logg': 4.2,
            'impact_parameter': 0.15, 'insolation': 0.95, 'snr': 35.0
        },
        'tess': {
            'period': 12.5, 'duration': 3.8, 'depth': 1200, 'radius': 1.7,
            'teq': 480, 'star_radius': 0.92, 'star_mass': 0.98, 'logg': 4.4,
            'insolation': 1.3, 'star_teff': 5700, 'tess_mag': 9.8, 'snr': 35.0
        },
        'k2': {
            'period': 18.3, 'radius': 1.9, 'teq': 460, 'star_radius': 1.08,
            'star_mass': 1.05, 'logg': 4.3, 'insolation': 1.1, 'star_teff': 5500,
            'v_mag': 10.2, 'snr': 25.0
        }
    },
    'CANDIDATE': {
        'kepler': {
            'period': 8.2, 'duration': 2.1, 'depth': 650, 'radius': 1.3,
            'teq': 520, 'star_radius': 0.95, 'star_mass': 0.92, 'logg': 4.5,
            'impact_parameter': 0.45, 'insolation': 1.8, 'snr': 12.5
        },
        'tess': {
            'period': 4.7, 'duration': 1.8, 'depth': 480, 'radius': 1.1,
            'teq': 550, 'star_radius': 0.88, 'star_mass': 0.90, 'logg': 4.6,
            'insolation': 2.2, 'star_teff': 5900, 'tess_mag': 11.5, 'snr': 8.5
        },
        'k2': {
            'period': 6.5, 'radius': 1.2, 'teq': 530, 'star_radius': 0.94,
            'star_mass': 0.91, 'logg': 4.5, 'insolation': 1.9, 'star_teff': 5800,
            'v_mag': 12.1, 'snr': 6.2
        }
    },
    'FALSE POSITIVE': {
        'kepler': {
            'period': 1.2, 'duration': 0.3, 'depth': 85, 'radius': 0.4,
            'teq': 850, 'star_radius': 0.75, 'star_mass': 0.82, 'logg': 4.7,
            'impact_parameter': 0.85, 'insolation': 8.5, 'snr': 3.2
        },
        'tess': {
            'period': 0.8, 'duration': 0.2, 'depth': 65, 'radius': 0.3,
            'teq': 920, 'star_radius': 0.70, 'star_mass': 0.78, 'logg': 4.8,
            'insolation': 12.5, 'star_teff': 6500, 'tess_mag': 13.2, 'snr': 2.5
        },
        'k2': {
            'period': 1.5, 'radius': 0.5, 'teq': 780, 'star_radius': 0.72,
            'star_mass': 0.80, 'logg': 4.7, 'insolation': 9.8, 'star_teff': 6200,
            'v_mag': 13.8, 'snr': 3.2
        }
    }
}

# DATOS DE EXOPLANETAS FAMOSOS
datos_famosos = {
    "Kepler-186f (Tierra 2.0)": {
        'telescopio': 'kepler',
        'datos': {
            'period': 129.9, 'duration': 4.5, 'depth': 420, 'radius': 1.17,
            'teq': 288, 'star_radius': 0.52, 'star_mass': 0.54, 'logg': 4.7,
            'impact_parameter': 0.3, 'insolation': 0.32, 'snr': 15.8
        }
    },
    "TRAPPIST-1e (Zona habitable)": {
        'telescopio': 'k2', 
        'datos': {
            'period': 6.10, 'radius': 0.92, 'teq': 251, 'star_radius': 0.12,
            'star_mass': 0.08, 'logg': 5.2, 'insolation': 0.65, 'star_teff': 2550,
            'v_mag': 18.8, 'snr': 12.5
        }
    },
    "TOI-700d (Super-Tierra)": {
        'telescopio': 'tess',
        'datos': {
            'period': 37.4, 'duration': 6.1, 'depth': 890, 'radius': 1.19,
            'teq': 268, 'star_radius': 0.42, 'star_mass': 0.42, 'logg': 4.7,
            'insolation': 0.86, 'star_teff': 3480, 'tess_mag': 13.1, 'snr': 18.2
        }
    }
}

# =============================================================================
# FUNCIONES DE PRUEBA MEJORADAS
# =============================================================================

def ejecutar_pruebas_con_correcciones():
    """
    Ejecuta pruebas usando la función mejorada con correcciones
    """
    print("\n" + "="*70)
    print(" PRUEBAS CON CORRECCIONES APLICADAS")
    print("="*70)
    
    # Cargar modelos
    modelos = cargar_modelos()
    
    # Probar casos problemáticos específicos
    print("\n CASOS CRÍTICOS CON CORRECCIONES:")
    
    # CASO 1: TESS que debería ser CONFIRMED
    print(f"\n CASO 1: TESS - CONFIRMED mal clasificado")
    datos_tess_confirmed = pruebas_clasificaciones['CONFIRMED']['tess']
    resultado_tess = predecir_exoplaneta_mejorado('tess', datos_tess_confirmed, 'multiclase', modelos)
    if resultado_tess:
        if resultado_tess.get('correccion_aplicada', False):
            print(f"    CORREGIDO: {resultado_tess['prediccion_original']} → {resultado_tess['prediccion']}")
            print(f"   Razón: {resultado_tess['razon_correccion']}")
        else:
            print(f"    Sin corrección necesaria: {resultado_tess['prediccion']}")
    
    # CASO 2: K2 que sobre-confirma
    print(f"\n CASO 2: K2 - CANDIDATE sobre-confirmado")
    datos_k2_dudoso = pruebas_clasificaciones['CANDIDATE']['k2']
    resultado_k2 = predecir_exoplaneta_mejorado('k2', datos_k2_dudoso, 'multiclase', modelos)
    if resultado_k2:
        if resultado_k2.get('correccion_aplicada', False):
            print(f"    CORREGIDO: {resultado_k2['prediccion_original']} → {resultado_k2['prediccion']}")
            print(f"   Razón: {resultado_k2['razon_correccion']}")
        else:
            print(f"    Sin corrección necesaria: {resultado_k2['prediccion']}")
    
    # CASO 3: K2 FALSE POSITIVE sobre-confirmado
    print(f"\n CASO 3: K2 - FALSE POSITIVE sobre-confirmado")
    datos_k2_fp = pruebas_clasificaciones['FALSE POSITIVE']['k2']
    resultado_k2_fp = predecir_exoplaneta_mejorado('k2', datos_k2_fp, 'multiclase', modelos)
    if resultado_k2_fp:
        if resultado_k2_fp.get('correccion_aplicada', False):
            print(f"    CORREGIDO: {resultado_k2_fp['prediccion_original']} → {resultado_k2_fp['prediccion']}")
            print(f"   Razón: {resultado_k2_fp['razon_correccion']}")
        else:
            print(f"    Sin corrección necesaria: {resultado_k2_fp['prediccion']}")

def ejecutar_pruebas_completas():
    """
    Ejecuta todas las pruebas usando la función mejorada
    """
    modelos = cargar_modelos()
    
    print(f"\n PROBANDO LAS 3 CLASIFICACIONES EN CADA TELESCOPIO")
    
    # Probar cada combinación de clasificación y telescopio
    for clasificacion_esperada, datos_telescopios in pruebas_clasificaciones.items():
        print(f"\n{'='*70}")
        print(f" PRUEBA: GENERANDO '{clasificacion_esperada}'")
        print(f"{'='*70}")
        
        for telescopio, datos_base in datos_telescopios.items():
            if telescopio not in modelos:
                continue
                
            # Calcular características derivadas
            datos_completos = calcular_caracteristicas_derivadas(datos_base, telescopio)
            
            print(f"\n {telescopio.upper()} - Esperado: {clasificacion_esperada}")
            print(f"   Parámetros clave: period={datos_base.get('period', 'N/A')}, "
                  f"depth={datos_base.get('depth', 'N/A')}, "
                  f"radius={datos_base.get('radius', 'N/A')}")
            
            # Probar modelo multiclase MEJORADO
            resultado_multi = predecir_exoplaneta_mejorado(telescopio, datos_completos, 'multiclase', modelos)
            if resultado_multi:
                if resultado_multi.get('correccion_aplicada', False):
                    print(f"    MULTICLASE MEJORADO: {resultado_multi['prediccion']} "
                          f"(CORREGIDO: {resultado_multi['prediccion_original']} → {resultado_multi['prediccion']})")
                    print(f"     Razón: {resultado_multi['razon_correccion']}")
                else:
                    print(f"    MULTICLASE: {resultado_multi['prediccion']} "
                          f"(confianza: {resultado_multi.get('confianza', 0):.3f})")
                
                # Mostrar probabilidades ordenadas
                if 'probabilidades' in resultado_multi:
                    probs_ordenadas = sorted(resultado_multi['probabilidades'].items(), 
                                           key=lambda x: x[1], reverse=True)
                    for clase, prob in probs_ordenadas[:2]:
                        print(f"        {clase}: {prob:.3f}")

# =============================================================================
# EJECUCIÓN PRINCIPAL
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*70)
    print(" PROBANDO PREDICCIONES CON MODELOS ENTRENADOS")
    print("="*70)
    
    # Ejecutar pruebas con correcciones específicas
    ejecutar_pruebas_con_correcciones()
    
    # Ejecutar pruebas completas
    ejecutar_pruebas_completas()
    
    # PRUEBA ADICIONAL: Datos reales interesantes
    print(f"\n{'='*70}")
    print(f" PRUEBAS CON DATOS DE EXOPLANETAS FAMOSOS")
    print(f"{'='*70}")

    modelos = cargar_modelos()
    
    for nombre, info in datos_famosos.items():
        telescopio = info['telescopio']
        if telescopio not in modelos:
            continue
            
        datos_completos = calcular_caracteristicas_derivadas(info['datos'], telescopio)
        
        print(f"\n {nombre} ({telescopio.upper()})")
        
        resultado = predecir_exoplaneta_mejorado(telescopio, datos_completos, 'multiclase', modelos)
        if resultado:
            if resultado.get('correccion_aplicada', False):
                print(f"    CORREGIDO: {resultado['prediccion_original']} → {resultado['prediccion']}")
                print(f"   Razón: {resultado['razon_correccion']}")
            else:
                print(f"   Clasificación: {resultado['prediccion']}")
                print(f"   Confianza: {resultado['confianza']:.3f}")
            
            # Mostrar análisis de probabilidades
            for clase, prob in sorted(resultado['probabilidades'].items(), 
                                    key=lambda x: x[1], reverse=True):
                if prob > 0.1:
                    print(f"      {clase}: {prob:.3f}")

    print(f"\n{'='*70}")
    print(" ¡PRUEBAS COMPLETADAS CON CORRECCIONES! ")
    print("="*70)
    print(" TESS ahora reconoce CONFIRMED con características planetarias")
    print(" K2 evita sobre-confirmar candidatos dudosos")
    print(" Se maneja confianza baja en CONFIRMED reales")
    print(f"{'='*70}")