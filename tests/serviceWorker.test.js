/**
 * @file Tests for service worker cache cleanup functionality
 */

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
        'murajiaty-v1',
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
    expect( deletedCaches ).not.toContain( 'murajiaty-v1' );
  } );

  test( 'should NOT delete caches from other PWAs on same origin', async () => {
    const deletedCaches = [];
    let capturedActivateHandler;

    global.caches = {
      'keys': jest.fn().mockResolvedValue( [
        'murajiaty-v1',
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
    expect( deletedCaches ).not.toContain( 'murajiaty-v1' );
  } );

  test( 'should delete only murajiaty-prefixed caches that are not current', async () => {
    const deletedCaches = [];
    let capturedActivateHandler;

    global.caches = {
      'keys': jest.fn().mockResolvedValue( [
        'murajiaty-v1',
        'murajiaty-v2',
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

    expect( deletedCaches ).toEqual( [ 'murajiaty-v2' ] );
  } );

  test( 'should claim clients after cache cleanup', async () => {
    let capturedActivateHandler;
    const mockClients = { 'claim': jest.fn().mockResolvedValue( undefined ) };

    global.caches = {
      'keys': jest.fn().mockResolvedValue( [ 'murajiaty-v1' ] ),
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
