import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, f1_score
import joblib

class EntrenadorTelescopio:
    def __init__(self, telescopio):
        self.telescopio = telescopio
        self.modelos = {}
        self.scalers = {}
        self.features = {}
        self.metricas = {}
    
    def preparar_datos_multiclase(self, df):
        """Prepara datos para clasificación multiclase (3 clases)"""
        features = [col for col in df.columns if col != 'disposition' and df[col].dtype in [np.number, np.float64, np.int64]]
        X = df[features]
        y = df['disposition']
        
        # Verificar que tenemos las 3 clases
        clases_unicas = y.unique()
        print(f"   Clases multiclase {self.telescopio}: {clases_unicas}")
        
        return X, y, features
    
    def preparar_datos_binario_2etapas(self, df):
        """Prepara datos para clasificación binaria en 2 etapas"""
        df = df.copy()
        
        # Etapa 1: Señal prometedora vs Falso Positivo
        df['etapa1_señal_prometedora'] = df['disposition'].map({
            'FALSE POSITIVE': 0,
            'CANDIDATE': 1,
            'CONFIRMED': 1
        })
        
        # Etapa 2: Confirmado vs Candidato (solo para señales prometedoras)
        df_etapa2 = df[df['etapa1_señal_prometedora'] == 1].copy()
        df_etapa2['etapa2_confirmado'] = df_etapa2['disposition'].map({
            'CANDIDATE': 0,
            'CONFIRMED': 1
        })
        
        features = [col for col in df.columns if col not in ['disposition', 'etapa1_señal_prometedora', 'etapa2_confirmado'] 
                   and df[col].dtype in [np.number, np.float64, np.int64]]
        
        X_etapa1 = df[features]
        y_etapa1 = df['etapa1_señal_prometedora']
        
        X_etapa2 = df_etapa2[features]
        y_etapa2 = df_etapa2['etapa2_confirmado']
        
        return X_etapa1, y_etapa1, X_etapa2, y_etapa2, features
    
    def entrenar_modelo_multiclase(self, df):
        """Entrena modelo de clasificación multiclase"""
        print(f" Entrenando modelo MULTICLASE para {self.telescopio}...")
        
        X, y, features = self.preparar_datos_multiclase(df)
        self.features['multiclase'] = features
        
        # División de datos
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )
        
        # Escalado
        scaler = StandardScaler()
        X_train_esc = scaler.fit_transform(X_train)
        X_test_esc = scaler.transform(X_test)
        self.scalers['multiclase'] = scaler
        
        # Modelo Stacking para multiclase
        base_estimators = [
            ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
            ('lr', LogisticRegression(max_iter=1000, random_state=42))
        ]
        
        modelo = StackingClassifier(
            estimators=base_estimators,
            final_estimator=LogisticRegression(max_iter=1000, random_state=42),
            cv=3
        )
        
        modelo.fit(X_train_esc, y_train)
        
        # Evaluación
        y_pred = modelo.predict(X_test_esc)
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        self.modelos['multiclase'] = modelo
        self.metricas['multiclase'] = {
            'accuracy': accuracy,
            'f1_score': f1,
            'clases': y.unique()
        }
        
        print(f" Modelo multiclase {self.telescopio} - Accuracy: {accuracy:.3f}, F1: {f1:.3f}")
        print(f"   Reporte:\n{classification_report(y_test, y_pred)}")
        
        return modelo, scaler, features
    
    def entrenar_modelo_binario_2etapas(self, df):
        """Entrena modelo de clasificación binaria en 2 etapas"""
        print(f" Entrenando modelo BINARIO 2-ETAPAS para {self.telescopio}...")
        
        X1, y1, X2, y2, features = self.preparar_datos_binario_2etapas(df)
        self.features['binario'] = features
        
        # División de datos etapa 1
        X1_train, X1_test, y1_train, y1_test = train_test_split(
            X1, y1, test_size=0.3, random_state=42, stratify=y1
        )
        
        # División de datos etapa 2
        X2_train, X2_test, y2_train, y2_test = train_test_split(
            X2, y2, test_size=0.3, random_state=42, stratify=y2
        )
        
        # Escalado
        scaler1 = StandardScaler()
        scaler2 = StandardScaler()
        
        X1_train_esc = scaler1.fit_transform(X1_train)
        X1_test_esc = scaler1.transform(X1_test)
        
        X2_train_esc = scaler2.fit_transform(X2_train)
        X2_test_esc = scaler2.transform(X2_test)
        
        self.scalers['binario_etapa1'] = scaler1
        self.scalers['binario_etapa2'] = scaler2
        
        # Modelos Stacking
        base_estimators = [
            ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
            ('lr', LogisticRegression(max_iter=1000, random_state=42))
        ]
        
        modelo_etapa1 = StackingClassifier(
            estimators=base_estimators,
            final_estimator=LogisticRegression(max_iter=1000, random_state=42),
            cv=3
        )
        
        modelo_etapa2 = StackingClassifier(
            estimators=base_estimators,
            final_estimator=LogisticRegression(max_iter=1000, random_state=42),
            cv=3
        )
        
        # Entrenamiento
        modelo_etapa1.fit(X1_train_esc, y1_train)
        modelo_etapa2.fit(X2_train_esc, y2_train)
        
        # Evaluación etapa 1
        y1_pred = modelo_etapa1.predict(X1_test_esc)
        acc1 = accuracy_score(y1_test, y1_pred)
        f1_1 = f1_score(y1_test, y1_pred)
        
        # Evaluación etapa 2
        y2_pred = modelo_etapa2.predict(X2_test_esc)
        acc2 = accuracy_score(y2_test, y2_pred)
        f1_2 = f1_score(y2_test, y2_pred)
        
        self.modelos['binario_etapa1'] = modelo_etapa1
        self.modelos['binario_etapa2'] = modelo_etapa2
        
        self.metricas['binario'] = {
            'etapa1_accuracy': acc1,
            'etapa1_f1': f1_1,
            'etapa2_accuracy': acc2, 
            'etapa2_f1': f1_2
        }
        
        print(f" Modelo binario {self.telescopio}")
        print(f"   Etapa 1 - Accuracy: {acc1:.3f}, F1: {f1_1:.3f}")
        print(f"   Etapa 2 - Accuracy: {acc2:.3f}, F1: {f1_2:.3f}")
        
        return modelo_etapa1, modelo_etapa2, scaler1, scaler2, features
    
    def guardar_modelos(self, sufijo=""):
        """Guarda todos los modelos del telescopio"""
        modelo_data = {
            'telescopio': self.telescopio,
            'modelos': self.modelos,
            'scalers': self.scalers,
            'features': self.features,
            'metricas': self.metricas
        }
        
        archivo = f"modelo_{self.telescopio}.joblib"
        joblib.dump(modelo_data, archivo)
        print(f" Modelos {self.telescopio} guardados en: {archivo}")