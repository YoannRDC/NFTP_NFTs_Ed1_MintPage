import pino from 'pino';

// Configurez vos variables d'environnement pour le token et l'endpoint
const sourceToken = process.env.LOGTAIL_SOURCE_TOKEN_API;
const ingestingHost = process.env.INGESTING_HOST || 'in.logtail.com';

const transport = pino.transport({
  target: '@logtail/pino',
  options: {
    sourceToken: process.env.LOGTAIL_SOURCE_TOKEN_API,
    options: { endpoint: `https://${ingestingHost}` },
  },
});

const logger = pino(transport);

export default logger;
