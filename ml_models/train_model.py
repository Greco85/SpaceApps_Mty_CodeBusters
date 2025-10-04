"""
Script principal para entrenar el modelo de clasificación de exoplanetas.
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib
import os
from pathlib import Path

def load_data(data_path: str) -> pd.DataFrame:
    """
    Carga los datos de exoplanetas desde archivos CSV.
    """
    try:
        # Intentar cargar datos procesados primero
        processed_path = Path(data_path) / "processed" / "exoplanet_dataset.csv"
        if processed_path.exists():
            print(f"Cargando datos procesados desde: {processed_path}")
            return pd.read_csv(processed_path)
        
        # Si no hay datos procesados, cargar datos raw
        raw_path = Path(data_path) / "raw"
        print(f"Buscando datos en: {raw_path}")
        
        # Lista de archivos para buscar
        files_to_check = [
            "kepler/confirmed.csv",
            "k2/confirmed.csv", 
            "tess/confirmed.csv"
        ]
        
        datasets = []
        for file_path in files_to_check:
            full_path = raw_path / file_path
            if full_path.exists():
                print(f"Cargando: {full_path}")
                df = pd.read_csv(full_path)
                datasets.append(df)
        
        if not datasets:
            print("No se encontraron datos. Generando dataset de ejemplo...")
            return generate_sample_data()
        
        # Combinar datasets
        combined_df = pd.concat(datasets, ignore_index=True)
        return combined_df
        
    except Exception as e:
        print(f"Error cargando datos: {e}")
        print("Generando dataset de ejemplo...")
        return generate_sample_data()

def generate_sample_data() -> pd.DataFrame:
    """
    Genera datos de ejemplo para desarrollo y testing.
    """
    np.random.seed(42)
    n_samples = 1000
    
    data = {
        'orbital_period': np.random.exponential(10, n_samples),
        'transit_duration': np.random.normal(3, 1, n_samples),
        'transit_depth': np.random.exponential(0.005, n_samples),
        'stellar_radius': np.random.normal(1, 0.3, n_samples),
        'stellar_mass': np.random.normal(1, 0.2, n_samples),
        'stellar_temperature': np.random.normal(5778, 1000, n_samples),
        'mission': np.random.choice(['Kepler', 'K2', 'TESS'], n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Generar etiquetas basadas en reglas simples
    labels = []
    for _, row in df.iterrows():
        if row['transit_depth'] > 0.01 and row['orbital_period'] < 50:
            labels.append('exoplanet')
        elif row['transit_depth'] > 0.005:
            labels.append('candidate')
        else:
            labels.append('false_positive')
    
    df['classification'] = labels
    return df

def preprocess_data(df: pd.DataFrame) -> tuple:
    """
    Preprocesa los datos para entrenamiento.
    """
    # Seleccionar características numéricas
    feature_columns = [
        'orbital_period', 'transit_duration', 'transit_depth',
        'stellar_radius', 'stellar_mass', 'stellar_temperature'
    ]
    
    # Filtrar columnas que existen
    available_features = [col for col in feature_columns if col in df.columns]
    
    X = df[available_features]
    y = df['classification']
    
    # Manejar valores faltantes
    X = X.fillna(X.median())
    
    # Codificar etiquetas
    label_mapping = {'exoplanet': 0, 'candidate': 1, 'false_positive': 2}
    y_encoded = y.map(label_mapping)
    
    return X, y_encoded, available_features

def train_model(X_train, y_train, X_val, y_val):
    """
    Entrena múltiples modelos y selecciona el mejor.
    """
    models = {
        'RandomForest': RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            class_weight='balanced'
        ),
        'SVM': SVC(
            kernel='rbf',
            random_state=42,
            class_weight='balanced',
            probability=True
        )
    }
    
    best_model = None
    best_score = 0
    best_name = ""
    
    for name, model in models.items():
        print(f"\nEntrenando {name}...")
        
        # Entrenar modelo
        model.fit(X_train, y_train)
        
        # Evaluar
        val_score = model.score(X_val, y_val)
        print(f"Accuracy en validación: {val_score:.4f}")
        
        if val_score > best_score:
            best_score = val_score
            best_model = model
            best_name = name
    
    print(f"\nMejor modelo: {best_name} con accuracy: {best_score:.4f}")
    return best_model, best_name

def evaluate_model(model, X_test, y_test):
    """
    Evalúa el modelo final.
    """
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nAccuracy final: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, 
                              target_names=['exoplanet', 'candidate', 'false_positive']))
    
    return accuracy

def main():
    """
    Función principal de entrenamiento.
    """
    print("🚀 Iniciando entrenamiento del modelo de exoplanetas...")
    
    # Configurar paths
    data_path = "../data"
    model_path = "trained_models"
    
    # Crear directorio de modelos si no existe
    os.makedirs(model_path, exist_ok=True)
    
    # Cargar datos
    print("\n📊 Cargando datos...")
    df = load_data(data_path)
    print(f"Datos cargados: {len(df)} muestras")
    print(f"Distribución de clases:\n{df['classification'].value_counts()}")
    
    # Preprocesar
    print("\n🔧 Preprocesando datos...")
    X, y, feature_names = preprocess_data(df)
    print(f"Características: {feature_names}")
    
    # Dividir datos
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
    )
    
    print(f"Tamaño de conjuntos - Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    
    # Entrenar modelo
    print("\n🤖 Entrenando modelos...")
    model, model_name = train_model(X_train, y_train, X_val, y_val)
    
    # Evaluar
    print("\n📈 Evaluando modelo final...")
    accuracy = evaluate_model(model, X_test, y_test)
    
    # Guardar modelo
    model_file = f"{model_path}/exoplanet_classifier.pkl"
    joblib.dump(model, model_file)
    print(f"\n💾 Modelo guardado en: {model_file}")
    
    # Guardar metadatos
    metadata = {
        'model_name': model_name,
        'accuracy': float(accuracy),
        'features': feature_names,
        'n_samples': len(df),
        'class_distribution': df['classification'].value_counts().to_dict()
    }
    
    import json
    with open(f"{model_path}/model_metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print("✅ Entrenamiento completado exitosamente!")
    print(f"📊 Accuracy final: {accuracy:.4f}")

if __name__ == "__main__":
    main()
