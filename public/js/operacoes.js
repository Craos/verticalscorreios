let statusbar = null, cell, gridcorrente;
let Operacoes = function (container) {

    let that = this, grid;

    let layout = container.attachLayout({
        pattern: '1C',
        offsets: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        cells: [
            {
                id: 'a',
                header: false,
            }
        ]
    });

    let cell = layout.cells('a');

    statusbar = cell.attachStatusBar({
        text: "",
        height: 35
    });

    let toolbar = cell.attachToolbar({
        icon_path: 'img/comandos/'
    });

    toolbar.loadStruct([
        {type: 'button', id: 'atualizar', img: 'atualizar.png', text: 'Atualizar'},
        {type: 'separator'},
        {type: 'text', text: 'CD:'},
        {type: 'buttonInput', id: 'codigo', width: 330},
        {type: 'buttonInput', id: 'destinatario', width: 100},
        {type: 'buttonInput', id: 'bloco', width: 30},
        {type: 'buttonInput', id: 'unidade', width: 30},
        {type: 'buttonSelect', id: 'salvar', img: 'salvar.png', text: 'Salvar'},
        {type: 'button', id: 'excluir', img: 'excluir.png', text: 'Excluir'},
        {type: 'button', id: 'notificar', img: 'enviar.png', text: 'Notificar'},
        {type: 'button', id: 'historico', img: 'psqhist.png', text: 'Histórico'},
        {type: 'button', id: 'pesquisar', img: 'pesquisar.png', text: 'Pesquisar'},
        {type: 'button', id: 'autorizarrfid', img: 'entregar.png', text: 'Autorizar RFID'},
        {type: 'button', id: 'autorizarfoto', img: 'foto.png', text: 'Autorizar Foto'}
    ], function () {

        new Modelos().Listar(function (response) {

            if (response === null) {
                dhtmlx.alert({
                    title: 'Atenção',
                    type: 'alert-error',
                    text: 'Nenhum registro encontrado!<br>Por favor verifique a conexão de rede'
                });
                return;
            }

            var index = 0;
            response.filter(function (item) {
                toolbar.addListOption('salvar', 'efmodelo_' + item.id, index, 'button', item.nome_modelo);
                index++;
            });
        });

    });

    /**
     * Obtem o evento click do mouse na barra de comandos
     */
    toolbar.attachEvent("onClick", function (id) {

        var toolbarinputs = {
            rastreio: toolbar.getValue('codigo').toUpperCase(),
            destinatario: toolbar.getValue('destinatario').toUpperCase(),
            bloco: toolbar.getValue('bloco'),
            unidade: toolbar.getValue('unidade'),
            uid: JSON.parse(sessionStorage.auth).user.login
        };

        switch (id) {
            case 'atualizar':
                that.MontaGrid();
                that.AtualizaGrid();
                break;
            case 'historico':
                new Historico().Exibir(toolbarinputs);
                break;
            case 'pesquisar':
                that.Pesquisar(toolbarinputs);
                break;
            case 'autorizarrfid':
                that.AutorizarRFID();
                break;
            case 'autorizarfoto':
                that.AutorizarFoto();
                break;
            case 'excluir':
                that.RemoverRegistros();
                break;
            case 'notificar':
                that.Notificar();
                break;
        }

        if (id.indexOf('efmodelo_') > -1) {
            that.AdicionarRegistros(id, toolbarinputs);
        }
    });


    /**
     * Eventos do sistema
     */
    document.addEventListener("AoConcluirAutorizacao", function (info) {
        statusbar.setText('Autorização concluída com sucesso');
        dhtmlx.alert({
            title: 'Autorização',
            type: 'alert',
            text: 'Autorização efetuada com sucesso'
        });
        new Historico().BuscarItens(info.detail.registros);
    });

    /**
     * Apresenta a tabela pré-definida dos registros de entrada que estão aguardando a retirada
     * @constructor
     */
    this.MontaGrid = function () {

        cell.detachObject();
        grid = cell.attachGrid();
        grid.setImagePath('img/');
        grid.enableHeaderImages(false);
        grid.setHeader("Entrada,Cadastrado por, Bloco, Unidade, Destinatário, Código de Rastreio, Modelo da notificação, Notificação, Processamento");
        grid.attachHeader("#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter");
        grid.setInitWidths("130,140,100,100,140,,140,150,*");
        grid.setColTypes("ro,ro,ro,ro,ro,ro,ro,ro,ro");
        grid.setColSorting("date,str,int,int,str,str,str,date,str");
        grid.enableSmartRendering(true);
        grid.enableMultiselect(true);
        grid.attachFooter("Registros:,<div id='qtd'>0</div>,&nbsp;,&nbsp;,&nbsp;,&nbsp;,&nbsp;,&nbsp;,&nbsp;", ["text-align:left;"]);
        grid.init();
        grid.clearAll();

        grid.attachEvent("onKeyPress", function (code) {
            if (code === 46)
                that.RemoverRegistros();
        });

        grid.attachEvent("onFilterEnd", function () {
            that.Totalizar();
        });

    };

    /**
     *
     * @constructor
     */
    this.Notificar = function () {

        if (grid.getSelectedRowId() === null) {
            dhtmlx.alert({
                title: 'Atenção',
                type: 'alert-error',
                text: 'Você deve selecionar os registros antes da identificação do usuário'
            });
            return;
        }

        new Notificacao(grid.getSelectedRowId()).Iniciar(function () {
           that.AtualizaGrid();
        });

    };

    /**
     * Executa o processo de pesquisa das informações de acordo com o tipo de campo preenchido
     * na barra de comandos
     * @param info
     * @constructor
     */
    this.Pesquisar = function (info) {

        var pesquisa = new Pesquisa(info);

        if (info.rastreio.length > 0) {
            pesquisa.Rastreio(function (response) {
                that.AdicionarRegistrosGrid(response);
            });
        } else if (info.destinatario.length > 0) {
            pesquisa.Nomes(function (response) {
                new Unidade().Exibir(response);
            });
        } else {
            pesquisa.Unidade(function (response) {
                new Unidade().Exibir(response);
            });
        }

    };


    /**
     * Apresenta o grid com os registros da tabela de entrada para que o usuário possa efetuar operações entre
     * a barra de comandos e as linhas selecionadas na no grid
     * @constructor
     */
    this.AtualizaGrid = function () {

        new Entrada().Listar(function (response) {

            if (response === null) {
                statusbar.setText('Nenhum registro encontrado.');
                return;
            }
            that.AdicionarRegistrosGrid(response);
        });

    };

    this.AdicionarRegistrosGrid = function (info) {

        cell.progressOn();
        grid.clearAll();

        info.filter(function (item) {

            let modelo = '<i class="fa fa-envelope-o env">&nbsp;<span class="mdcr">Carta registrada</span></i>';
            if (item.modelo !== undefined && item.modelo.indexOf('2.') > -1)
                modelo = '<i class="fa md">&#xf0fa;&nbsp;<span class="mdmd">Medicamentos</span></i>';

            let envio = '';
            if (item.processamento === undefined || item.processamento === null) {
                envio = '';
            } else if (item.processamento.indexOf('Not') > -1) {
                envio = '<i style="font-size:20px; color: #0490b7" class="fa">&#xf00c;</i> ' + item.enviado;
            } else if (item.processamento.indexOf('Err') > -1) {
                envio = '<i class="fa fa-close" style="font-size:20px;color:red"></i> ' + item.enviado;
            } else {
                envio = '';
            }

            grid.addRow(item.id, [
                item.filedate,
                item.uid,
                item.bloco,
                item.unidade,
                item.destinatario,
                item.rastreio,
                modelo,
                envio,
                item.processamento
            ]);

            if (item.processamento !== null) {
                if (item.processamento === 'Notificado') {
                    grid.setRowColor(item.id, "#e8f2fe");
                } else if (item.processamento.indexOf('Erro') > -1) {
                    grid.setRowColor(item.id, "#ffdde2");
                }
            }
        });

        that.Totalizar();
        gridcorrente = {grid: grid, origem: 'entrada'};
        cell.progressOff();

    };


    /**
     * Inicia o processo de autorização das encomendas pela leitura do RFID
     * @constructor
     */
    this.AutorizarRFID = function () {

        if (gridcorrente.grid.getSelectedRowId() === null) {
            dhtmlx.alert({
                title: 'Atenção',
                type: 'alert-error',
                text: 'Você deve selecionar os registros antes da identificação do usuário'
            });
            return;
        }

        statusbar.setText('Aguardando a passagem do dispositivo de identificação');
        var rIds = gridcorrente.grid.getSelectedRowId().split(',');

        new Autorizacao({
            bloco: gridcorrente.grid.cells(rIds[0], 2).getValue(),
            unidade: gridcorrente.grid.cells(rIds[0], 3).getValue(),
            registros: gridcorrente.grid.getSelectedRowId(),
            origem: gridcorrente.origem
        }).AguardarConfirmacaoRFID();

    };

    /**
     * Inicia o processo de autorização das encomendas pela foto do morador
     * @constructor
     */
    this.AutorizarFoto = function () {

        if (grid.getSelectedRowId() === null) {
            dhtmlx.alert({
                title: 'Atenção',
                type: 'alert-error',
                text: 'Você deve selecionar os registros antes da identificação do usuário'
            });
            return;
        }

        cell.progressOn();
        var rIds = grid.getSelectedRowId().split(',');

        new Autorizacao({
            bloco: grid.cells(rIds[0], 2).getValue(),
            unidade: grid.cells(rIds[0], 3).getValue(),
            registros: grid.getSelectedRowId()
        }).AguardarConfirmacaoFoto();

    };


    /**
     * Atualiza a quantidade de registros no grid
     * @constructor
     */
    this.Totalizar = function () {
        document.getElementById('qtd').innerText = grid.getRowsNum();
    };


    /**
     * Registra as informações de entrada no banco de dados
     * @param id
     * @param inputs
     * @constructor
     */
    this.AdicionarRegistros = function (id, inputs) {

        inputs.modelo = id.replace(/^\D+/g, '');
        new Entrada().Adicionar(inputs, function (response_id) {

            if (response_id === null)
                return;

            toolbar.setValue('codigo', '');
            toolbar.setValue('destinatario', '');
            toolbar.setValue('bloco', '');
            toolbar.setValue('unidade', '');

            var modelo = '<i class="fa fa-envelope-o env">&nbsp;<span class="mdcr">Carta registrada</span></i>';
            if (toolbar.getListOptionText('salvar', id).indexOf('2.') > -1)
                modelo = '<i class="fa md">&#xf0fa;&nbsp;<span class="mdmd">Medicamentos</span></i>';


            grid.addRow(response_id, [
                window.dhx.date2str(new Date(), "%d/%m/%Y %H:%i"),
                JSON.parse(sessionStorage.auth).user.login,
                inputs.bloco,
                inputs.unidade,
                inputs.destinatario,
                inputs.rastreio,
                modelo
            ], 0);

            grid.setRowColor(response_id, "#dfe2f3");
            gridcorrente = {grid: grid, origem: 'entrada'};
            that.Totalizar();
        });
    };


    /**
     * Exclui os registros da tabela de entrada de acordo com as linhas selecionadas no grid
     * @constructor
     */
    this.RemoverRegistros = function () {

        dhtmlx.confirm({
            type: 'confirm-warning',
            title: "Confirmação de exclusão do registro",
            ok: "Sim", cancel: "Não",
            text: "Você confirma a exclusão do registro?",
            callback: function (result) {
                if (result === false)
                    return;

                new Entrada().Remover(grid.getSelectedRowId(), function (info) {

                    if (info === null) {
                        dhtmlx.alert({
                            title: 'Atenção',
                            type: 'alert-error',
                            text: 'Não foi possível remover o registro.<br> Por favor reinicie o sistema e tente novamente'
                        });
                        return;
                    }
                    grid.deleteSelectedRows();
                });

            }
        });
    };

    /**
     * Carrega a fila de entregas
     */
    that.MontaGrid();
    that.AtualizaGrid();

};