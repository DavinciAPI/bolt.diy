import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server.browser';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  const callbackName = isbot(request.headers.get('user-agent'))
    ? 'onAllReady'
    : 'onShellReady';

  responseHeaders.set('Content-Type', 'text/html');
  
  const stream = await renderToReadableStream(
    <RemixServer context={remixContext} url={request.url} />,
    {
      [callbackName]() {
        return new Response(stream, {
          headers: responseHeaders,
          status: responseStatusCode
        });
      },
      onError(error) {
        console.error(error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }
  );

  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode
  });
}
