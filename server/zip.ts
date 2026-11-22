import { readFileSync, readdirSync, statSync } from 'node:fs'
import { crc32, deflateRawSync } from 'node:zlib'
import path from 'node:path'

const SKIP = new Set(['node_modules', 'dist', '.DS_Store'])

function listFiles(dir: string, prefix: string): { full: string; rel: string }[] {
  return readdirSync(dir)
    .filter((name) => !SKIP.has(name))
    .sort()
    .flatMap((name) => {
      const full = path.join(dir, name)
      const rel = `${prefix}/${name}`
      return statSync(full).isDirectory() ? listFiles(full, rel) : [{ full, rel }]
    })
}

/**
 * Packt einen Ordner als ZIP (ohne node_modules und dist). Das Archiv enthält den Ordner selbst als oberste Ebene.
 * Bewusst ohne Abhängigkeit: schreibt das ZIP-Format direkt, Deflate kommt aus node:zlib.
 */
export function zipFolder(dir: string): Buffer {
  const local: Buffer[] = []
  const central: Buffer[] = []
  let offset = 0
  const files = listFiles(dir, path.basename(dir))

  for (const { full, rel } of files) {
    const data = readFileSync(full)
    const packed = deflateRawSync(data, { level: 9 })
    const name = Buffer.from(rel, 'utf8')
    const modified = statSync(full).mtime
    const dosTime = (modified.getHours() << 11) | (modified.getMinutes() << 5) | (modified.getSeconds() >> 1)
    const dosDate = ((modified.getFullYear() - 1980) << 9) | ((modified.getMonth() + 1) << 5) | modified.getDate()

    const head = Buffer.alloc(30)
    head.writeUInt32LE(0x04034b50, 0)
    head.writeUInt16LE(20, 4) // Version
    head.writeUInt16LE(0x0800, 6) // UTF-8-Dateinamen
    head.writeUInt16LE(8, 8) // Deflate
    head.writeUInt16LE(dosTime, 10)
    head.writeUInt16LE(dosDate, 12)
    head.writeUInt32LE(crc32(data), 14)
    head.writeUInt32LE(packed.length, 18)
    head.writeUInt32LE(data.length, 22)
    head.writeUInt16LE(name.length, 26)
    local.push(head, name, packed)

    const entry = Buffer.alloc(46)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4)
    entry.writeUInt16LE(20, 6)
    head.copy(entry, 8, 6, 30) // Flags bis Dateinamenlänge sind identisch
    entry.writeUInt32LE(offset, 42)
    central.push(entry, name)

    offset += head.length + name.length + packed.length
  }

  const directory = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...local, directory, end])
}
