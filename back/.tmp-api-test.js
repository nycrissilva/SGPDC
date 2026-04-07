const http = require('http');
const urls = ['http://localhost:5001/api/funcionario', 'http://localhost:5001/api/alunos'];
(async () => {
  for (const url of urls) {
    const data = await new Promise((resolve, reject) => {
      http.get(url, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      }).on('error', reject);
    });
    console.log('URL', url);
    try {
      console.log(JSON.parse(data));
    } catch (e) {
      console.error('PARSE ERROR', e.message, data);
    }
  }
})();
