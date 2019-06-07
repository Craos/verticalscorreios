var Entrada = function () {

    var criterios = null;

    /**
     *
     * @param callback
     * @constructor
     */
    this.Listar = function (callback) {

        var params =  JSON.stringify({
            command: 'select',
            fields: '*',
            from: 'notificacoes.fila',
            where: criterios
        });

        webservice.Request({
            c: 7,
            cn: 'as',
            process: 'query',
            params: params
        }, function (http) {

            criterios = null;
            if (http.response === 'null' || http.response === 'false')
            {
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
     * @param callback
     * @constructor
     */
    this.Adicionar = function (info, callback) {

        if (info.rastreio.length === 0 &&
            info.destinatario.length === 0 &&
            info.bloco.length === 0 &&
            info.unidade.length === 0)
            return;

        webservice.Request({
            c: 7,
            cn: 'as',
            process: 'query',
            params: JSON.stringify({
                command: 'insert',
                fields: info,
                from: 'notificacoes.entrada',
                returning: 'id'
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                dhtmlx.alert({
                    title: 'Atenção',
                    type: 'alert-error',
                    text: 'Houve um erro ao registrar as informações!<br>Por favor verifique sua conexão de rede e reinicie o sistema'
                });
                return;
            }
            callback(JSON.parse(JSON.parse(http.response)[0].query).id);

        });
    };

    /**
     *
     * @param ids
     * @param callback
     * @constructor
     */
    this.Remover = function (ids, callback) {

        webservice.Request({
            c: 7,
            cn: 'as',
            process: 'notificacoes.removerentrada',
            params: JSON.stringify({
                id: ids,
                removidor_por: JSON.parse(sessionStorage.auth).user.login
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false')
            {
                callback(null);
                return;
            }
            callback(true);

        });

    };

};