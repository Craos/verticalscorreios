<?php
/**
 * Created by PhpStorm.
 * User: oberd
 * Date: 10/02/2017
 * Time: 13:31
 */

session_start();
require_once('config.php');
require_once('Remetentes.php');
require_once('Registros.php');
require_once('Destinatarios.php');
require_once('Envio.php');

function isValidJSON($str)
{
    json_decode($str);
    return json_last_error() == JSON_ERROR_NONE;
}

ini_set('display_errors', 'off');
ini_set('log_errors', 1);
ini_set('error_log', 'var/log/error.log');
date_default_timezone_set('America/Sao_Paulo');
set_time_limit(0);

if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])) {
    $if_modified_since = preg_replace('/;.*$/', '', $_SERVER['HTTP_IF_MODIFIED_SINCE']);
} else {
    $if_modified_since = '';
}

$mtime = filemtime($_SERVER['SCRIPT_FILENAME']);
$gmdate_mod = gmdate('D, d M Y H:i:s', $mtime) . ' GMT';


if ($if_modified_since == $gmdate_mod) {
    header("HTTP/1.0 304 Not Modified");
    exit;
}


header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: X-Requested-With, Content-Type");
//header('Content-type: application/json; charset=utf-8');
header("Last-Modified: $gmdate_mod");
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + (60 * 60 * 24 * 45)) . ' GMT');


$json_params = file_get_contents("php://input");

if (strlen($json_params) > 0 && isValidJSON($json_params)) {
    $decoded_params = json_decode($json_params);
} else {

    Response(array(
        'status' => 'finalizado',
        'tipo'=> 'alert-error',
        'mensagem' => 'O formato da informação é inválida'
    ), 500);
    exit(0);

}

$cnn = pg_connect(PGSERVER);

if (pg_connection_status($cnn) === PGSQL_CONNECTION_BAD) {

    Response(array(
        'status' => 'finalizado',
        'tipo' => 'alert-error',
        'mensagem' => 'Não foi possível estabelecer uma conexão com o banco de dados'
    ), 500);
    exit(0);
}

$remetentes = new Remetentes();
if ($remetentes->lista === null) {

    Response(array(
        'status' => 'finalizado',
        'tipo' => 'alert-error',
        'mensagem' => 'Nenhum remetente está disponível para enviar as mensagens'
    ), 500);
    exit(0);

}

ProcessaInformacoes(
    new Registros($decoded_params),
    pg_fetch_all($remetentes->lista) ,
    file_get_contents(SMTPMODELO)
);

/**
 * @param $registros
 * @param $remetentes
 * @param $modelo
 */
function ProcessaInformacoes(Registros $registros, Array $remetentes, $modelo)
{

    if (ob_get_level() == 0)
        ob_start();


    $identificacao = 0;
    while ($paraenviar = pg_fetch_object($registros->lista)) {

        $destinatarios = new Destinatarios($paraenviar->bloco, $paraenviar->unidade);

        $situacao = null;
        $logtentativas = [];

        foreach ($remetentes as $remetente) {

            $envio = new Envio();
            $envio->Destinatario = $destinatarios->lista;
            $envio->Remetente = $remetente;
            $envio->Registro = $paraenviar;
            $envio->Modelo = $modelo;

            $envio->PreparaPropriedades();
            $envio->PreparaRecipientes();
            $envio->PreparaConteudo();
            $resultado = $envio->Iniciar();

            $tentativas = ((int)count($logtentativas))+1;
            $logtentativas[] = "<tr><td class='c'>Tentativa Nº:" . $tentativas . "</td><td class='v endereco'>".$remetente['endereco']."<br><span class='obs'>".$envio->Observacoes."</span></td></tr>";

            if ($resultado === true) {

                $situacao = true;
                break;

            } else if ($resultado === false) {
                break;

            }

        }

        $valorsituacao = false;
        $dscsituacao = 'Erro no envio';
        $classsituacao = 'falha';

        if ($situacao === true) {
            $valorsituacao = true;
            $dscsituacao = 'Notificado';
            $classsituacao = 'sucesso';
        }


        Response(array(
            'status' => 'processando',
            'processoid' =>$identificacao,
            'processamento' => Array(
                'bloco' => $paraenviar->bloco,
                'unidade' => $paraenviar->unidade,
                'data' => $paraenviar->data,
                'rastreio' => $paraenviar->rastreio,
                'id' => $paraenviar->id,
                'codigo' => $paraenviar->codigo,
                'logtentativas'=>$logtentativas,
                'destinatarios' => (count($destinatarios->lista) === 0) ? 'Nenhum destinatário encontrado' : implode(', ', $destinatarios->lista),
                'situacao' => $dscsituacao,
                'valorsituacao'=>$valorsituacao,
                'classsituacao'=>$classsituacao
            )
        ), 202);

        $registros->RegistraProcessamento($paraenviar->id, $dscsituacao, $remetente['id']);

        $identificacao++;
        sleep(1);

    }

    exit(0);

}

function Response($info, $code) {

    echo json_encode($info, JSON_UNESCAPED_UNICODE);
    http_response_code($code);
    ob_flush();
    flush();


}