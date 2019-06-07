<?php


class Registros
{

    public $lista;

    public function __construct($lista)
    {
        $sql =<<<SQL
            SELECT * 
              FROM notificacoes.lista_para_envio
             WHERE id in ($lista);
SQL;

        $this->lista = pg_query($sql);

    }

    public function RegistraProcessamento($id, $situacao, $correspondente, $observacoes = null)
    {

        $instrucao = <<<SQL
    UPDATE notificacoes.entrada
       SET 
            enviado = current_timestamp, 
            processamento = '$situacao', 
            correnspondente = $correspondente,
            observacoes = '$observacoes'
     WHERE id = $id;
SQL;

        pg_query($instrucao);

    }

}