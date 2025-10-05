from data_loader import cargar_y_preprocesar_datasets
from model_trainer import EntrenadorTelescopio

print("="*60)
print(" ENTRENANDO MODELOS TESS")
print("="*60)

# Cargar datos
_, df_tess_proc, _ = cargar_y_preprocesar_datasets()

if df_tess_proc is not None:
    # Entrenar modelos TESS
    entrenador_tess = EntrenadorTelescopio("tess")
    entrenador_tess.entrenar_modelo_multiclase(df_tess_proc)
    entrenador_tess.entrenar_modelo_binario_2etapas(df_tess_proc)
    entrenador_tess.guardar_modelos()
    
    print(f"\n MODELOS TESS ENTRENADOS Y GUARDADOS")
    print(f"   MULTICLASE - Accuracy: {entrenador_tess.metricas['multiclase']['accuracy']:.3f}")
    print(f"   BINARIO - Etapa1 F1: {entrenador_tess.metricas['binario']['etapa1_f1']:.3f}")
    print(f"   BINARIO - Etapa2 F1: {entrenador_tess.metricas['binario']['etapa2_f1']:.3f}")
else:
    print(" No se pudo cargar dataset TESS")