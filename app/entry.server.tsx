import { renderToReadableStream } from 'react-dom/server.browser';
import { RemixServer } from '@remix-run/react';
import type { EntryContext } from '@remix-run/cloudflare';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const stream = await renderToReadableStream(
    <RemixServer context={remixContext} url={request.url} />,
    {
      onShellReady() {
        responseHeaders.set('Content-Type', 'text/html');
        return new Response(stream, {
          headers: responseHeaders,
          status: responseStatusCode,
        });
      },
      onError(error) {
        console.error(error);
        responseHeaders.set('Content-Type', 'text/html');
        return new Response('Internal Server Error', {
          headers: responseHeaders,
          status: 500,
        });
      },
    }
  );
  return stream;
}
