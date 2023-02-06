"use strict";

import * as Color from "../constants/color.js";
import * as Gfx from "./screen_gfx.js";
import * as ShieldDef from "./shield_defs.js";

export const PXR = Gfx.getPixelRatio();

function ellipseScale(spaceBounds, textBounds) {
  //Math derived from https://mathworld.wolfram.com/Ellipse-LineIntersection.html
  var a = spaceBounds.width;
  var b = spaceBounds.height;

  var x0 = textBounds.width;
  var y0 = textBounds.height;

  return (a * b) / Math.sqrt(a * a * y0 * y0 + b * b * x0 * x0);
}

export function ellipseTextConstraint(spaceBounds, textBounds) {
  return {
    scale: ellipseScale(spaceBounds, textBounds),
  };
}

export function southHalfellipseTextConstraint(spaceBounds, textBounds) {
  return {
    scale: ellipseScale(spaceBounds, {
      //Turn ellipse 90 degrees
      height: textBounds.width / 2,
      width: textBounds.height,
    }),
  };
}

export function rectTextConstraint(spaceBounds, textBounds) {
  var scaleHeight = spaceBounds.height / textBounds.height;
  var scaleWidth = spaceBounds.width / textBounds.width;

  return {
    scale: Math.min(scaleWidth, scaleHeight),
  };
}

export function roundedRectTextConstraint(spaceBounds, textBounds, radius) {
  //Shrink space bounds so that corners hit the arcs
  return rectTextConstraint(
    {
      width: spaceBounds.width - radius * (2 - Math.sqrt(2)),
      height: spaceBounds.height - radius * (2 - Math.sqrt(2)),
    },
    textBounds
  );
}

function widthOfChar(char) {
  switch(char) {
    // skinny
    case 'I': case '-':
      return 1/3;
    // Numbers tend to be skinnier than cap letters.
    // Treat all numbers the same since we want all number-only refs with the same number of digits to have the same font size
    case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': case '0':
      return 1/2.75;
    // wide
    case 'B': case 'C': case 'E': case 'H': case 'K': case 'L': case 'M': case 'N': case 'O': case 'R':
      return 1/1.9;
    // extra wide
    case 'W':
      return 1/1.5;
    // average
    default:
      return 1/2.2;
  } 
} 

function widthOfText(text, fontSize) {
  var len = 0;
  // add space between characters
  len += (text.length - 1) * 1/12;
  for (var i in text) {
    len += widthOfChar(text[i]);
  }
  return fontSize*len;
}

function emHeightForFontSize(fontSize) {
  return fontSize * 3/4;
}

/**
 * Determines the position and font size to draw text so that it fits within
 * a bounding box.
 *
 * @param {*} text - text to draw
 * @param {*} padding - top/bottom/left/right padding around text
 * @param {*} bounds - size of the overall graphics area
 * @param {*} textLayoutFunc - algorithm for text scaling
 * @param {*} maxFontSize - maximum font size
 * @returns JOSN object containing (X,Y) draw position and font size
 */
function layoutShieldText(text, padding, bounds, textLayoutFunc, maxFontSize) {
  const PXR = Gfx.getPixelRatio();

  var padTop = padding.top * PXR || 0;
  var padBot = padding.bottom * PXR || 0;
  var padLeft = padding.left * PXR || 0;
  var padRight = padding.right * PXR || 0;

  var maxFont = maxFontSize * PXR;
  //Temporary canvas for text measurment
  var ctx = Gfx.getGfxContext(
    // text size can overflow the bounds, so use a larger canvas to make sure we get accurate measurements
    {height: bounds.height*2, width: bounds.width*2}
  );

  var fontSize = Gfx.fontSizeThreshold;
  var textWidth = widthOfText(text, fontSize);
  var textHeight = emHeightForFontSize(fontSize);

  var availHeight = bounds.height - padTop - padBot;
  var availWidth = bounds.width - padLeft - padRight;

  var xBaseline = padLeft + availWidth / 2;

  var textConstraint = textLayoutFunc(
    { height: availHeight, width: availWidth },
    { height: textHeight, width: textWidth }
  );

  //If size-to-fill shield text is too big, shrink it
  fontSize = Math.min(
    maxFont,
    Gfx.fontSizeThreshold * textConstraint.scale
  );
  textHeight = emHeightForFontSize(fontSize);

  // some browsers, but not others, round off the `y` parameter of `ctx.fillText`, so do it manually for consistency
  var yBaseline = Math.round(padTop + (availHeight-textHeight)/2 + textHeight);

  return {
    xBaseline: xBaseline,
    yBaseline: yBaseline,
    fontPx: fontSize,
  };
}

const defaultDefForLayout = {
  padding: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

/**
 * Determines the position and font size to draw text so that it fits within
 * a bounding box.
 *
 * @param {*} text - text to draw
 * @param {*} def - shield definition
 * @param {*} bounds - size of the overall graphics area
 * @returns JOSN object containing (X,Y) draw position and font size
 */
export function layoutShieldTextFromDef(text, def, bounds) {
  if (def == null) {
    def = defaultDefForLayout;
  }

  var padding = def.padding || {};

  var textLayoutFunc = rectTextConstraint;
  var maxFontSize = 14; // default max size

  if (typeof def.textLayoutConstraint != "undefined") {
    textLayoutFunc = def.textLayoutConstraint;
  }

  if (typeof def.maxFontSize != "undefined") {
    maxFontSize = Math.min(maxFontSize, def.maxFontSize); // shield definition cannot set max size higher than default
  }

  return layoutShieldText(text, padding, bounds, textLayoutFunc, maxFontSize);
}

/**
 * Draw text on a shield
 *
 * @param {*} ctx - graphics context to draw to
 * @param {*} text - text to draw
 * @param {*} textLayout - location to draw text
 */
export function drawShieldText(ctx, text, textLayout) {
  //Text color is set by fillStyle
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = Gfx.shieldFont(textLayout.fontPx);

  ctx.fillText(text, textLayout.xBaseline, textLayout.yBaseline);
}

/**
 * Draw drop shadow for text on a shield
 *
 * @param {*} ctx - graphics context to draw to
 * @param {*} text - text to draw
 * @param {*} textLayout - location to draw text
 */
export function drawShieldHaloText(ctx, text, textLayout) {
  //Stroke color is set by strokeStyle
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = Gfx.shieldFont(textLayout.fontPx);

  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2 * PXR;

  ctx.strokeText(text, textLayout.xBaseline, textLayout.yBaseline);
  ctx.shadowColor = null;
  ctx.shadowBlur = null;
}

/**
 * Draw text on a modifier plate above a shield
 *
 * @param {*} ctx - graphics context to draw to
 * @param {*} text - text to draw
 * @param {*} bannerIndex - plate position to draw, 0=top, incrementing
 */
export function drawBannerText(ctx, text, bannerIndex) {
  var textLayout = layoutShieldTextFromDef(text, null, {
    width: ctx.canvas.width,
    height: ShieldDef.bannerSizeH - ShieldDef.bannerPadding,
  });

  ctx.fillStyle = "black";

  ctx.font = Gfx.shieldFont(textLayout.fontPx);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  ctx.fillText(
    text,
    textLayout.xBaseline,
    textLayout.yBaseline +
      bannerIndex * ShieldDef.bannerSizeH -
      ShieldDef.bannerPadding +
      ShieldDef.topPadding
  );
}

/**
 * Draw drop shadow for text on a modifier plate above a shield
 *
 * @param {*} ctx - graphics context to draw to
 * @param {*} text - text to draw
 * @param {*} bannerIndex - plate position to draw, 0=top, incrementing
 */
export function drawBannerHaloText(ctx, text, bannerIndex) {
  var textLayout = layoutShieldTextFromDef(text, null, {
    width: ctx.canvas.width,
    height: ShieldDef.bannerSizeH - ShieldDef.bannerPadding,
  });

  (ctx.shadowColor = Color.backgroundFill), (ctx.strokeStyle = ctx.shadowColor);
  ctx.font = Gfx.shieldFont(textLayout.fontPx);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2 * PXR;

  ctx.strokeText(
    text,
    textLayout.xBaseline,
    textLayout.yBaseline +
      bannerIndex * ShieldDef.bannerSizeH -
      ShieldDef.bannerPadding +
      ShieldDef.topPadding
  );
  ctx.shadowColor = null;
  ctx.shadowBlur = null;
}

export function calculateTextWidth(text, fontSize) {
  var ctx = Gfx.getGfxContext({ width: 1, height: 1 }); //dummy canvas
  ctx.font = Gfx.shieldFont(fontSize);
  return Math.ceil(ctx.measureText(text).width);
}
