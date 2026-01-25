FROM python:3.9-slim

# Install Node.js and npm for dependency checking
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# We will mount the volume at runtime, so we don't strictly need to copy files here
# But we need to ensure the script is runnable.
# The command will be python scripts/security_audit.py

CMD ["python", "scripts/security_audit.py"]
