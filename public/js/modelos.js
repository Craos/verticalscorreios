var Modelos = function () {

    /**
     *
     * @param callback
     * @constructor
     */
    this.Listar = function (callback) {
        webservice.Request({
            c: 7,
            cn: 'as',
            process: 'query',
            params: JSON.stringify({
                command: 'select',
                fields: 'id,nome_modelo',
                from: 'notificacoes.modelos',
                orderby: 'nome_modelo'
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                callback(null);
                return;
            }

            var listatipos = JSON.parse(http.response);
            var response = [];
            listatipos.filter(function (item) {
                response.push(JSON.parse(item.query));
            });
            callback(response);
        });

    };

};