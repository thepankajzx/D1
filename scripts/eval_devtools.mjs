// scripts/eval_devtools.mjs
const expr = process.argv[2] || 'console.log("hello")';

async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const pages = await res.json();
  const page = pages[0];
  if (!page) {
    console.error('No page found');
    process.exit(1);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: expr,
        awaitPromise: true,
        returnByValue: true
      }
    }));
  };
  ws.onmessage = (msg) => {
    console.log(msg.data);
    ws.close();
    process.exit(0);
  };
  ws.onerror = (err) => {
    console.error(err);
    process.exit(1);
  };
}

main();
