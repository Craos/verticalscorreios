<?php


class Remetentes
{
    public $lista = null;

    public function __construct()
    {
        $sql = <<<SQL
            SELECT * 
              FROM notificacoes.correspondentes
             WHERE habilitado = true;
SQL;

        $result = pg_query($sql);
        if (pg_num_rows($result) > 0) {
            $this->lista = $result;
        }

    }
}