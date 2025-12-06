# ia-engine/ia_engine.py
import pandas as pd
from sklearn.ensemble import IsolationForest
import numpy as np
import datetime
import uuid
import json

# Instale o Admin SDK: pip install firebase-admin
import firebase_admin
from firebase_admin import credentials, firestore

# --- 1. Inicialização do Firebase Admin ---
# Baixe o arquivo JSON de chave privada do Firebase e coloque-o na pasta ia-engine
# Substitua 'caminho/para/sua-chave.json' pelo caminho real do arquivo
try:
    cred = credentials.Certificate('aiops-platform-admin-key.json') 
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase Admin SDK inicializado com sucesso.")
except Exception as e:
    print(f"Erro ao inicializar Firebase Admin: {e}")
    exit()

# --- 2. Simulação de Dados de Séries Temporais (Captura) ---
def simulate_data_capture():
    """Simula a captura de métricas do servidor (CPU)"""
    np.random.seed(int(datetime.datetime.now().timestamp()))
    
    # 95% de chance de ser normal, 5% de chance de ser anomalia
    is_anomaly = np.random.rand() < 0.05
    
    if is_anomaly:
        cpu_usage = np.random.normal(loc=95, scale=5) # Pico anômalo
        causa = "Causa Raiz: Processo desconhecido consumindo CPU."
    else:
        cpu_usage = np.random.normal(loc=50, scale=10) # Uso normal
        causa = "Tráfego normal."

    cpu_usage = max(0, min(100, cpu_usage)) # Limita entre 0 e 100
    
    return {
        'timestamp': datetime.datetime.now().isoformat(),
        'metricName': 'cpu_usage_percent',
        'value': float(cpu_usage),
        'host': 'webserver-prod-01',
        'is_anomaly': is_anomaly,
        'causaRaiz': causa
    }

# --- 3. Função de Detecção de Anomalias (Simulação de IA) ---
def process_and_alert(data):
    """Processa dados, detecta anomalias e salva no Firestore."""
    
    # Treinamento de IA real usaria dados históricos para treinar o modelo IsolationForest
    # Aqui, a IA é simplificada: se 'is_anomaly' for True (simulação de pico), dispara
    
    if data['is_anomaly']:
        log_id = str(uuid.uuid4())
        anomaly_record = {
            'timestamp': data['timestamp'],
            'metricName': data['metricName'],
            'value': data['value'],
            'host': data['host'],
            'causaRaiz': data['causaRaiz'],
            'status': 'PENDENTE', # Status inicial: Aguardando robô de automação
            'logID': log_id 
        }
        
        # Salva a anomalia na coleção 'anomalias' (Visto pelo Dashboard)
        db.collection('anomalias').add(anomaly_record)
        print(f"🚨 ANOMALIA DETECTADA! Enviada ao Firestore. LogID: {log_id}")
        
        # Chama a função de Automação (Robô)
        trigger_automation_robot(anomaly_record)
        
    else:
        print(f"✅ Dados Normais: {data['metricName']} = {data['value']:.2f}")

# --- 4. Função de Automação (Robô) ---
def trigger_automation_robot(anomaly_data):
    """
    Simula o acionamento do Robô Ansible via um script de sistema.
    Em um ambiente real, isto seria uma chamada API para um Job Scheduler (e.g., Jenkins, Rundeck)
    ou um comando SSH/Ansible.
    """
    
    # Comando de exemplo (em um servidor Linux com Ansible instalado)
    # subprocess.run(["ansible-playbook", "/caminho/para/restart_service.yml", 
    #                "-e", f"target_host={anomaly_data['host']} anomaly_id={anomaly_data['logID']}"])
    
    print(f"🤖 Robô acionado para host {anomaly_data['host']} com ID {anomaly_data['logID']}. Executando Ansible...")

    # Simulação do resultado do robô após 5 segundos
    # Em uma implementação real, o script Ansible Reportaria seu status de volta ao Firestore
    log_report = {
        'logID': anomaly_data['logID'],
        'runStart': datetime.datetime.now().isoformat(),
        'command': 'ansible-playbook restart_service.yml',
        'status': 'SUCESSO',
        'details': 'Serviço webapp_service reiniciado com sucesso.'
    }

    # 5. Salva o Log de Automação no Firestore (Visto pelo Dashboard)
    db.collection('automacao_logs').document(anomaly_data['logID']).set(log_report)
    
    # 6. Atualiza o status da Anomalia para 'CORRIGIDO'
    # Esta parte é complexa, exigindo buscar o ID do documento de anomalia,
    # mas simplificamos aqui assumindo que a correção foi bem-sucedida.
    
    print(f"✅ Log de Automação salvo com status: {log_report['status']}")
    print("------------------------------------------------------------------")

# --- 5. Loop Principal (Monitoramento Contínuo) ---
if __name__ == "__main__":
    while True:
        captured_data = simulate_data_capture()
        process_and_alert(captured_data)
        
        # Simula o intervalo de monitoramento (e.g., a cada 10 segundos)
        import time
        time.sleep(10)