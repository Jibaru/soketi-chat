/**
 * Genera config.ts desde variables de entorno durante el build
 * Este script se ejecuta en el servidor antes de compilar el TypeScript
 */

import { writeFileSync } from 'fs';

// Lee las variables de entorno o usa valores por defecto
const config = {
    pusher: {
        appKey: process.env.PUSHER_APP_KEY || 'app-key',
        wsHost: process.env.PUSHER_WS_HOST || '127.0.0.1',
        wsPort: parseInt(process.env.PUSHER_WS_PORT || '6001'),
        forceTLS: process.env.PUSHER_FORCE_TLS === 'true',
        cluster: process.env.PUSHER_CLUSTER || 'mt1',
        enabledTransports: ['ws', 'wss']
    },
    channel: {
        name: process.env.PUSHER_CHANNEL || 'chat-room'
    }
};

// Genera el archivo config.ts
const configContent = `/**
 * Configuración generada automáticamente desde variables de entorno
 * NO EDITAR - Este archivo se genera durante el build
 */

export const config = ${JSON.stringify(config, null, 4)};
`;

writeFileSync('config.ts', configContent);
console.log('✓ config.ts generado desde variables de entorno');
