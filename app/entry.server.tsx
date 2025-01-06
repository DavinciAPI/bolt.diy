import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';

// Import from browser bundle instead
import { renderToReadableStream } from 'react-dom/server.browser';

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

  const head = await renderHeadToString({ request, remixContext, Head });
  
  let didError = false;
  const stream = await renderToReadableStream(
    <RemixServer
      context={remixContext}
      url={request.url}
    />,
    {
      [callbackName]: () => {
        const body = new ReadableStream({
          start(controller) {
            controller.enqueue(head);
          },
        });
        responseHeaders.set('Content-Type', 'text/html');
        return new Response(body, {
          headers: responseHeaders,
          status: didError ? 500 : responseStatusCode,
        });
      },
      onError(error) {
        didError = true;
        console.error(error);
      },
    }
  );

  return stream;
}
