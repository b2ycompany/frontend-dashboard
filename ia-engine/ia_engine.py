# ia-engine/ia_engine.py (Versão Robô IA 2.0 - Completa)

import numpy as np
import datetime
import uuid
import time
from firebase_admin import credentials, firestore, initialize_app
import os
import random

# ==========================================================
# 1. CONFIGURAÇÃO DE CLIENTES E CENÁRIOS
# ==========================================================

# Mapeamento de Clientes e qual cenário de monitoramento eles utilizam
CLIENT_MONITORING_CONFIG = [
    {
        'client_id': 'BANCO_NACIONAL',
        'host': 'api-banco-01',
        'scenario': 'FLUXO_BANCARIO'
    },
    {
        'client_id': 'SEGUROS_AZUL',
        'host': 'portal-seguros-03',
        'scenario': 'SERVICO_SEGURO'
    },
    {
        'client_id': 'DB_CLOUD_FUSION',
        'host': 'db-postgres-prod',
        'scenario': 'INFRA_DB_PERFORMANCE'
    }
]

# Mapeamento de causa raiz e playbooks para simulação
PLAYBOOKS = {
    'Timeout no serviço de validação de documentos.': "onboarding_fix.yml",
    'Taxa de falha elevada na autenticação.': "auth_connection_reset.yml",
    'Volume de transações/s atingiu o limite do DB pool.': "db_volume_handle.yml",
    'Lentidão no motor de cálculo de risco.': "risk_engine_restart.yml",
    'Transação de longa duração causando locks.': "db_lock_kill.yml",
}

# ==========================================================
# 2. INICIALIZAÇÃO DO FIREBASE ADMIN
# ==========================================================

KEY_PATH = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', 'aiops-platform-admin-key.json')

try:
    cred = credentials.Certificate(KEY_PATH)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase Admin SDK inicializado com sucesso.")
except Exception as e:
    print(f"Erro ao inicializar Firebase Admin: {e}")
    exit()

# ---------------------------------------------------------------------
# --- 3. FUNÇÕES DE SIMULAÇÃO DE TICKETING E LOGS ---
# ---------------------------------------------------------------------

def simulate_ticket_creation(anomaly_details):
    """ Simula a abertura de um ticket (Jira/ServiceNow). """
    ticket_id = f"INC-{random.randint(10000, 99999)}"
    print(f"⚠️ TICKET ABERTO: {ticket_id} no sistema externo.")
    return ticket_id


def log_anomaly(data):
    """ Registra a anomalia ou evento normal no Firestore. """
    db.collection("anomalias").add(data)


def log_automation_execution(log_id, anomaly_record, playbook, execution_status):
    """ Salva o log de execução do robô na coleção 'automacao_logs'. """
    output_message = f"Correção automática para {anomaly_record['causaRaiz']} concluída. Status: {execution_status}"
    
    data = {
        "timestamp": datetime.datetime.now().isoformat(),
        "logID": log_id,
        "playbook": playbook,
        "status": execution_status,
        "output": output_message,
        "steps": [
            f"Ticket Aberto para Host: {anomaly_record['host']}",
            f"Playbook {playbook} acionado em {anomaly_record['host']}.",
            f"Status final da execução: {execution_status}"
        ]
    }
    db.collection('automacao_logs').document(log_id).set(data)
    print(f"✅ Log de Automação salvo. Status: {execution_status}")

# ---------------------------------------------------------------------
# --- 4. FUNÇÕES DE SIMULAÇÃO DE CENÁRIOS (Métricas) ---
# ---------------------------------------------------------------------

# Cenário 1.1: FLUXO_BANCARIO - Onboarding
def simulate_onboarding_capture(client_host):
    is_anomaly = datetime.datetime.now().minute % 5 == 0
    return {
        'value': np.random.normal(loc=8000, scale=1000) if is_anomaly else np.random.normal(loc=800, scale=100), 
        'is_anomaly': is_anomaly, 
        'causaRaiz': 'Timeout no serviço de validação de documentos.', 
        'metricName': 'onboarding_latency_ms', 
        'data_type': 'FLUXO_ONBOARDING', 
        'host': client_host
    }

# Cenário 1.2: FLUXO_BANCARIO - Autenticação
def simulate_authentication_capture(client_host):
    is_anomaly = datetime.datetime.now().minute % 7 == 0
    return {
        'value': np.random.uniform(5, 15) if is_anomaly else np.random.uniform(0.1, 1), 
        'is_anomaly': is_anomaly, 
        'causaRaiz': 'Taxa de falha elevada na autenticação.', 
        'metricName': 'auth_fail_rate_percent', 
        'data_type': 'APLICACAO_AUTH', 
        'host': client_host
    }

# Cenário 1.3: FLUXO_BANCARIO - Transação
def simulate_transaction_capture(client_host):
    is_anomaly = datetime.datetime.now().minute % 10 == 0
    return {
        'value': np.random.uniform(900, 1500) if is_anomaly else np.random.uniform(100, 500), 
        'is_anomaly': is_anomaly, 
        'causaRaiz': 'Volume de transações/s atingiu o limite do DB pool.', 
        'metricName': 'db_tps_volume', 
        'data_type': 'INFRA_TRANSACAO', 
        'host': client_host
    }

# Cenário 2: SERVIÇO DE SEGURO (Processamento de Sinistro)
def simulate_insurance_capture(client_host):
    is_anomaly = datetime.datetime.now().second % 12 == 0
    return {
        'value': np.random.normal(loc=7000, scale=1000) if is_anomaly else np.random.normal(loc=1500, scale=300), 
        'is_anomaly': is_anomaly, 
        'metricName': 'sinistro_processing_time_ms',
        'data_type': 'FLUXO_SINISTRO',
        'causaRaiz': 'Lentidão no motor de cálculo de risco.', 
        'host': client_host
    }

# Cenário 3: PERFORMANCE DE BANCO DE DADOS (Locks Ativos)
def simulate_db_performance_capture(client_host):
    is_anomaly = datetime.datetime.now().second % 18 == 0
    return {
        'value': np.random.randint(25, 50) if is_anomaly else np.random.randint(0, 10), 
        'is_anomaly': is_anomaly, 
        'metricName': 'active_db_locks',
        'data_type': 'INFRA_DB_LOCKS',
        'causaRaiz': 'Transação de longa duração causando locks.', 
        'host': client_host
    }

# ---------------------------------------------------------------------
# --- 5. EXECUÇÃO PRINCIPAL DE CAPTURA E PROCESSAMENTO ---
# ---------------------------------------------------------------------

def main_capture_loop():
    data_points = []
    current_timestamp = datetime.datetime.now().isoformat()
    
    for client in CLIENT_MONITORING_CONFIG:
        client_id = client['client_id']
        host = client['host']
        scenario = client['scenario']
        
        metrics_to_capture = []
        if scenario == 'FLUXO_BANCARIO':
            metrics_to_capture = [simulate_onboarding_capture, simulate_authentication_capture, simulate_transaction_capture]
        elif scenario == 'SERVICO_SEGURO':
            metrics_to_capture = [simulate_insurance_capture]
        elif scenario == 'INFRA_DB_PERFORMANCE':
            metrics_to_capture = [simulate_db_performance_capture]
            
        for capture_func in metrics_to_capture:
            data = capture_func(host)
            data_points.append({**data, 'client_id': client_id, 'timestamp': current_timestamp})
            
    return data_points

def process_and_alert(data_points):
    """ Processa os dados, abre tickets e inicia automação. """
    for data in data_points:
        log_id = str(uuid.uuid4())
        
        if data['is_anomaly']:
            
            # 1. ABRIR TICKET (PRIMEIRA AÇÃO DO FLUXO DE TROUBLESHOOTING)
            ticket_id = simulate_ticket_creation(data)
            
            # 2. DEFINIR STATUS INICIAL E REGISTRAR
            anomaly_record = {
                'timestamp': data['timestamp'],
                'metricName': data['metricName'],
                'value': data['value'],
                'host': data['host'],
                'causaRaiz': data['causaRaiz'],
                'status': 'TICKET_ABERTO', # Novo Status Profissional
                'logID': log_id,
                'data_type': data['data_type'],
                'client_id': data['client_id'],
                'ticket_id': ticket_id
            }
            log_anomaly(anomaly_record)
            
            print(f"🚨 ANOMALIA DETECTADA! Cliente: {data['client_id']} - Ticket: {ticket_id}")
            
            # 3. INICIAR AUTOMAÇÃO (ROBÔ)
            playbook = PLAYBOOKS.get(data['causaRaiz'], "default_reboot.yml")
            
            # Simula a execução e o resultado final
            execution_status = random.choice(["CORRIGIDO", "FALHA_CORRECAO"])
            
            print(f"🤖 Robô acionado. Playbook: {playbook} | Status Final: {execution_status}")
            
            # 4. SALVAR LOG DE AUTOMAÇÃO SEPARADAMENTE
            log_automation_execution(log_id, anomaly_record, playbook, execution_status)
            
            # 5. ATUALIZAR ANOMALIA COM STATUS FINAL
            db.collection('anomalias').document(log_id).set({'status': execution_status}, merge=True)
            
            print("------------------------------------------------------------------")

        else:
            # Registrar eventos normais
            data['status'] = 'NORMAL'
            data['logID'] = ""
            log_anomaly(data)
            print(f"✅ Normal: Cliente: {data['client_id']} - Tipo: {data['data_type']} = {data['value']:.2f}")

# ---------------------------------------------------------------------
# --- 6. LOOP PRINCIPAL (EXECUÇÃO CONTÍNUA) ---
# ---------------------------------------------------------------------

if __name__ == "__main__":
    print("Iniciando o Monitoramento Multicliente (AIOps Engine)...")
    while True:
        process_and_alert(main_capture_loop())
        time.sleep(10)