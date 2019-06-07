<?php


class Destinatarios
{

    private $itens = Array();
    public $lista;

    public function __construct($bloco, $unidade)
    {
        $sql = <<<SQL
            SELECT proprietario, usuario_web, imobiliaria, para_correspondencia 
              FROM notificacoes.lista_destinatarios
             WHERE bloco = $bloco and unidade = $unidade
             LIMIT 1
SQL;

        $dados = pg_fetch_object(pg_query($sql));

        $this->adicionarendereco($this->multiexplode($dados->proprietario));
        $this->adicionarendereco($this->multiexplode($dados->usuario_web));
        $this->adicionarendereco($this->multiexplode($dados->imobiliaria));
        $this->adicionarendereco($this->multiexplode($dados->para_correspondencia));
        $this->lista = array_unique($this->itens);

    }

    private function adicionarendereco($origem) {

        for ($i = 0; $i < count($origem); $i++) {

            $item = trim($origem[$i]);
            if (strlen($item) > 0)
                $this->itens[] = $item;

        }

    }


    private function multiexplode($string)
    {
        $delimiters = array(",",";","|",":");
        $ready = str_replace($delimiters, $delimiters[0], $string);
        $launch = explode($delimiters[0], $ready);
        return $launch;
    }


}