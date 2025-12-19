import * as huxyServer from './src/index.js';

const {startApp, logger} = huxyServer;

const config = {
  port: 1234,
  apiPrefix: '/example',
  // proxyConfig
  proxys: [{
    name: 'ollama',
    target: 'http://192.168.0.111:11434',
  }],
  // jwtConfig
  secret: '1234',
  expiresIn: '1d',
};

const callback = (huxyConfig, app, huxyServer, logger) => {
  app.get('/huxyConfig', (req, res) => {
    logger.info('详细配置：', huxyConfig);
    res.status(200).json({ 
      result: huxyConfig,
    });
  });
};

const huxyProxyServer = await startApp(config, callback);

logger.info(huxyProxyServer);