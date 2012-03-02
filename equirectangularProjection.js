//
// Equirectangular Projection for Google Maps
// Author: Jonah Burke, http://jonahb.com
// This code is in the public domain.
//

//
// EquirectangularProjection constructor
//
//   zoomLevels: The number of zoom levels to project (required)
//
//   dimensons:  An array of arrays, each representing the dimensions at a given zoom.
//               For example, the following array represents a projection with two zoom levels.
//               At level 0, the map is 100 pixels by 100 pixels; at level 1 it's 500 x 500.
//
//                 [ [ 100, 100 ],
//                   [ 500, 500 ] ]
//
//               This parameter is optional.  If omitted, we construct default dimensions for the
//               given number of zoom levels.

function EquirectangularProjection( zoomLevels, dimensions )
{
  this.zoomLevels = zoomLevels;
  this.dimensions = dimensions || EquirectangularProjection.createDefaultDimensions( zoomLevels );
}

EquirectangularProjection.prototype = new GProjection();

EquirectangularProjection.DEFAULT_WIDTH_PER_ZOOM_LEVEL = 100;
EquirectangularProjection.DEFAULT_HEIGHT_PER_ZOOM_LEVEL = 100;

EquirectangularProjection.createDefaultDimensions = function( zoomLevels )
{
  var i, width, height; 
  var array = [];
  
  for ( i = 0; i < zoomLevels; ++i )
  {
    width = ( i + 1 ) * EquirectangularProjection.DEFAULT_WIDTH_PER_ZOOM_LEVEL;
    height = ( i + 1 ) * EquirectangularProjection.DEFAULT_HEIGHT_PER_ZOOM_LEVEL;
    array[ i ] = [ width, height ];
  }
  
  return array;
};

//
// GProjection implementation begins
//

// Returns the map coordinates in pixels for the point at the given geographical coordinates,
// and the given zoom level.
EquirectangularProjection.prototype.fromLatLngToPixel = function( latlng, zoom )
{
  var x = Math.round( latlng.lng() * this.getPixelsPerLongitudeDegree( zoom ) );
  var y = Math.round( latlng.lat() * this.getPixelsPerLatitudeDegree( zoom ) );
  return new GPoint( x, y );
};

// Returns the geographical coordinates for the point at the given map coordinates in pixels,
// and the given zoom level. Flag unbounded causes the geographical longitude coordinate not
// to wrap when beyond the -180 or 180 degrees meridian.
EquirectangularProjection.prototype.fromPixelToLatLng = function( pixel, zoom, unbounded )
{
  var lng = pixel.x / this.getPixelsPerLongitudeDegree( zoom );
  var lat = pixel.y / this.getPixelsPerLatitudeDegree( zoom );
  return new GLatLng( lat, lng, unbounded );
};

// Returns to the map if the tile index is in a valid range for the map type. Otherwise the
// map will display an empty tile. It also may modify the tile index to point to another
// instance of the same tile in the case that the map contains more than one copy of the
// earth, and hence the same tile at different tile coordinates.
EquirectangularProjection.prototype.tileCheckRange = function( tile, zoom, tilesize )
{
  var tileRectangle = new Rectangle( tile.x * tilesize, tile.y * tilesize, tilesize, tilesize );
  return this.bounds( zoom ).intersects( tileRectangle );
};

EquirectangularProjection.prototype.getPixelsPerLatitudeDegree = function( zoom )
{
  return this.dimensions[ zoom ][ 1 ] / 180;
};

EquirectangularProjection.prototype.getPixelsPerLongitudeDegree = function( zoom )
{
  return this.dimensions[ zoom ][ 0 ] / 360;
};

// Returns to the map the periodicity in x-direction, i.e. the number of pixels after
// which the map repeats itself because it wrapped once round the earth. By default,
// returns Infinity, i.e. the map will not repeat itself. This is used by the map to
// compute the placement of overlays on map views that contain more than one copy of
// the earth (this usually happens only at low zoom levels). (Since 2.46)
EquirectangularProjection.prototype.getWrapWidth = function( zoom )
{
  // width at zoom
  return this.dimensions[ zoom ][ 0 ];
};


//
// GProjection implementation ends
//

// Returns the bounds of the projection in pixel coordinates, for the given zoom
// Since integer division rounds down, an odd pixel is in the negative half
// of the plane.
EquirectangularProjection.prototype.bounds = function( zoom )
{
  var width = this.dimensions[ zoom ][ 0 ];
  var height = this.dimensions[ zoom ][ 1 ];
  return new Rectangle( width / -2, height / -2, width, height );
};

// Converts lat-lng bounds to pixel coordinates
EquirectangularProjection.prototype.projectLatLngBounds = function( bounds, zoom )
{
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast();
  
  var swPixel = this.fromLatLngToPixel( sw, zoom );
  var nePixel = this.fromLatLngToPixel( ne, zoom );
  
  return new Rectangle( swPixel.x,
                        nePixel.y,
                        nePixel.x - swPixel.x,
                        swPixel.y - nePixel.y );
};


// 
// Rectangle
//

function Rectangle( left, top, width, height )
{
  this.left = left;
  this.top = top;
  this.width = width;
  this.height = height;
}

Rectangle.prototype.right = function()
{
  return this.left + this.width - 1;
};

Rectangle.prototype.bottom = function()
{
  return this.top + this.height - 1;
};

Rectangle.prototype.toString = function()
{
  return "(" + this.left.toString() + ", " + this.top.toString() + ")" + " " +
         this.width.toString() + " x " + this.height.toString();
};

Rectangle.prototype.containsPoint = function( x, y )
{
  return ( x >= this.left ) &&
    ( x <= this.right() ) &&
    ( y >= this.top ) &&
    ( y <= this.bottom() );
};

Rectangle.prototype.intersects = function( other )
{
  return !( ( this.left > other.right() ) ||
  ( this.right() < other.left ) ||
  ( this.top > other.bottom() ) ||
  ( this.bottom() < other.top ) );
};