<?php
/**
 * Created by PhpStorm.
 * User: oberd
 * Date: 11/02/2017
 * Time: 08:11
 */
require_once ('config.php');

if (!isset($_REQUEST['s']))
    exit;

$sequencia = $_REQUEST['s'];
$mensagem = file_get_contents('../html/online.html');
$cnn = pg_connect(PGSERVER);

$instrucao =<<<SQL

    UPDATE notificacoes.entrada
       SET entrada.enviado = current_timestamp
     WHERE id = '$sequencia'::VARCHAR;

    SELECT bloco, unidade, to_char(enviado, 'DD/MM/YYYY HH24:MI:ss') as data, modelos.mensagem, entrada.rastreio, entrada.id
      FROM notificacoes.entrada
      JOIN notificacoes.modelos ON entrada.modelo = modelos.id
     WHERE entrada.id = '$sequencia'::VARCHAR
     LIMIT 1;
SQL;


$info = @pg_query($instrucao);

if (!pg_connection_status($info))
{
    echo "Não foi possível exibir este comunicado";
    exit(0);
}

$dados = pg_fetch_object($info);

$mensagem = str_replace('#BLOCO#', $dados->bloco, $mensagem);
$mensagem = str_replace('#UNIDADE#', $dados->unidade, $mensagem);
$mensagem = str_replace('#DATA#', $dados->data, $mensagem);
$mensagem = str_replace('#MENSAGEM#', $dados->mensagem, $mensagem);
$mensagem = str_replace('#NUM#', $dados->codigo, $mensagem);
$mensagem = str_replace('<td colspan="3" style="text-align: end; font-family: Arial, Tahoma, sans-serif; font-size: 10px;">Caso n&atilde;o consiga visualizar esta mensagem, experimente a <a href="http://anima.craos.net/smart.correios/ws/index.php?s=#NUM#">vers&atilde;o online</a></td>', '', $mensagem);

echo $mensagem;