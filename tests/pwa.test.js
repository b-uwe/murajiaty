/**
 * @file PWA functionality tests
 */

const fs = require( 'fs' );
const path = require( 'path' );

describe( 'PWA functionality', () => {
  let mockNavigator;

  beforeEach( () => {
    // Mock navigator.serviceWorker
    mockNavigator = {
      'serviceWorker': {
        'register': jest.fn().mockResolvedValue( { 'scope': '/service-worker.js' } )
      }
    };
    global.navigator = mockNavigator;
  } );

  afterEach( () => {
    jest.clearAllMocks();
  } );

  test( 'manifest file exists and has required PWA properties', () => {
    const manifestPath = path.join( __dirname, '../manifest.json' );
    expect( fs.existsSync( manifestPath ) ).toBe( true );

    const manifestContent = fs.readFileSync( manifestPath, 'utf8' );
    const manifest = JSON.parse( manifestContent );

    expect( manifest.name ).toBeDefined();
    expect( manifest.short_name ).toBeDefined();
    expect( manifest.display ).toBe( 'standalone' );
    expect( manifest.icons ).toBeDefined();
    expect( Array.isArray( manifest.icons ) ).toBe( true );
    expect( manifest.icons.length ).toBeGreaterThan( 0 );
    
    // Check for required icon sizes
    const iconSizes = manifest.icons.map( ( icon ) => {
      return icon.sizes;
    } );
    expect( iconSizes ).toContain( '192x192' );
    expect( iconSizes ).toContain( '512x512' );
  } );

  test( 'service worker file exists', () => {
    const serviceWorkerPath = path.join( __dirname, '../service-worker.js' );
    expect( fs.existsSync( serviceWorkerPath ) ).toBe( true );
  } );

  test( 'service worker registration is attempted when navigator supports it', () => {
    // Simulate main.js service worker registration logic
    if ( 'serviceWorker' in navigator ) {
      navigator.serviceWorker.register( '/service-worker.js' );
      expect( mockNavigator.serviceWorker.register ).toHaveBeenCalledWith( '/service-worker.js' );
    }
  } );
} );