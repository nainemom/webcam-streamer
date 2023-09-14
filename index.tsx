import { ServerWebSocket } from 'bun';
import { streamWebcam } from './utils/webcam';
import { readArgv } from './utils/argv';

const { serve, file } = Bun;

const hostname = readArgv<string>(['-h', '--host'], 'string') || '0.0.0.0';
const port = readArgv<number>(['-p', '--port'], 'number') || 3000;
const input = readArgv<string>(['-i', '--input'], 'string') || '/dev/video0';
const auth = readArgv<string>(['-a', '--auth'], 'string') || 'admin:admin';

const stream = streamWebcam(input);

const subscribers = new Map<ServerWebSocket<unknown>, (chunk: Buffer) => void>();

const homePage = file(import.meta.resolveSync('./index.html'));

serve({
  fetch: async (request, server) => {
    const authHeader = Buffer.from((request.headers.get('authorization') || 'Basic Og==').split(' ')[1], 'base64').toString();
    if (authHeader !== auth) {
      return new Response(
        '',
        {
          headers: { "www-authenticate": "basic" },
          status: 401,
        },
      );
    }

    server.upgrade(request);

    return new Response(
      homePage,
      {
        headers: { "content-type": "text/html" },
        status: 200,
      },
    );
  },
  websocket: {
    perMessageDeflate: true,
    open: (ws) => {
      const handler = (image: Buffer) => {
        ws.send(image, true);
      }
      subscribers.set(ws, handler);
      stream.onData(handler);
    },
    close: (ws) => {
      const handler = subscribers.get(ws);
      if (handler) {
        subscribers.delete(ws);
        stream.offData(handler);
      }
    },
    message: () => {},
  },
  hostname,
  port,
});

console.log(`📹 Webcam Streamer is streaming "${input}" on ${hostname}:${port}`);