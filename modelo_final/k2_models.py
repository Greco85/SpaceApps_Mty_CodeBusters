from data_loader import cargar_y_preprocesar_datasets
from model_trainer import EntrenadorTelescopio

print("="*60)
print(" ENTRENANDO MODELOS K2")
print("="*60)

# Cargar datos
_, _, df_k2_proc = cargar_y_preprocesar_datasets()

if df_k2_proc is not None:
    # Entrenar modelos K2
    entrenador_k2 = EntrenadorTelescopio("k2")
    entrenador_k2.entrenar_modelo_multiclase(df_k2_proc)
    entrenador_k2.guardar_modelos()
    
    print(f"\n MODELOS K2 ENTRENADOS Y GUARDADOS")
    print(f"   MULTICLASE - Accuracy: {entrenador_k2.metricas['multiclase']['accuracy']:.3f}")
    # Binary model training skipped per user request
else:
    print(" No se pudo cargar dataset K2")