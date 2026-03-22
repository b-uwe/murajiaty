/**
 * @file Tests for service worker functionality
 */

describe( 'service worker fetch handler', () => {
  const originalSelf = global.self;

  afterAll( () => {
    global.self = originalSelf;
  } );

  test( 'should only search murajiaty cache, not all caches', async () => {
    let capturedFetchHandler;
    const mockCacheMatch = jest.fn().mockResolvedValue( undefined );
    const mockCacheOpen = jest.fn().mockResolvedValue( { 'match': mockCacheMatch } );
    const mockResponse = { 'body': 'test response' };

    global.caches = {
      'keys': jest.fn().mockResolvedValue( [] ),
      'delete': jest.fn().mockResolvedValue( true ),
      'open': mockCacheOpen,
      'match': jest.fn().mockResolvedValue( undefined )
    };
    global.clients = { 'claim': jest.fn().mockResolvedValue( undefined ) };
    global.fetch = jest.fn().mockResolvedValue( mockResponse );

    Object.defineProperty( global, 'self', {
      'value': {
        'addEventListener': jest.fn( ( eventType, handler ) => {
          if ( eventType === 'fetch' ) {
            capturedFetchHandler = handler;
          }
        } )
      },
      'writable': true,
      'configurable': true
    } );

    jest.resetModules();
    require( '../service-worker.js' );

    let respondWithPromise;
    const mockRequest = { 'url': 'https://example.com/test.js' };
    const mockEvent = {
      'request': mockRequest,
      'respondWith': jest.fn( ( promise ) => {
        respondWithPromise = promise;
      } )
    };

    capturedFetchHandler( mockEvent );
    await respondWithPromise;

    // Verify caches.open was called with the specific murajiaty cache name
    expect( mockCacheOpen ).toHaveBeenCalledWith( 'murajiaty-v6' );
    // Verify we used the specific cache's match, not the global caches.match
    expect( mockCacheMatch ).toHaveBeenCalledWith( mockRequest );
    expect( global.caches.match ).not.toHaveBeenCalled();
  } );

  test( 'should return cached response when available', async () => {
    let capturedFetchHandler;
    const cachedResponse = { 'body': 'cached content' };
    const mockCacheMatch = jest.fn().mockResolvedValue( cachedResponse );

    global.caches = {
      'keys': jest.fn().mockResolvedValue( [] ),
      'delete': jest.fn().mockResolvedValue( true ),
      'open': jest.fn().mockResolvedValue( { 'match': mockCacheMatch } ),
      'match': jest.fn().mockResolvedValue( undefined )
    };
    global.clients = { 'claim': jest.fn().mockResolvedValue( undefined ) };
    global.fetch = jest.fn();

    Object.defineProperty( global, 'self', {
      'value': {
        'addEventListener': jest.fn( ( eventType, handler ) => {
          if ( eventType === 'fetch' ) {
            capturedFetchHandler = handler;
          }
        } )
      },
      'writable': true,
      'configurable': true
    } );

    jest.resetModules();
    require( '../service-worker.js' );

    let respondWithPromise;
    const mockEvent = {
      'request': { 'url': 'https://example.com/test.js' },
      'respondWith': jest.fn( ( promise ) => {
        respondWithPromise = promise;
      } )
    };

    capturedFetchHandler( mockEvent );
    const response = await respondWithPromise;

    expect( response ).toBe( cachedResponse );
    expect( global.fetch ).not.toHaveBeenCalled();
  } );

  test( 'should fetch from network when not in cache', async () => {
    let capturedFetchHandler;
    const networkResponse = { 'body': 'network content' };
    const mockCacheMatch = jest.fn().mockResolvedValue( undefined );

    global.caches = {
      'keys': jest.fn().mockResolvedValue( [] ),
      'delete': jest.fn().mockResolvedValue( true ),
      'open': jest.fn().mockResolvedValue( { 'match': mockCacheMatch } ),
      'match': jest.fn().mockResolvedValue( undefined )
    };
    global.clients = { 'claim': jest.fn().mockResolvedValue( undefined ) };
    global.fetch = jest.fn().mockResolvedValue( networkResponse );

    Object.defineProperty( global, 'self', {
      'value': {
        'addEventListener': jest.fn( ( eventType, handler ) => {
          if ( eventType === 'fetch' ) {
            capturedFetchHandler = handler;
          }
        } )
      },
      'writable': true,
      'configurable': true
    } );

    jest.resetModules();
    require( '../service-worker.js' );

    let respondWithPromise;
    const mockRequest = { 'url': 'https://example.com/test.js' };
    const mockEvent = {
      'request': mockRequest,
      'respondWith': jest.fn( ( promise ) => {
        respondWithPromise = promise;
      } )
    };

    capturedFetchHandler( mockEvent );
    const response = await respondWithPromise;

    expect( response ).toBe( networkResponse );
    expect( global.fetch ).toHaveBeenCalledWith( mockRequest );
  } );
} );

describe( 'service worker cache cleanup', () => {
  const originalSelf = global.self;

  afterAll( () => {
    global.self = originalSelf;
  } );

  test( 'should delete old murajiaty caches during activation', async () => {
    const deletedCaches = [];
    let capturedActivateHandler;

    global.caches = {
      'keys': jest.fn().mockResolvedValue( [
        'murajiaty-v6',
        'murajiaty-old-cache',
        'murajiaty-v0'
      ] ),
      'delete': jest.fn( ( cacheName ) => {
        deletedCaches.push( cacheName );
        return Promise.resolve( true );
      } ),
      'open': jest.fn().mockResolvedValue( { 'addAll': jest.fn().mockResolvedValue( undefined ) } ),
      'match': jest.fn().mockResolvedValue( undefined )
    };
    global.clients = { 'claim': jest.fn().mockResolvedValue( undefined ) };
    global.fetch = jest.fn();

    // Override self using Object.defineProperty
    Object.defineProperty( global, 'self', {
      'value': {
        'addEventListener': jest.fn( ( eventType, handler ) => {
          if ( eventType === 'activate' ) {
            capturedActivateHandler = handler;
          }
        } )
      },
      'writable': true,
      'configurable': true
    } );

    jest.resetModules();
    require( '../service-worker.js' );

    let waitUntilPromise;
    const mockEvent = {
      'waitUntil': jest.fn( ( promise ) => {
        waitUntilPromise = promise;
      } )
    };

    capturedActivateHandler( mockEvent );
    await waitUntilPromise;

    expect( deletedCaches ).toContain( 'murajiaty-old-cache' );
    expect( deletedCaches ).toContain( 'murajiaty-v0' );
    expect( deletedCaches ).not.toContain( 'murajiaty-v6' );
  } );

  test( 'should NOT delete caches from other PWAs on same origin', async () => {
    const deletedCaches = [];
    let capturedActivateHandler;

    global.caches = {
      'keys': jest.fn().mockResolvedValue( [
        'murajiaty-v6',
        'musajjil-v1',
        'other-pwa-cache',
        'workbox-cache'
      ] ),
      'delete': jest.fn( ( cacheName ) => {
        deletedCaches.push( cacheName );
        return Promise.resolve( true );
      } ),
      'open': jest.fn().mockResolvedValue( { 'addAll': jest.fn().mockResolvedValue( undefined ) } ),
      'match': jest.fn().mockResolvedValue( undefined )
    };
    global.clients = { 'claim': jest.fn().mockResolvedValue( undefined ) };
    global.fetch = jest.fn();

    Object.defineProperty( global, 'self', {
      'value': {
        'addEventListener': jest.fn( ( eventType, handler ) => {
          if ( eventType === 'activate' ) {
            capturedActivateHandler = handler;
          }
        } )
      },
      'writable': true,
      'configurable': true
    } );

    jest.resetModules();
    require( '../service-worker.js' );

    let waitUntilPromise;
    const mockEvent = {
      'waitUntil': jest.fn( ( promise ) => {
        waitUntilPromise = promise;
      } )
    };

    capturedActivateHandler( mockEvent );
    await waitUntilPromise;

    expect( deletedCaches ).not.toContain( 'musajjil-v1' );
    expect( deletedCaches ).not.toContain( 'other-pwa-cache' );
    expect( deletedCaches ).not.toContain( 'workbox-cache' );
    expect( deletedCaches ).not.toContain( 'murajiaty-v6' );
  } );

  test( 'should delete only murajiaty-prefixed caches that are not current', async () => {
    const deletedCaches = [];
    let capturedActivateHandler;

    global.caches = {
      'keys': jest.fn().mockResolvedValue( [
        'murajiaty-v6',
        'murajiaty-v1',
        'musajjil-cache',
        'another-app'
      ] ),
      'delete': jest.fn( ( cacheName ) => {
        deletedCaches.push( cacheName );
        return Promise.resolve( true );
      } ),
      'open': jest.fn().mockResolvedValue( { 'addAll': jest.fn().mockResolvedValue( undefined ) } ),
      'match': jest.fn().mockResolvedValue( undefined )
    };
    global.clients = { 'claim': jest.fn().mockResolvedValue( undefined ) };
    global.fetch = jest.fn();

    Object.defineProperty( global, 'self', {
      'value': {
        'addEventListener': jest.fn( ( eventType, handler ) => {
          if ( eventType === 'activate' ) {
            capturedActivateHandler = handler;
          }
        } )
      },
      'writable': true,
      'configurable': true
    } );

    jest.resetModules();
    require( '../service-worker.js' );

    let waitUntilPromise;
    const mockEvent = {
      'waitUntil': jest.fn( ( promise ) => {
        waitUntilPromise = promise;
      } )
    };

    capturedActivateHandler( mockEvent );
    await waitUntilPromise;

    expect( deletedCaches ).toEqual( [ 'murajiaty-v1' ] );
  } );

  test( 'should claim clients after cache cleanup', async () => {
    let capturedActivateHandler;
    const mockClients = { 'claim': jest.fn().mockResolvedValue( undefined ) };

    global.caches = {
      'keys': jest.fn().mockResolvedValue( [ 'murajiaty-v6' ] ),
      'delete': jest.fn().mockResolvedValue( true ),
      'open': jest.fn().mockResolvedValue( { 'addAll': jest.fn().mockResolvedValue( undefined ) } ),
      'match': jest.fn().mockResolvedValue( undefined )
    };
    global.clients = mockClients;
    global.fetch = jest.fn();

    Object.defineProperty( global, 'self', {
      'value': {
        'addEventListener': jest.fn( ( eventType, handler ) => {
          if ( eventType === 'activate' ) {
            capturedActivateHandler = handler;
          }
        } )
      },
      'writable': true,
      'configurable': true
    } );

    jest.resetModules();
    require( '../service-worker.js' );

    let waitUntilPromise;
    const mockEvent = {
      'waitUntil': jest.fn( ( promise ) => {
        waitUntilPromise = promise;
      } )
    };

    capturedActivateHandler( mockEvent );
    await waitUntilPromise;

    expect( mockClients.claim ).toHaveBeenCalled();
  } );
} );
