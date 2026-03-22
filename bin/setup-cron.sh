#!/bin/bash
# setup-cron.sh - Configura el cron job para el lector del BOE

# Obtener la ruta absoluta del directorio donde está este script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Ruta raíz del proyecto (un nivel arriba de bin/)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Buscar la ruta de node
NODE_BIN="$(which node)"
if [ -z "$NODE_BIN" ]; then
    echo "Error: node no encontrado en el PATH. Asegúrate de tener Node.js instalado."
    exit 1
fi

# Definir el comando a ejecutar (ajusta la ruta a tu script si es necesario)
COMMAND="cd $PROJECT_ROOT && $NODE_BIN app_server/jobs/boeIngestionJob.js >> $PROJECT_ROOT/logs/cron.log 2>&1"

# Definir la línea completa del crontab con un identificador único
# Usamos un comentario especial para identificar esta tarea
CRON_LINE="0 8 * * * # BOE_READER_JOB $COMMAND"

# Archivo temporal para manipular el crontab
TEMP_CRON=$(mktemp)

# Exportar el crontab actual a un archivo
crontab -l > "$TEMP_CRON" 2>/dev/null

# Verificar si ya existe la tarea (buscando el marcador)
if grep -q "# BOE_READER_JOB" "$TEMP_CRON"; then
    echo "Ya existe una entrada de cron para el lector del BOE. Se actualizará."
    # Eliminar la línea existente (las que contengan el marcador)
    grep -v "# BOE_READER_JOB" "$TEMP_CRON" > "${TEMP_CRON}.tmp"
    mv "${TEMP_CRON}.tmp" "$TEMP_CRON"
fi

# Agregar la nueva línea
echo "$CRON_LINE" >> "$TEMP_CRON"

# Instalar el nuevo crontab
crontab "$TEMP_CRON"

# Limpiar
rm "$TEMP_CRON"

echo "Cron job configurado correctamente:"
echo "$CRON_LINE"
echo "Se ejecutará todos los días a las 8:00 AM."
echo "Los logs se guardan en: $PROJECT_ROOT/logs/cron.log"