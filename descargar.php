<?php
// Ruta de la carpeta de descargas (ajústala si es necesario)
$directorio = __DIR__ . '/descargas';

// Validar si se especificó un archivo
if (!isset($_GET['archivo'])) {
    http_response_code(400);
    exit('⚠️ Archivo no especificado.');
}

// Limpiar nombre del archivo (elimina rutas maliciosas)
$archivoSolicitado = basename($_GET['archivo']);

// Lista blanca de extensiones permitidas
$extensionesPermitidas = ['rbxl', 'zip', 'rar', 'pdf', 'txt']; // Agrega más si es necesario
$extension = strtolower(pathinfo($archivoSolicitado, PATHINFO_EXTENSION));

if (!in_array($extension, $extensionesPermitidas)) {
    http_response_code(403);
    exit('❌ Tipo de archivo no permitido.');
}

// Ruta final del archivo
$rutaArchivo = $directorio . '/' . $archivoSolicitado;

// Comprobar si el archivo existe
if (!file_exists($rutaArchivo)) {
    http_response_code(404);
    exit('❌ Archivo no encontrado.');
}

// Forzar la descarga
header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $archivoSolicitado . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($rutaArchivo));

// Limpia el búfer de salida y envía el archivo
flush();
readfile($rutaArchivo);
exit;
