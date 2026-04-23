FROM python:3.12-slim

WORKDIR /app

# Install prerequisites
RUN apt-get update && apt-get install -y \
    curl gnupg wget unzip apt-transport-https \
    libzbar0 unixodbc unixodbc-dev gcc libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

# Add Microsoft repo key and list (Debian 12 / bookworm)
RUN curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" \
       > /etc/apt/sources.list.d/mssql-release.list

# Install ODBC Driver 18 and tools
RUN apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 mssql-tools18 \
    && echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> /etc/bash.bashrc \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="$PATH:/opt/mssql-tools18/bin"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]

