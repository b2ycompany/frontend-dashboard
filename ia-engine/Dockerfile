# Dockerfile na pasta ia-engine

# Usa uma imagem base Python slim (ideal para ambientes de produção)
FROM python:3.11-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# 1. Copia o arquivo de requisitos e instala as dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copia o código principal do robô
# O arquivo ia_engine.py precisa estar no mesmo diretório
COPY ia_engine.py .

# 3. Instrução para a Chave de Serviço (CRÍTICO)
# Em produção, a chave JSON deve ser injetada de forma segura (via Secret Manager),
# não copiada diretamente do seu disco local para o container.
# Se for rodar localmente com Docker, você pode montar o volume ou copiar:
# COPY aiops-platform-admin-key.json . 

# 4. Define o comando para rodar o script (monitoramento contínuo)
CMD ["python", "ia_engine.py"]