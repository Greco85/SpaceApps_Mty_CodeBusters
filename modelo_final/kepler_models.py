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
    entrenador_kepler.entrenar_modelo_binario_2etapas(df_kepler_proc)
    entrenador_kepler.guardar_modelos()
    
    print(f"\n MODELOS KEPLER ENTRENADOS Y GUARDADOS")
    print(f"   MULTICLASE - Accuracy: {entrenador_kepler.metricas['multiclase']['accuracy']:.3f}")
    print(f"   BINARIO - Etapa1 F1: {entrenador_kepler.metricas['binario']['etapa1_f1']:.3f}")
    print(f"   BINARIO - Etapa2 F1: {entrenador_kepler.metricas['binario']['etapa2_f1']:.3f}")
else:
    print(" No se pudo cargar dataset Kepler")