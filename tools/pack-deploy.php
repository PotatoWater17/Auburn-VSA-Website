<?php
/**
 * Build a production deploy zip for shared hosting.
 *
 * Usage:
 *   php tools/pack-deploy.php
 *   php tools/pack-deploy.php --with-data          # include data/*.json + password hash
 *   php tools/pack-deploy.php --with-uploads       # include uploads/* media
 *   php tools/pack-deploy.php --out=deploy.zip
 *
 * Always excludes: .git, developer-private service folders, OS junk, this packer's output.
 * Always includes: .htaccess trees, includes/, admin/, api/, assets/, HTML, tools denied.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli' && PHP_SAPI !== 'phpdbg') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Forbidden\n";
    exit(1);
}

if (!class_exists('ZipArchive')) {
    fwrite(STDERR, "ZipArchive extension required.\n");
    exit(1);
}

$root = dirname(__DIR__);
require_once $root . '/includes/config.php'; // PHP 7.4 string-helper polyfills
$withData = in_array('--with-data', $argv, true);
$withUploads = in_array('--with-uploads', $argv, true);
$out = $root . DIRECTORY_SEPARATOR . 'auburn-vsa-deploy.zip';
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--out=')) {
        $out = substr($arg, 6);
        if ($out !== '' && $out[0] !== '/' && !preg_match('#^[A-Za-z]:[\\\\/]#', $out)) {
            $out = $root . DIRECTORY_SEPARATOR . $out;
        }
    }
}

$excludeDirNames = [
    '.git' => true,
    'node_modules' => true,
    '.idea' => true,
    '.vscode' => true,
];

$excludeFileNames = [
    '.DS_Store' => true,
    'Thumbs.db' => true,
    'auburn-vsa-deploy.zip' => true,
];

/**
 * @return Generator<string>
 */
function iterFiles(string $dir): Generator
{
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)
    );
    foreach ($it as $file) {
        /** @var SplFileInfo $file */
        if ($file->isFile()) {
            yield $file->getPathname();
        }
    }
}

function shouldSkip(string $abs, string $root, bool $withData, bool $withUploads, array $excludeDirNames, array $excludeFileNames): bool
{
    $rel = ltrim(str_replace('\\', '/', substr($abs, strlen($root))), '/');
    if ($rel === '') {
        return true;
    }
    $base = basename($rel);
    if (isset($excludeFileNames[$base])) {
        return true;
    }
    if (str_ends_with($base, '.zip') && str_starts_with($base, 'auburn-vsa-deploy')) {
        return true;
    }
    $parts = explode('/', $rel);
    // Developer-local private service folders never ship in handoff/deploy zips.
    // The randomized suffix avoids advertising an exact route in source.
    if (isset($parts[0]) && preg_match('/^svc-[a-f0-9]{16}$/', $parts[0])) {
        return true;
    }
    foreach ($parts as $part) {
        if (isset($excludeDirNames[$part])) {
            return true;
        }
    }
    // Runtime data: keep .htaccess always; JSON/hashes only with --with-data
    if ($parts[0] === 'data') {
        if ($base === '.htaccess' || $base === '.gitkeep') {
            return false;
        }
        if (!$withData) {
            return true;
        }
    }
    // Uploads: keep .htaccess / .gitkeep; media only with --with-uploads
    if ($parts[0] === 'uploads') {
        if ($base === '.htaccess' || $base === '.gitkeep') {
            return false;
        }
        if (!$withUploads) {
            return true;
        }
    }
    return false;
}

if (is_file($out)) {
    @unlink($out);
}

$zip = new ZipArchive();
if ($zip->open($out, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    fwrite(STDERR, "Cannot create zip: {$out}\n");
    exit(1);
}

$count = 0;
foreach (iterFiles($root) as $abs) {
    if (shouldSkip($abs, $root, $withData, $withUploads, $excludeDirNames, $excludeFileNames)) {
        continue;
    }
    $rel = ltrim(str_replace('\\', '/', substr($abs, strlen($root))), '/');
    if ($zip->addFile($abs, $rel)) {
        $count++;
    }
}

// Ensure empty runtime dirs exist in the archive
$zip->addEmptyDir('data');
$zip->addEmptyDir('uploads');
$zip->close();

echo "Wrote {$out}\n";
echo "Files: {$count}\n";
echo "data JSON: " . ($withData ? 'included' : 'excluded (use --with-data)') . "\n";
echo "uploads media: " . ($withUploads ? 'included' : 'excluded (use --with-uploads)') . "\n";
echo "Excluded: .git, node_modules/, developer-private service folders\n";
exit(0);
