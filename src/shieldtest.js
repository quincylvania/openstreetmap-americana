"use strict";

import * as Shield from "./js/shield.js";
import * as gfx from "./js/screen_gfx.js";
import * as ShieldDef from "./js/shield_defs.js";
import * as CustomShields from "./js/custom_shields.js";
import * as maplibregl from "maplibre-gl";

var getUrl = window.location;
var baseUrl = getUrl.protocol + "//" + getUrl.host + getUrl.pathname;

window.maplibregl = maplibregl;
export const map = (window.map = new maplibregl.Map({
  container: "map", // container id
  antialias: true,
  style: {
    version: 8,
    layers: [],
    sources: {},
    sprite: new URL("sprites/sprite", baseUrl).href,
  },
}));

CustomShields.loadCustomShields();
ShieldDef.loadShields();

map.on("styleimagemissing", function (e) {
  Shield.missingIconHandler(map, e);
});

const once = (emitter, name, { signal } = {}) =>
  new Promise((resolve, reject) => {
    emitter.once(name, resolve);
    signal?.addEventListener("abort", reject);
  });

await once(map, "load");

let networks = [
  "default",

  // Circles, pills, ovals
  "NZ:WRR",
  "US:DE",
  "CA:MB:PR",
  "KR:national",
  "US:IA",
  "US:NM",
  "US:KS",

  // Rectangles
  "US:CT",
  "US:WY",
  "AU:QLD",
  "AU:QLD:SSTR",
  "CL:regional",
  "ES:A-road",
  "CA:NS:R",
  "CA:YT",
  "IS",
  "e-road",
  "pl:motorways",

  // Basic Angular Shapes
  "CA:ON:secondary",
  "US:NE",
  "US:MN:Hennepin:Park_Access",
  "CA:MB:Winnipeg",
  "US:PA",
  "US:PA:Turnpike",

  "CA:AB:primary",
  "CA:SK:tertiary",
  "CA:SK:primary",
  "AU:WA:NH",
  "PH:E",
  "US:TX:Montgomery:MCTRA",

  "US:TN:secondary",
  "US:NC",

  "US:IA:CR",
  "US:CO:Douglas",
  "US:MN:Aitkin:CSAH",
  "AU:ACT:T",
  "US:NM:San_Juan:NCM",
  "US:TX:Harris:HCTRA",

  "JP:prefectural",
  "PK:national",
  "ID:national",

  "AU:QLD:MR",
  "GR:motorway",
  "my:federal",
  "TR:motorway",
  "US:NY",
  "US:NY:Parkway",
  "NL:S:Amsterdam",
  "IT:A-road",

  // Basic Rounded Shapes
  "US:GU",

  "US:CA",
  "US:UT",
  "US:HI",

  "JP:national",
  "TW:expressway",
  "US:TX:Fort_Bend:FBCTRA",
  "US:OR",

  "US:VA",
  "US:PR:primary",
  "HK",
  "CA:QC:A",
  "CA:NS:H",

  "NZ:SH",
  "AU:WA:S",

  "US:I",
  "US:I:Business:Loop",
  "co:national",
  "US:BIA",
  "US:MT:secondary",

  "CA:PE",
  "US:FL:Toll",
  "CA:BC",
  "IN:NH",
  "PK:motorway",
  "US:US",
  "US:US:Historic",
  "CL:national",

  "KR:expressway",
  "CA:QC:R",
  "VE:T:AM",
  "US:WI",

  "TW:freeway",
  "US:MP",
  "US:AS",

  // Fancy Rectangles
  "US:AK",
  "US:KY:Parkway",
  "US:MD",
  "US:MN",
  "US:ID",
  "US:CO",
  "US:CO:E470",
  "US:DC",
  "US:FL",
  "US:NH",
  "US:NY:Parkway:NYC",
  "US:OK",
  "US:SC",
  "US:TN:primary",
  "US:VT",
  "US:WI:Rustic",
  "CA:NT",
  "CA:SK:secondary",
  "CN:expressway",
  "CN:AH:expressway",

  // Detailed Shapes
  "US:NV",
  "US:AZ",
  "US:NM:Frontage",

  "US:ND",
  "US:SD",

  "US:MO",
  "US:AR",
  "US:LA",
  "US:TX:FM",

  "US:AL",
  "US:GA",

  "US:OH",
  "US:OH:ASD",
  "US:OH:SCI",
  "US:OH:TUS:Salem",
  "US:WA",
  "CA:transcanada",
  "CA:NB:primary",
  "CA:ON:primary",
  "CA:ON:primary:Toll",

  // With banners
  "US:I:Truck",
  "US:I:Express",
  "US:US:Business",
  "US:US:Spur",
  "US:US:Business:Alternate",
  "US:US:Alternate:Truck:Business",
  "US:AL:Truck",
  "US:AZ:Loop",
  "US:CA:Business",
  "US:DE:Truck",
  "US:GA:Connector",
  "US:LA:Business",
  "US:MD:Business",
  "US:VT:Alternate",
  "US:MO:Spur",
  "US:NC:Bypass",
  "US:ND:Alternate",
  "US:NE:Link",
  "US:NH:Bypass",
  "US:OH:Business",
  "US:OH:ASD:TWP",
  "US:OK:Spur",
  "US:OR:Business",
  "US:PA:Truck",
  "US:SC:Business",
  "US:TX:Park",
  "US:TX:FM:Business",
  "US:WA:Spur",
  "US:WI:Spur",
  "CA:ON:private_toll",
  "CA:ON:Waterloo:Wilmot",
  "CA:ON:Brant:Highway",
  "CA:ON:Muskoka:West",
  "AU:QLD:ALT",
  "AU:QLD:ALT_S",
  "AU:VIC:ALT_NR",
];

// Uncomment for a list of all supported networks.  This makes for a very long page.
//networks = Object.keys(shields);

let refs = [
  "1",
  "5",
  "11",
  "81",
  "69",
  "95",
  "111",
  "281",
  "980",
  "H201",
  "480N",
  "A 562",
  "1138-2",
  "A26/A7",
];

export function getShieldCanvas(shield_id) {
  let ctx = Shield.generateShieldCtx(map, shield_id);
  if (ctx == null) {
    // Want to return null here, but that gives a corrupted display. See #243
    console.warn("Didn't produce a shield for", JSON.stringify(shield_id));
    ctx = gfx.getGfxContext({ width: 1, height: 1 });
  }
  return ctx.canvas;
}

function addShield(row, network, ref) {
  let cell = row.insertCell();
  let shield_id = `shield\n${network}=${ref}`;
  let shieldCanvas = getShieldCanvas(shield_id);
  let img = document.createElement("img");
  img.src = shieldCanvas.toDataURL("image/png");
  img.width = shieldCanvas.width / PXR;
  img.height = shieldCanvas.height / PXR;
  cell.appendChild(img);
}

function getShieldImage(network, ref) {
  let shield_id = `shield\n${network}=${ref}`;
  let shieldCanvas = getShieldCanvas(shield_id);
  let img = document.createElement("img");
  img.srcset = `${shieldCanvas.toDataURL("image/png")} ${PXR}x`;
  return img;
}

const PXR = gfx.getPixelRatio();

const iterShields = function* () {
  for (const network of networks) {
    yield { network, refs };
  }
  yield {
    network: "US:PA:Allegheny:Belt",
    refs: [
      "Red Belt",
      "Orange Belt",
      "Yellow Belt",
      "Green Belt",
      "Blue Belt",
      "Purple Belt",
    ],
  };
  yield {
    network: "US:MO:Taney:Branson",
    refs: ["Red Route", "Yellow Route", "Blue Route"],
  };
  yield {
    network: "CA:ON:primary",
    refs: ["QEW"],
  };
  yield {
    network: "GLCT",
    refs: ["LECT", "LHCT", "LMCT", "LSCT"],
  };
  yield {
    network: "GLCT:Loop",
    refs: ["LMCT"],
  };
};

const renderAllShields = async () => {
  const allShields = Array.from(iterShields());
  const progress = document.querySelector("#progress-overlay progress");
  progress.max = allShields.flatMap((d) => d.refs).length;
  const columns = Math.max(...allShields.flatMap((d) => d.refs.length));
  const table = document.querySelector("#shield-table").createTBody();
  for (const { network, refs } of allShields) {
    const tr = table.insertRow();
    tr.insertCell().append(`${network}`);
    for (const ref of refs) {
      performance.mark(`start-${network}`);
      tr.insertCell().append(getShieldImage(network, ref));
      progress.value += 1;
      performance.mark(`stop-${network}`);
      performance.measure(`${network}`, `start-${network}`, `stop-${network}`);
    }
    let perfEntries = performance.getEntriesByName(`${network}`);
    var perfDuration = 0;
    for (let perf of perfEntries) {
      perfDuration += perf.duration;
    }
    let shieldRate = Math.round((1000 * perfEntries.length) / perfDuration);
    if (tr.cells.length < 1 + columns) {
      const gap = columns - tr.cells.length + 1;
      tr.insertCell().colSpan = gap;
    }
    tr.insertCell().append(`${shieldRate} shields/sec`);

    await Promise.all(
      Array.from(tr.querySelectorAll("img"), (img) =>
        img.decode().catch(
          () =>
            /* occasionally fails for no reason */
            new Promise(requestAnimationFrame)
        )
      )
    );
  }
};

await renderAllShields().finally(() =>
  document.querySelector("#progress-overlay").remove()
);
