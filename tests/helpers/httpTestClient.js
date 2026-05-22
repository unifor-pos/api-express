const http = require('node:http');

function buildRequestOptions(options = {}) {
  const requestOptions = { ...options };

  if (requestOptions.body && typeof requestOptions.body === 'object') {
    requestOptions.body = JSON.stringify(requestOptions.body);
    requestOptions.headers = {
      'content-type': 'application/json',
      ...(requestOptions.headers || {})
    };
  }

  return requestOptions;
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

async function createHttpTestClient(app) {
  const server = http.createServer(app);

  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', resolve);
    server.on('error', reject);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    async request(path, options = {}) {
      const response = await fetch(`${baseUrl}${path}`, buildRequestOptions(options));
      return {
        status: response.status,
        body: await parseResponse(response)
      };
    },
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  };
}

module.exports = createHttpTestClient;
