<?php
// Minimal ZIP store (no compression) — used when ZipArchive is unavailable.

/**
 * Write a ZIP file (STORE only).
 * @param array<string,string> $entries Map of archive path => binary contents
 */
function backup_zip_write_store(string $zipPath, array $entries): bool
{
    $out = fopen($zipPath, 'wb');
    if ($out === false) {
        return false;
    }

    $offset = 0;
    $central = '';
    $count = 0;

    foreach ($entries as $name => $data) {
        $name = str_replace('\\', '/', (string) $name);
        $name = ltrim($name, '/');
        if ($name === '' || str_ends_with($name, '/')) {
            continue;
        }
        $data = (string) $data;
        $nameBytes = $name;
        $size = strlen($data);
        $crc = crc32($data);
        // PHP crc32 returns signed on some builds — force unsigned 32-bit.
        if ($crc < 0) {
            $crc = $crc & 0xFFFFFFFF;
        }

        $local = pack(
            'VvvvvvVVVvv',
            0x04034b50, // local file header signature
            20,         // version needed
            0,          // general purpose
            0,          // compression: store
            0,          // mod time
            0,          // mod date
            $crc,
            $size,
            $size,
            strlen($nameBytes),
            0 // extra len
        );
        fwrite($out, $local);
        fwrite($out, $nameBytes);
        fwrite($out, $data);

        $central .= pack(
            'VvvvvvvVVVvvvvvVV',
            0x02014b50, // central directory header
            20,         // version made by
            20,         // version needed
            0,          // flags
            0,          // method
            0,          // time
            0,          // date
            $crc,
            $size,
            $size,
            strlen($nameBytes),
            0, // extra
            0, // comment
            0, // disk start
            0, // int attr
            0, // ext attr
            $offset
        );
        $central .= $nameBytes;
        $offset += strlen($local) + strlen($nameBytes) + $size;
        $count++;
    }

    $centralOffset = $offset;
    fwrite($out, $central);
    $centralSize = strlen($central);

    $end = pack(
        'VvvvvVVv',
        0x06054b50,
        0,
        0,
        $count,
        $count,
        $centralSize,
        $centralOffset,
        0
    );
    fwrite($out, $end);
    fclose($out);
    return $count > 0;
}

/**
 * Read ZIP entries (supports stored + deflated when zlib is available).
 * @return array<string,string>|null Map of name => contents, or null on failure
 */
function backup_zip_read_entries(string $zipPath): ?array
{
    $bin = @file_get_contents($zipPath);
    if ($bin === false || strlen($bin) < 22) {
        return null;
    }

    // Prefer ZipArchive when available.
    if (class_exists('ZipArchive')) {
        $zip = new ZipArchive();
        if ($zip->open($zipPath) === true) {
            $out = [];
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if ($name === false) {
                    continue;
                }
                $name = str_replace('\\', '/', $name);
                if ($name === '' || str_ends_with($name, '/')) {
                    continue;
                }
                $raw = $zip->getFromIndex($i);
                if ($raw === false) {
                    $zip->close();
                    return null;
                }
                $out[$name] = $raw;
            }
            $zip->close();
            return $out;
        }
    }

    $entries = [];
    $len = strlen($bin);
    $pos = 0;
    while ($pos + 30 <= $len) {
        $sig = unpack('V', substr($bin, $pos, 4));
        if (!$sig || $sig[1] !== 0x04034b50) {
            break;
        }
        $header = unpack(
            'vversion/vflag/vmethod/vtime/vdate/Vcrc/Vcomp/Vuncomp/vnamelen/vextralen',
            substr($bin, $pos + 4, 26)
        );
        if ($header === false) {
            return null;
        }
        $nameStart = $pos + 30;
        $name = substr($bin, $nameStart, $header['namelen']);
        $dataStart = $nameStart + $header['namelen'] + $header['extralen'];
        $compSize = $header['comp'];
        if ($dataStart + $compSize > $len) {
            return null;
        }
        $payload = substr($bin, $dataStart, $compSize);
        $method = $header['method'];
        if ($method === 0) {
            $data = $payload;
        } elseif ($method === 8 && function_exists('gzinflate')) {
            $data = @gzinflate($payload);
            if ($data === false) {
                return null;
            }
        } else {
            return null;
        }
        $name = str_replace('\\', '/', $name);
        if ($name !== '' && !str_ends_with($name, '/')) {
            $entries[$name] = $data;
        }
        $pos = $dataStart + $compSize;
    }

    return $entries === [] ? null : $entries;
}
