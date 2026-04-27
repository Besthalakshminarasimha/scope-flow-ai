// Minimal PLY parser/writer for point clouds (ASCII + binary_little_endian).
// Supports x/y/z, optional red/green/blue (uchar) and optional scale/opacity for 3DGS-lite scenes.

export interface PlyPoint {
  x: number; y: number; z: number;
  r: number; g: number; b: number; // 0..1
  scale?: number;
  opacity?: number;
  isDynamic?: boolean;
}

export interface PlyData {
  points: PlyPoint[];
}

export async function parsePLY(buffer: ArrayBuffer): Promise<PlyData> {
  const bytes = new Uint8Array(buffer);
  // Parse header (always ASCII until "end_header\n")
  let headerEnd = 0;
  for (let i = 0; i < bytes.length - 10; i++) {
    if (
      bytes[i] === 0x65 && bytes[i + 1] === 0x6e && bytes[i + 2] === 0x64 &&
      bytes[i + 3] === 0x5f && bytes[i + 4] === 0x68 && bytes[i + 5] === 0x65 &&
      bytes[i + 6] === 0x61 && bytes[i + 7] === 0x64 && bytes[i + 8] === 0x65 &&
      bytes[i + 9] === 0x72
    ) {
      // find newline after end_header
      let j = i + 10;
      while (j < bytes.length && bytes[j] !== 0x0a) j++;
      headerEnd = j + 1;
      break;
    }
  }
  if (!headerEnd) throw new Error("Invalid PLY: missing end_header");

  const headerText = new TextDecoder().decode(bytes.subarray(0, headerEnd));
  const lines = headerText.split(/\r?\n/);
  let format: "ascii" | "binary_little_endian" = "ascii";
  let vertexCount = 0;
  const props: { name: string; type: string }[] = [];
  let inVertex = false;
  for (const line of lines) {
    if (line.startsWith("format ")) {
      if (line.includes("binary_little_endian")) format = "binary_little_endian";
      else if (line.includes("ascii")) format = "ascii";
      else throw new Error(`Unsupported PLY format: ${line}`);
    } else if (line.startsWith("element vertex")) {
      vertexCount = parseInt(line.split(/\s+/)[2], 10);
      inVertex = true;
    } else if (line.startsWith("element ")) {
      inVertex = false;
    } else if (line.startsWith("property ") && inVertex) {
      const parts = line.split(/\s+/);
      props.push({ type: parts[1], name: parts[parts.length - 1] });
    }
  }

  const points: PlyPoint[] = new Array(vertexCount);
  const sizes: Record<string, number> = {
    char: 1, uchar: 1, short: 2, ushort: 2,
    int: 4, uint: 4, float: 4, double: 8,
  };

  if (format === "ascii") {
    const body = new TextDecoder().decode(bytes.subarray(headerEnd));
    const rows = body.split(/\r?\n/).filter(Boolean);
    for (let i = 0; i < vertexCount && i < rows.length; i++) {
      const tok = rows[i].split(/\s+/);
      const obj: any = {};
      props.forEach((p, idx) => { obj[p.name] = parseFloat(tok[idx]); });
      points[i] = makePoint(obj);
    }
  } else {
    const dv = new DataView(buffer, headerEnd);
    let off = 0;
    for (let i = 0; i < vertexCount; i++) {
      const obj: any = {};
      for (const p of props) {
        let v = 0;
        switch (p.type) {
          case "float": v = dv.getFloat32(off, true); off += 4; break;
          case "double": v = dv.getFloat64(off, true); off += 8; break;
          case "uchar": v = dv.getUint8(off); off += 1; break;
          case "char": v = dv.getInt8(off); off += 1; break;
          case "ushort": v = dv.getUint16(off, true); off += 2; break;
          case "short": v = dv.getInt16(off, true); off += 2; break;
          case "uint": v = dv.getUint32(off, true); off += 4; break;
          case "int": v = dv.getInt32(off, true); off += 4; break;
          default: off += sizes[p.type] ?? 0; break;
        }
        obj[p.name] = v;
      }
      points[i] = makePoint(obj);
    }
  }

  return { points };
}

function makePoint(o: any): PlyPoint {
  const r = o.red !== undefined ? o.red / 255 : (o.r ?? 0.7);
  const g = o.green !== undefined ? o.green / 255 : (o.g ?? 0.7);
  const b = o.blue !== undefined ? o.blue / 255 : (o.b ?? 0.7);
  return {
    x: o.x ?? 0, y: o.y ?? 0, z: o.z ?? 0,
    r, g, b,
    scale: o.scale,
    opacity: o.opacity,
    isDynamic: o.dynamic ? !!o.dynamic : undefined,
  };
}

export function writePLYAscii(data: PlyData): string {
  const n = data.points.length;
  const lines = [
    "ply",
    "format ascii 1.0",
    `element vertex ${n}`,
    "property float x",
    "property float y",
    "property float z",
    "property uchar red",
    "property uchar green",
    "property uchar blue",
    "property float scale",
    "property float opacity",
    "property uchar dynamic",
    "end_header",
  ];
  for (const p of data.points) {
    lines.push(
      `${p.x.toFixed(4)} ${p.y.toFixed(4)} ${p.z.toFixed(4)} ` +
      `${Math.round(p.r * 255)} ${Math.round(p.g * 255)} ${Math.round(p.b * 255)} ` +
      `${(p.scale ?? 0.05).toFixed(4)} ${(p.opacity ?? 1).toFixed(3)} ${p.isDynamic ? 1 : 0}`
    );
  }
  return lines.join("\n");
}

export function writeJSON(data: PlyData): string {
  return JSON.stringify({
    version: 1,
    pointCount: data.points.length,
    points: data.points.map(p => ({
      p: [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)],
      c: [+p.r.toFixed(3), +p.g.toFixed(3), +p.b.toFixed(3)],
      s: +(p.scale ?? 0.05).toFixed(3),
      o: +(p.opacity ?? 1).toFixed(3),
      d: p.isDynamic ? 1 : 0,
    })),
  });
}

// Procedurally generate a sample "room" scene to ship as built-in demo.
export function generateSampleScene(count = 4000): PlyData {
  const pts: PlyPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const ring = Math.floor(t * 5);
    const angle = (i * 137.508) * (Math.PI / 180);
    const r = 1.5 + ring * 0.6 + Math.sin(i * 0.1) * 0.2;
    const h = (Math.sin(t * Math.PI * 6) + (Math.random() - 0.5)) * 1.8;
    const x = Math.cos(angle) * r;
    const y = h;
    const z = Math.sin(angle) * r;
    // Color zones
    const hue = (ring / 5) * 0.7 + 0.05;
    const [cr, cg, cb] = hslToRgb(hue, 0.65, 0.55);
    // Mark some moving points (e.g., a "person" cluster near origin)
    const dist = Math.sqrt(x * x + (y - 0.5) ** 2 + z * z);
    const isDynamic = dist < 1.2 && Math.random() < 0.6;
    pts.push({
      x, y, z,
      r: cr, g: cg, b: cb,
      scale: 0.04 + Math.random() * 0.06,
      opacity: 0.6 + Math.random() * 0.4,
      isDynamic,
    });
  }
  return { points: pts };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}
