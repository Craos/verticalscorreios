var Pesquisa = function (info) {

    this.Unidade = function (callback) {

        new Webservice('./ws/unidade.php').Request({
            command: 'pesquisa_unidade',
            params: JSON.stringify(info)
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                dhtmlx.alert({
                    type: "alert-error",
                    text: "Erro no processamento dos registros.<br>Por favor verifique a conexão de rede e tente novamente",
                    title: "Correios",
                    ok: "OK"
                });
                return;
            }

            if (http.response === 'null' || http.response === 'false') {
                callback(null);
                return;
            }

            var dados = [];
            var result = JSON.parse(http.response);
            for (var i = 0; i < result.length; i++) {
                dados.push(result[i]);
            }
            callback(dados);

        });

    };

    this.Nomes = function (callback) {

        new Webservice('./ws/unidade.php').Request({
            command: 'pesquisa_nome',
            params: JSON.stringify({
                nome: info.destinatario
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                dhtmlx.alert({
                    type: "alert-error",
                    text: "Erro no processamento dos registros.<br>Por favor verifique a conexão de rede e tente novamente",
                    title: "Correios",
                    ok: "OK"
                });
                return;
            }

            if (http.response === 'null' || http.response === 'false') {
                callback(null);
                return;
            }

            var dados = [];
            var result = JSON.parse(http.response);
            for (var i = 0; i < result.length; i++) {
                dados.push(result[i]);
            }
            callback(dados);

        });

    };

    this.Rastreio = function (callback) {

        new Webservice('./ws/pesquisa.php').Request({
            command: 'pesquisa_rastreio',
            params: JSON.stringify(info)
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                dhtmlx.alert({
                    type: "alert-error",
                    text: "Erro no processamento dos registros.<br>Por favor verifique a conexão de rede e tente novamente",
                    title: "Correios",
                    ok: "OK"
                });
                return;
            }

            if (http.response === 'null' || http.response === 'false') {
                callback(null);
                return;
            }

            var dados = [];
            var result = JSON.parse(http.response);
            for (var i = 0; i < result.length; i++) {
                dados.push(result[i]);
            }
            callback(dados);

        });

    };

};