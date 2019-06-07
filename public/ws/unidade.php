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
if ($_REQUEST['command'] == 'pesquisa_unidade') {
    pesquisa_unidade($cnn, $params);
} else if ($_REQUEST['command'] == 'pesquisa_nome') {
    pesquisa_nomes($cnn, $params);
}

function pesquisa_unidade($cnn, $params) {

    $pesquisaregistros = <<<SQL
    SELECT cadastrado_em, id, bloco, unidade, unidadeid, nome, rg, cpf, foto1, autenticacao 
      FROM notificacoes.pesquisa_moradores
     WHERE bloco = $params->bloco and unidade = $params->unidade
SQL;

    $registros = pg_query($cnn, $pesquisaregistros);
    $info = Array();

    while ($linha = pg_fetch_object($registros)) {

        $foto = 'tmp/'.$linha->id.'.jpg';

        if (strlen($linha->foto1) < 256) {
            $linha->foto1 = 'ws/tmp/pessoa.png';
        } else if (!file_exists($foto)) {
            base64_to_jpeg($linha->foto1, 'tmp/'.$linha->id.'.jpg');
            $linha->foto1 = 'ws/'.$foto;
        }

        $info[] = $linha;
    }

    header('Content-Type: application/json');
    echo json_encode($info);
}

function pesquisa_nomes($cnn, $params) {

    $pesquisaregistros = <<<SQL
    SELECT cadastrado_em, id, bloco, unidade, unidadeid, nome, rg, cpf, foto1, autenticacao 
      FROM notificacoes.pesquisa_moradores
     WHERE lower(nome) like '%$params->nome%'
     LIMIT 15
SQL;

    $registros = pg_query($cnn, $pesquisaregistros);
    $info = Array();

    while ($linha = pg_fetch_object($registros)) {

        $foto = 'tmp/'.$linha->id.'.jpg';

        if (strlen($linha->foto1) < 256) {
            $linha->foto1 = 'ws/tmp/pessoa.png';
        } else if (!file_exists($foto)) {
            base64_to_jpeg($linha->foto1, 'tmp/'.$linha->id.'.jpg');
            $linha->foto1 = 'ws/'.$foto;
        }

        $info[] = $linha;
    }

    header('Content-Type: application/json');
    echo json_encode($info);
}

function base64_to_jpeg($base64_string, $output_file) {
    // open the output file for writing
    $ifp = fopen( $output_file, 'wb' );

    // split the string on commas
    // $data[ 0 ] == "data:image/png;base64"
    // $data[ 1 ] == <actual base64 string>
    $data = explode( ',', $base64_string );

    // we could add validation here with ensuring count( $data ) > 1
    fwrite( $ifp, base64_decode( $data[ 1 ] ) );

    // clean up the file resource
    fclose( $ifp );

    return $output_file;
}