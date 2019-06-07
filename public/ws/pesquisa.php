<?php
/**
 * Created by PhpStorm.
 * User: oberdanbrito
 * Date: 03/09/2018
 * Time: 11:17
 */

set_time_limit(0);
require_once('config.php');

$cnn = pg_connect(PGSERVER);

if (!isset($_REQUEST['command']) && !isset($_REQUEST['params']))
    exit(0);

$params = json_decode($_REQUEST['params']);
if ($_REQUEST['command'] == 'pesquisa_rastreio') {
    pesquisa_rastreio($cnn, $params);
}

function pesquisa_rastreio($cnn, $params)
{

    $pesquisaregistros = <<<SQL
    SELECT to_char(filedate, 'DD/MM/YYYY HH24:MI') as entrada, uid, id, rastreio, destinatario, bloco, unidade, to_char(enviado, 'DD/MM/YYYY HH24:MI') as entrada, processamento 
      FROM notificacoes.entrada
     WHERE lower(rastreio) like lower('%$params->rastreio%')
     UNION 
    SELECT to_char(entrada, 'DD/MM/YYYY HH24:MI') as entrada,  uid, id, rastreio, destinatario, bloco, unidade, to_char(enviado, 'DD/MM/YYYY HH24:MI') as entrada, '' as processamento 
      FROM notificacoes.historico
     WHERE lower(rastreio) like lower('%$params->rastreio%')
     LIMIT 15
SQL;

    $registros = pg_query($cnn, $pesquisaregistros);
    $info = Array();

    while ($linha = pg_fetch_object($registros)) {
        $info[] = $linha;
    }

    header('Content-Type: application/json');
    echo json_encode($info);
}