var Historico = function () {

    var that = this;

    /**
     *
     * @param info
     * @constructor
     */
    this.Exibir = function (info) {

        cell.detachObject();
        cell.progressOn();
        that.Listar(info, function (info) {
            that.MontaGrid(info);
        });

    };

    /**
     *
     * @param registros
     * @constructor
     */
    this.BuscarItens = function (registros) {

        cell.detachObject();
        cell.progressOn();
        webservice.Request({
            c: 7,
            cn: 'as',
            process: 'query',
            params: JSON.stringify({
                command: 'select',
                fields: '*',
                from: 'notificacoes.historico_list',
                where: 'id in (' + registros + ')'
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                cell.progressOff();
                return;
            }

            var listaresultado = JSON.parse(http.response);
            var response = [];
            listaresultado.filter(function (item) {
                response.push(JSON.parse(item.query));
            });

            that.MontaGrid(response);
            cell.progressOff();
        });

    };

    /**
     *
     * @param info
     * @param callback
     * @constructor
     */
    this.Listar = function (info, callback) {

        var params = JSON.stringify({
            command: 'select',
            fields: '*',
            from: 'notificacoes.historico_list',
            where: 'bloco = ' + info.bloco + ' and unidade = ' + info.unidade
        });

        webservice.Request({
            c: 7,
            cn: 'as',
            process: 'query',
            params: params
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                callback(null);
                return;
            }

            var listaresultado = JSON.parse(http.response);
            var response = [];
            listaresultado.filter(function (item) {
                response.push(JSON.parse(item.query));
            });
            callback(response);
        });

    };

    /**
     *
     * @param info
     * @constructor
     */
    this.MontaGrid = function (info) {
        if (info === null) {
            dhtmlx.alert({
                title: 'Atenção',
                type: 'alert-error',
                text: 'Nenhum registro encontrado!<br>Por favor verifique a conexão de rede'
            });
            cell.progressOff();
            return;
        }

        var grid = cell.attachGrid();
        grid.setImagePath('img/');
        grid.enableHeaderImages(false);
        grid.setHeader("Entrada,Cadastrado por, Bloco, Unidade, Destinatário, Código de Rastreio, Modelo da notificação, Data notificação, Data da entrega, Autorizado por, Responsável saída");
        grid.attachHeader("#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter");
        grid.setInitWidths("140,80,60,60,120,,,140,140,140");
        grid.setColTypes("ro,ro,ro,ro,ro,ro,ro,ro,ro,link,ro");
        grid.enableSmartRendering(true);
        grid.init();
        grid.clearAll();

        info.filter(function (item) {
            grid.addRow(item.id, [
                item.entrada,
                item.uid,
                item.bloco,
                item.unidade,
                item.destinatario,
                item.rastreio,
                item.nome_modelo,
                item.enviado,
                item.saida,
                item.autorizado_por,
                item.responsavel_saida
            ]);
        });

        gridcorrente = {grid: grid, origem: 'hist'};
        cell.progressOff();
    };

};

/**
 *
 * @param id
 */
function fotowebcam(id) {
    webservice.Request({
        c: 7,
        cn: 'as',
        process: 'query',
        params: JSON.stringify({
            command: 'select',
            fields: 'translate(foto, chr(32), chr(43)) as foto',
            from: 'notificacoes.historico_foto',
            where: "id = " + id
        })
    }, function (http) {

        if (http.response === 'null' || http.response === 'false') {
            return;
        }

        VisualizarFoto(JSON.parse(JSON.parse(http.response)[0].query).foto);
    });
}

/**
 *
 * @param serial
 */
function fotorfid(serial) {
    webservice.Request({
        c: 7,
        cn: 'as',
        process: 'query',
        params: JSON.stringify({
            command: 'select',
            fields: 'foto1 as foto',
            from: 'condominio.moradores',
            where: "autenticacao = right(upper(('" + serial + "')), 5);"
        })
    }, function (http) {

        if (http.response === 'null' || http.response === 'false') {
            return;
        }

        var morador = JSON.parse(http.response);
        VisualizarFoto(JSON.parse(morador[0].query).foto);
    });
}

/**
 *
 * @param foto
 * @constructor
 */
function VisualizarFoto(foto) {
    var win = new dhtmlXWindows();
    var winfoto = win.createWindow('obterfoto', 0, 0, 510, 445);

    winfoto.setText('Visualizar foto');
    winfoto.denyResize();
    winfoto.centerOnScreen();
    winfoto.button('park').hide();
    winfoto.button('minmax1').hide();

    var form = winfoto.attachForm([
        {type: "container", name: "displayfoto", inputWidth: 500, inputHeight: 377}
    ]);

    var fotocadastro = form.getContainer("displayfoto");
    fotocadastro.innerHTML = '';

    if (fotocadastro !== null && foto !== null) {
        if (foto.length > 0) {
            fotocadastro.innerHTML = '<img id="fotodwd" style="width: 500px;" alt="" src="' + foto + '">';
        }
    }
}