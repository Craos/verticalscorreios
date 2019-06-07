/**
 * Inicia o processo de entrega das encomendas
 * @param paraautorizacao
 * @constructor
 */
var Autorizacao = function (paraautorizacao) {

    var that = this, win = new dhtmlXWindows(), winautorizacao, matricula, aguardando, winAt, ifr, contador = 0;

    /**
     *
     * @constructor
     */
    this.AguardarConfirmacaoRFID = function () {

        clearInterval(aguardando);
        winAt = new dhtmlXWindows({
            image_path: "codebase/imgs/"
        });

        var winat = "winautorizar";

        winAt.createWindow({
            id: winat,
            width: 500,
            height: 150,
            center: true,
            caption: "Processando a autorização"
        });

        winAt.window(winat).denyMove();
        winAt.window(winat).denyPark();
        winAt.window(winat).denyResize();
        winAt.window(winat).hideHeader();

        winAt.window("winautorizar").attachToolbar({
            icon_path: 'img/comandos/',
            items: [
                {id: "open", type: "button", text: "Cancelar", img: "cancelar.png"}
            ],
            onClick: function () {
                contador = 0;
                clearInterval(aguardando);
                winAt.window("winautorizar").close();
            }
        });

        winAt.window("winautorizar").attachEvent("onContentLoaded", function () {

            webservice.Request({
                c: 7,
                cn: 'as',
                process: 'smt.notificacoes.iniciar_autorizacao',
                params: JSON.stringify({})
            }, function (http) {

            });

            ifr = winAt.window("winautorizar").getFrame();
            aguardando = setInterval(verificapassagem, 1000);
        });

        winAt.window("winautorizar").attachURL("./html/aguardando.html");

    };

    function verificapassagem() {

        webservice.Request({
            c: 7,
            cn: 'as',
            process: 'smt.notificacoes.pesquisa_passagem',
            params: JSON.stringify({
                id: paraautorizacao.registros,
                bloco: paraautorizacao.bloco,
                unidade: paraautorizacao.unidade,
                responsavel: JSON.parse(sessionStorage.auth).user.login,
                origem: paraautorizacao.origem,
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                if (ifr.contentWindow !== null)
                    ifr.contentWindow.document.getElementById("texto").innerHTML = "Aguardando leitura do dispositivo.<br>Tentativa: " + contador++;
                return;
            }

            var response = JSON.parse(JSON.parse(http.response)[0].pesquisa_passagem);

            if (response.autenticacao !== null) {

                contador = 0;
                clearInterval(aguardando);

                if (winAt.window("winautorizar") !== null)
                    winAt.window("winautorizar").close();

                document.dispatchEvent(new CustomEvent("AoConcluirAutorizacao", {
                    detail: {registros: paraautorizacao.registros}
                }));

            }

        });
    }

    /**
     *
     * @constructor
     */
    this.AguardarConfirmacaoFoto = function () {

        var wfoto = new Foto();
        wfoto.Exibir();
        wfoto.AoConfirmarFoto(function (e) {

            webservice.Request({
                c: 7,
                cn: 'as',
                process: 'smt.notificacoes.autorizar_foto',
                params: JSON.stringify({
                    id: paraautorizacao.registros,
                    responsavel: JSON.parse(sessionStorage.auth).user.login,
                    foto: e,
                    bloco: paraautorizacao.bloco,
                    unidade: paraautorizacao.unidade,

                })
            }, function (http) {

                if (http.response === 'null' || http.response === 'false') {
                    dhtmlx.alert({
                        title: 'Atenção',
                        type: 'alert-error',
                        text: 'Erro na autorização dos registros.<br>Por favor verifique sua conexão de rede e tente novamente'
                    });
                    return;
                }

                document.dispatchEvent(new CustomEvent("AoConcluirAutorizacao", {
                    detail: {registros: paraautorizacao.registros}
                }));

            });

        });
    };

    /**
     *
     * @constructor
     */
    this.ObterFoto = function () {

        var unidade = new Unidade();
        winautorizacao.detachObject();
        winautorizacao.detachToolbar();

        var toolbarfoto = winautorizacao.attachToolbar({
            icon_path: 'img/comandos/',
            items: [
                {
                    type: 'button',
                    id: 'autorizar',
                    img: 'autorizar.png',
                    img_disabled: "autorizar.png",
                    text: 'Concluir',
                    disabled: true
                },
                {type: 'separator'},
                {type: 'button', id: 'obterfoto', img: 'foto.png', text: 'Obter foto'}
            ]
        });

        toolbarfoto.attachEvent("onClick", function (id) {

            if (id === 'autorizar') {
                that.Autorizar();
            } else if (id === 'obterfoto') {

                matricula = unidade.objLista().getSelected();
                var wfoto = new Foto();
                wfoto.Exibir();
                wfoto.AoConfirmarFoto(RegistraFoto);
            }

        });

        winautorizacao.progressOn();
        unidade.PesquisaUnidade(paraautorizacao, function (info) {
            unidade.MontaLista(winautorizacao, info);


        });
    };

    /**
     *
     * @param e
     * @constructor
     */
    function RegistraFoto(e) {
        webservice.Request({
            c: 7,
            cn: 'as',
            process: 'notificacoes.autorizar',
            params: JSON.stringify({
                id: paraautorizacao.registros,
                responsavel: JSON.parse(sessionStorage.auth).user.login,
                autenticacao: null,
                foto: e,
                morador: matricula
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                dhtmlx.alert({
                    type: "alert-error",
                    text: "Erro ao tentar salvar a foto.<br>Por favor verifique as conexões e tente novamente",
                    title: "Correios",
                    ok: "OK"
                });
                return;
            }

            win.window('confirmarautorizacao').close();
            document.dispatchEvent(new CustomEvent("AoConcluirAutorizacao", {
                detail: {registros: paraautorizacao.registros}
            }));

        });
    }

    /**
     *
     * @constructor
     */
    this.Autorizar = function () {

        webservice.Request({
            c: 7,
            cn: 'as',
            process: 'notificacoes.autorizar',
            params: JSON.stringify({
                id: paraautorizacao.registros,
                responsavel: JSON.parse(sessionStorage.auth).user.login
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                dhtmlx.alert({
                    title: 'Atenção',
                    type: 'alert-error',
                    text: 'Erro na autorização dos registros.<br>Por favor verifique sua conexão de rede e tente novamente'
                });
                return;
            }

            win.window('confirmarautorizacao').close();
            document.dispatchEvent(new CustomEvent("AoConcluirAutorizacao", {
                detail: {registros: paraautorizacao.registros}
            }));
        });

    }

};