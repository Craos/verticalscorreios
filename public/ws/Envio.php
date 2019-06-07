<?php


use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

// Load Composer's autoloader
require 'vendor/autoload.php';


/**
 * @property object Registro
 * @property object Remetente
 * @property object Destinatario
 */
class Envio extends PHPMailer
{

    public $Remetente;
    public $Destinatario;
    public $Modelo;
    public $Observacoes;
    public $Registro;
    private $ss;

    /**
     * Envio constructor.
     * Inicia o objeto PHPMailer
     * @param bool $exceptions
     */
    public function __construct($exceptions = true)
    {

        parent::__construct($exceptions);
        $this->isSMTP();

    }

    /**
     * Informa os parâmetros do servidor para conexão SMTP
     */
    public function PreparaPropriedades() {

        $this->Host = $this->Remetente['smtp_host'];
        $this->SMTPSecure = $this->Remetente['smtp_secure'];
        $this->Port = $this->Remetente['smtp_port'];
        $this->SMTPAuth = $this->Remetente['smtp_auth'];
        $this->Username = $this->Remetente['endereco'];
        $this->Password = $this->Remetente['senha'];
        $this->From = $this->Remetente['endereco'];
        $this->FromName = $this->Remetente['nome'];
        $this->setLanguage('br');
        $this->addReplyTo($this->Remetente['endereco']);
        $this->isHTML(SMTPISHTML);

    }

    /**
     * Adiciona a lista de endereços destinatários ao PHPMailer
     */
    public function PreparaRecipientes() {

        foreach ($this->Destinatario as $endereco) {
            $this->addBCC($endereco);
        }

    }

    /**
     * Monta o corpo do e-mail
     */
    public function PreparaConteudo() {

        $this->Subject = utf8_decode(SMTPASSUNTO.$this->Registro->id);

        $mensagem = $this->Modelo;
        $mensagem = str_replace('#BLOCO#', $this->Registro->bloco, $mensagem);
        $mensagem = str_replace('#UNIDADE#', $this->Registro->unidade, $mensagem);
        $mensagem = str_replace('#DATA#', $this->Registro->data, $mensagem);
        $mensagem = str_replace('#MENSAGEM#', $this->Registro->mensagem, $mensagem);
        $mensagem = str_replace('#id#', $this->Registro->codigo, $mensagem);
        $mensagem = str_replace('#SEQUENCIA#', $this->Registro->rastreio, $mensagem);

        $this->Body = utf8_decode($mensagem);

    }

    /**
     * Envia a mensagem
     * @return bool|null
     */
    public function Iniciar() {

        try {

            if ($this->send()) {
                return true;
            }

            $this->Observacoes = $this->ErrorInfo;
            return false;

        } catch (Exception $e) {
            $this->Observacoes = $e->getMessage();

            if ($e->getCode() === 2) {
                return false;
            }
            return null;
        }

    }

    /**
     * @param mixed $Registro
     * @return Envio
     */
    public function setRegistro($Registro)
    {
        $this->Registro = $Registro;
        return $this;
    }

}