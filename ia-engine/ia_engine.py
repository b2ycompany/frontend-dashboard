# ia-engine/ia_engine.py
# CÓDIGO COMPLETO PARA MONITORAMENTO MULTICLIENTE (AIOPS ENGINE)

import numpy as np
import datetime
import uuid
import time

# Bibliotecas Firebase e Requisições
import firebase_admin
from firebase_admin import credentials, firestore
import requests 

# --- 1. CONFIGURAÇÃO DE CLIENTES E CENÁRIOS ---

# Mapeamento de Clientes e qual cenário de monitoramento eles utilizam
CLIENT_MONITORING_CONFIG = [
    {
        'client_id': 'BANCO_NACIONAL',
        'host': 'api-banco-01',
        'scenario': 'FLUXO_BANCARIO' # Onboarding, Auth, Transação
    },
    {
        'client_id': 'SEGUROS_AZUL',
        'host': 'portal-seguros-03',
        'scenario': 'SERVICO_SEGURO' # Processamento de Sinistro
    },
    {
        'client_id': 'DB_CLOUD_FUSION',
        'host': 'db-postgres-prod',
        'scenario': 'INFRA_DB_PERFORMANCE' # Locks, Latência de Query
    }
]

# --- 2. INICIALIZAÇÃO DO FIREBASE ADMIN ---

try:
    # Aponte para o arquivo JSON da sua Service Account do Firebase
    cred = credentials.Certificate('aiops-platform-admin-key.json') 
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase Admin SDK inicializado com sucesso.")
except Exception as e:
    print(f"Erro ao inicializar Firebase Admin: {e}")
    exit()

# ---------------------------------------------------------------------
# --- 3. FUNÇÕES DE SIMULAÇÃO DE CENÁRIOS DE MONITORAMENTO ---

# Cenário 1.1: FLUXO_BANCARIO - Onboarding
def simulate_onboarding_capture(client_host):
    """ Simula lentidão no Onboarding (PF/PJ) """
    if datetime.datetime.now().minute % 5 == 0: 
        return {'value': np.random.normal(loc=8000, scale=1000), 'is_anomaly': True, 'causaRaiz': 'Timeout no serviço de validação de documentos.', 'metricName': 'onboarding_latency_ms', 'data_type': 'FLUXO_ONBOARDING', 'host': client_host}
    return {'value': np.random.normal(loc=800, scale=100), 'is_anomaly': False, 'causaRaiz': 'Normal.', 'metricName': 'onboarding_latency_ms', 'data_type': 'FLUXO_ONBOARDING', 'host': client_host}

# Cenário 1.2: FLUXO_BANCARIO - Autenticação
def simulate_authentication_capture(client_host):
    """ Simula taxa alta de falha na Autenticação """
    if datetime.datetime.now().minute % 7 == 0: 
        return {'value': np.random.uniform(5, 15), 'is_anomaly': True, 'causaRaiz': 'Taxa de falha elevada na autenticação.', 'metricName': 'auth_fail_rate_percent', 'data_type': 'APLICACAO_AUTH', 'host': client_host}
    return {'value': np.random.uniform(0.1, 1), 'is_anomaly': False, 'causaRaiz': 'Normal.', 'metricName': 'auth_fail_rate_percent', 'data_type': 'APLICACAO_AUTH', 'host': client_host}

# Cenário 1.3: FLUXO_BANCARIO - Transação
def simulate_transaction_capture(client_host):
    """ Simula volume excessivo de Transações ou lentidão na DB """
    if datetime.datetime.now().minute % 10 == 0: 
        return {'value': np.random.uniform(900, 1500), 'is_anomaly': True, 'causaRaiz': 'Volume de transações/s atingiu o limite do DB pool.', 'metricName': 'db_tps_volume', 'data_type': 'INFRA_TRANSACAO', 'host': client_host}
    return {'value': np.random.uniform(100, 500), 'is_anomaly': False, 'causaRaiz': 'Normal.', 'metricName': 'db_tps_volume', 'data_type': 'INFRA_TRANSACAO', 'host': client_host}

# Cenário 2: SERVIÇO DE SEGURO (Processamento de Sinistro)
def simulate_insurance_capture(client_host):
    """ Simula o tempo de processamento de um sinistro (Fluxo Crítico) """
    if datetime.datetime.now().second % 12 == 0: 
        return {
            'value': np.random.normal(loc=7000, scale=1000), 
            'is_anomaly': True, 
            'metricName': 'sinistro_processing_time_ms',
            'data_type': 'FLUXO_SINISTRO',
            'causaRaiz': 'Lentidão no motor de cálculo de risco.', 
            'host': client_host
        }
    return {
        'value': np.random.normal(loc=1500, scale=300), 
        'is_anomaly': False, 
        'metricName': 'sinistro_processing_time_ms',
        'data_type': 'FLUXO_SINISTRO',
        'causaRaiz': 'Normal.', 
        'host': client_host
    }

# Cenário 3: PERFORMANCE DE BANCO DE DADOS (Locks Ativos)
def simulate_db_performance_capture(client_host):
    """ Simula locks ativos no DB (Performance) """
    if datetime.datetime.now().second % 18 == 0: 
        return {
            'value': np.random.randint(25, 50), 
            'is_anomaly': True, 
            'metricName': 'active_db_locks',
            'data_type': 'INFRA_DB_LOCKS',
            'causaRaiz': 'Transação de longa duração causando locks.', 
            'host': client_host
        }
    return {
        'value': np.random.randint(0, 10), 
        'is_anomaly': False, 
        'metricName': 'active_db_locks',
        'data_type': 'INFRA_DB_LOCKS',
        'causaRaiz': 'Normal.', 
        'host': client_host
    }

# ---------------------------------------------------------------------
# --- 4. EXECUÇÃO PRINCIPAL DE CAPTURA E PROCESSAMENTO ---

def main_capture_loop():
    """ Executa a captura de métricas para todos os clientes configurados. """
    
    data_points = []
    current_timestamp = datetime.datetime.now().isoformat()
    
    for client in CLIENT_MONITORING_CONFIG:
        client_id = client['client_id']
        host = client['host']
        scenario = client['scenario']
        
        # 1. CENÁRIO FLUXO BANCÁRIO (Combina 3 métricas)
        if scenario == 'FLUXO_BANCARIO':
            
            # Onboarding
            onboard_data = simulate_onboarding_capture(host)
            data_points.append({**onboard_data, 'client_id': client_id, 'timestamp': current_timestamp})
            
            # Autenticação
            auth_data = simulate_authentication_capture(host)
            data_points.append({**auth_data, 'client_id': client_id, 'timestamp': current_timestamp})

            # Transação
            transact_data = simulate_transaction_capture(host)
            data_points.append({**transact_data, 'client_id': client_id, 'timestamp': current_timestamp})
            
        # 2. CENÁRIO SERVIÇO DE SEGURO
        elif scenario == 'SERVICO_SEGURO':
            insurance_data = simulate_insurance_capture(host)
            data_points.append({**insurance_data, 'client_id': client_id, 'timestamp': current_timestamp})
            
        # 3. CENÁRIO PERFORMANCE DE BANCO DE DADOS
        elif scenario == 'INFRA_DB_PERFORMANCE':
            db_perf_data = simulate_db_performance_capture(host)
            data_points.append({**db_perf_data, 'client_id': client_id, 'timestamp': current_timestamp})
            
    return data_points

def trigger_automation_robot(anomaly_data):
    """Seleciona o playbook correto baseado no tipo de anomalia e simula a execução."""
    log_id = anomaly_data['logID']
    playbook_to_run = ""
    correction_details = ""

    # Lógica de Triagem Centralizada
    if anomaly_data['data_type'] == 'FLUXO_ONBOARDING':
        playbook_to_run = "onboarding_fix.yml"
        correction_details = "Reinício de serviço de Onboarding."
    elif anomaly_data['data_type'] == 'APLICACAO_AUTH':
        playbook_to_run = "auth_connection_reset.yml"
        correction_details = "Reset de conexão de autenticação."
    elif anomaly_data['data_type'] == 'INFRA_TRANSACAO':
        playbook_to_run = "db_volume_handle.yml"
        correction_details = "Aumento do Pool de Conexões do DB (Transação)."
    elif anomaly_data['data_type'] == 'FLUXO_SINISTRO': 
        playbook_to_run = "risk_engine_restart.yml"
        correction_details = "Reinício do Motor de Risco (Seguros)."
    elif anomaly_data['data_type'] == 'INFRA_DB_LOCKS': 
        playbook_to_run = "db_lock_kill.yml"
        correction_details = "Tentativa de matar sessão de DB com locks ativos."
    else:
        playbook_to_run = "default_reboot.yml"
        correction_details = "Ação padrão: Reboot de componente."

    print(f"🤖 Robô acionado. Playbook selecionado: {playbook_to_run} para Host: {anomaly_data['host']}")

    # --- SIMULAÇÃO DA EXECUÇÃO E REPORTE PARA FIRESTORE ---
    log_report = {
        'logID': log_id,
        'runStart': datetime.datetime.now().isoformat(),
        'command': f"ansible-playbook {playbook_to_run} -e target_host={anomaly_data['host']}",
        'status': 'SUCESSO', 
        'details': f"Correção automática: {correction_details}"
    }

    db.collection('automacao_logs').document(log_id).set(log_report)
    print(f"✅ Log de Automação salvo. Status: {log_report['status']}")
    print("------------------------------------------------------------------")


def process_and_alert(data_points):
    """Processa todos os dados capturados, detecta anomalias e salva no Firestore."""
    for data in data_points:
        if data['is_anomaly']:
            log_id = str(uuid.uuid4())
            anomaly_record = {
                'timestamp': data['timestamp'],
                'metricName': data['metricName'],
                'value': data['value'],
                'host': data['host'],
                'causaRaiz': data['causaRaiz'],
                'status': 'PENDENTE', 
                'logID': log_id,
                'data_type': data['data_type'],
                'client_id': data['client_id'] # Salva o ID do Cliente
            }
            
            db.collection('anomalias').add(anomaly_record)
            
            print(f"🚨 ANOMALIA DETECTADA! Cliente: {data['client_id']} - Tipo: {data['data_type']} - Métrica: {data['metricName']} = {data['value']:.2f}")
            
            trigger_automation_robot(anomaly_record)
            
        else:
            print(f"✅ Normal: Cliente: {data['client_id']} - Tipo: {data['data_type']} - Métrica: {data['metricName']} = {data['value']:.2f}")

# ---------------------------------------------------------------------
# --- 5. LOOP PRINCIPAL (EXECUÇÃO CONTÍNUA) ---

if __name__ == "__main__":
    print("Iniciando o Monitoramento Multicliente (AIOps Engine)...")
    while True:
        captured_data = main_capture_loop()
        process_and_alert(captured_data)
        time.sleep(10)