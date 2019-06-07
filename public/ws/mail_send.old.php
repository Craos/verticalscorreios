<?php
/**
 * Created by PhpStorm.
 * User: oberd
 * Date: 10/02/2017
 * Time: 13:31
 */

set_time_limit(0);
require_once('config.php');
require_once('mailer/class.phpmailer.php');

$arquivo_padrao = file_get_contents('modelo.html');
$cnn = pg_connect(PGSERVER);

if (!isset($_REQUEST['params']))
    exit(0);

$itens = json_decode($_REQUEST['params'])->lista;

$ntf = new Notificacao($arquivo_padrao, $cnn, $itens);
$ntf->Iniciar();

/**
 * Class Notificacao
 */
class Notificacao
{

    private $modelo;
    private $cnn;
    private $registros;

    /**
     * Notificacao constructor.
     * @param $modelo
     * @param $connection
     * @param $lista
     */
    public function __construct($modelo, $connection, $lista)
    {
        $this->modelo = $modelo;
        $this->cnn = $connection;
        $this->Listar($lista);
    }

    /**
     * Lista todas as entradas que estão em aberto (O campo enviado deve estar vazio)
     * @param $lista
     */
    private function Listar($lista)
    {
        $pesquisaregistros = <<<SQL
        SELECT bloco, unidade, to_char(entrada.filedate, 'DD/MM/YYYY HH24:MI:ss') AS data, modelos.mensagem, rastreio, entrada.id, entrada.id as codigo 
          FROM notificacoes.entrada
          JOIN notificacoes.modelos on entrada.modelo = modelos.id
         WHERE entrada.id IN ($lista);
SQL;

        $this->registros = pg_query($this->cnn, $pesquisaregistros);
    }

    /**
     * Busca as informações de um correspondente para enviar e-mails
     * @return object
     */
    private function ListarCorrespondente()
    {
        $pesquisaregistros = <<<SQL
        SELECT * 
          FROM notificacoes.obtercorrespondente
         LIMIT 1;
SQL;

        return pg_fetch_object(pg_query($this->cnn, $pesquisaregistros));
    }

    /**
     * Inicia o processo de envio das notificações
     */
    public function Iniciar()
    {

        if ($this->registros != false) {
            while ($dados = pg_fetch_object($this->registros)) {

                $enderecos = $this->ObterEnderecos($dados->bloco, $dados->unidade);

                if (pg_num_rows($enderecos) === 0) {

                    $erro = "Erro: Nenhum endereço de e-mail foi encontrado para esta unidade";
                    $this->RegistraErro($dados->bloco, $dados->unidade, $erro, 'Nenhum encontrado', 'Ainda não foi processado');
                    echo $erro;
                    return;
                }

                while ($destinatario = pg_fetch_object($enderecos)) {
                    $correspondente = $this->ListarCorrespondente();
                    $this->Enviar($dados, $correspondente, $destinatario->email);
                }
            }
        }
    }

    /**
     * @param $dados
     * @param $correspondente
     * @param $destinatario
     */
    private function Enviar($dados, $correspondente, $destinatario)
    {

        $ss = new PHPMailer();
        $ss->isSMTP();
        $ss->SMTPDebug = SMTPDEBUG;
        $ss->Debugoutput = function ($str, $level) {
            file_put_contents('smtp.log', gmdate('Y-m-d H:i:s') . "\t$level\t$str\n", FILE_APPEND | LOCK_EX);
        };
        $ss->Debugoutput = SMTPDEBUGOUTPUT;
        $ss->Host = $correspondente->smtp_host;
        $ss->SMTPSecure = $correspondente->smtp_secure;
        $ss->Port = $correspondente->smtp_port;
        $ss->SMTPAuth = $correspondente->smtp_auth;
        $ss->Username = $correspondente->endereco;
        $ss->Password = $correspondente->senha;
        $ss->From = $correspondente->endereco;
        $ss->FromName = CORREIOSNAME;
        $ss->addReplyTo(CORREIOSEMAIL);
        $ss->isHTML(SMTPISHTML);

        $listavirgula = $this->multiexplode(array(",",";","|",":"),$destinatario);

        for ($i = 0; $i < count($listavirgula); $i++) {
            $ss->addAddress($listavirgula[$i]);
        }

        $ss->Subject = utf8_decode("Ânima Clube Comunicado N:$dados->id");

        $mensagem = $this->modelo;
        $mensagem = str_replace('#BLOCO#', $dados->bloco, $mensagem);
        $mensagem = str_replace('#UNIDADE#', $dados->unidade, $mensagem);
        $mensagem = str_replace('#DATA#', $dados->data, $mensagem);
        $mensagem = str_replace('#MENSAGEM#', $dados->mensagem, $mensagem);
        $mensagem = str_replace('#id#', $dados->codigo, $mensagem);
        $mensagem = str_replace('#SEQUENCIA#', $dados->rastreio, $mensagem);

        $ss->Body = utf8_decode($mensagem);

        try {
            if (!$ss->send()) {

                $this->RegistraProcessamento($dados->id, 'Erro de processamento', $correspondente->id, $ss->ErrorInfo);
                $this->RegistraErro($dados->bloco, $dados->unidade, $ss->ErrorInfo, $correspondente, $destinatario);
                infolog(" T:" . $dados->bloco . " U:" . $dados->unidade . " CD:" . $dados->codigo . " RST:" . $dados->rastreio . " ORG:" . $correspondente->endereco . " DST:" . $destinatario . " ERROR:" . $ss->ErrorInfo);

                echo json_encode(
                    Array(
                        'situacao' => 'Erro de processamento',
                        'ErrorInfo'=>$ss->ErrorInfo,
                        'Recipientes'=>$destinatario,
                        'Correspondentes'=>$correspondente
                    )
                );
                return;

            }
        } catch (Exception $e) {

            $this->RegistraProcessamento($dados->id, 'Erro interno', $correspondente->id, $e->getMessage());
            $this->RegistraErro($dados->bloco, $dados->unidade, $e->getMessage(), $correspondente, $destinatario);

            infolog(" T:" . $dados->bloco . " U:" . $dados->unidade . " CD:" . $dados->codigo . " RST:" . $dados->rastreio . " ORG:" . $correspondente->endereco . " DST:" . $destinatario . " EXCEPTION:" . $e->getMessage());
            header('Content-Type: application/json');
            echo json_encode(Array('situacao' => 'Erro interno', $e->getMessage()));
            return;

        }

        infolog(" T:" . $dados->bloco . " U:" . $dados->unidade . " CD:" . $dados->codigo . " RST:" . $dados->rastreio . " ORG:" . $correspondente->endereco . " DST:" . $destinatario);

        $this->RegistraProcessamento($dados->id, 'Notificado', $correspondente->id);
        echo json_encode(Array('situacao' => 'Finalizado'));

    }

    private function multiexplode ($delimiters,$string) {

        $ready = str_replace($delimiters, $delimiters[0], $string);
        $launch = explode($delimiters[0], $ready);
        return  $launch;
    }


    /**
     * @param $bloco
     * @param $unidade
     * @return null|resource
     */
    private function ObterEnderecos($bloco, $unidade)
    {

        $instrucao_enderecos = <<<EMAILS
        SELECT email
          FROM condominio.lista_emails_unidade
         WHERE bloco = $bloco AND unidade = $unidade
         GROUP BY email;
EMAILS;

        return pg_query($instrucao_enderecos);
    }

    /**
     * Informa na tabela de erros as ocorrências da tentaviva de envio
     * @param $bloco
     * @param $unidade
     * @param $erro
     * @param $correspondente
     * @param $destinatario
     */
    private function RegistraErro($bloco, $unidade, $erro, $correspondente, $destinatario)
    {

        $remetente = $correspondente->endereco;

        $instrucao = <<<SQL
            INSERT INTO notificacoes.erros (bloco, unidade, descricao, remetente, destinatario) 
              VALUES ($bloco, $unidade, '$erro', '$remetente', '$destinatario');
SQL;


        pg_query($instrucao);

    }

    /**
     * @param $id
     * @param $situacao
     * @param $correspondente
     * @param string $observacoes
     */
    private function RegistraProcessamento($id, $situacao, $correspondente, $observacoes = null)
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
        try {
            pg_query($instrucao);
            //wh_log($instrucao);
        } catch (Exception $e) {
            wh_log($e->getMessage());
        }


    }
}

function wh_log($log_msg)
{
    $log_filename = "log";
    if (!file_exists($log_filename)) {
        // create directory/folder uploads.
        mkdir($log_filename, 0777, true);
    }
    $log_file_data = $log_filename . '/log_' . date('d-M-Y') . '.log';
    file_put_contents($log_file_data, $log_msg . "\n", FILE_APPEND);
}

function infolog($log_msg)
{
    /*$log_filename = "./log/smart.correios.log";
    if (!file_exists($log_filename)) {
        mkdir($log_filename, 0777, true);
    }
    file_put_contents($log_filename, date("Y-m-d H:i:s", time()) . $log_msg . "\n", FILE_APPEND);
    */
}

