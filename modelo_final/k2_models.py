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
    entrenador_k2.entrenar_modelo_binario_2etapas(df_k2_proc)
    entrenador_k2.guardar_modelos()
    
    print(f"\n MODELOS K2 ENTRENADOS Y GUARDADOS")
    print(f"   MULTICLASE - Accuracy: {entrenador_k2.metricas['multiclase']['accuracy']:.3f}")
    print(f"   BINARIO - Etapa1 F1: {entrenador_k2.metricas['binario']['etapa1_f1']:.3f}")
    print(f"   BINARIO - Etapa2 F1: {entrenador_k2.metricas['binario']['etapa2_f1']:.3f}")
else:
    print(" No se pudo cargar dataset K2")