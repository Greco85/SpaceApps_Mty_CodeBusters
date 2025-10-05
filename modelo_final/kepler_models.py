from data_loader import cargar_y_preprocesar_datasets
from model_trainer import EntrenadorTelescopio

print("="*60)
print(" ENTRENANDO MODELOS KEPLER")
print("="*60)

# Cargar datos
df_kepler_proc, _, _ = cargar_y_preprocesar_datasets()

if df_kepler_proc is not None:
    # Entrenar modelos Kepler
    entrenador_kepler = EntrenadorTelescopio("kepler")
    entrenador_kepler.entrenar_modelo_multiclase(df_kepler_proc)
    entrenador_kepler.guardar_modelos()
    
    print(f"\n MODELOS KEPLER ENTRENADOS Y GUARDADOS")
    print(f"   MULTICLASE - Accuracy: {entrenador_kepler.metricas['multiclase']['accuracy']:.3f}")
    # Binary model training skipped per user request
else:
    print(" No se pudo cargar dataset Kepler")