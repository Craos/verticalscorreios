var Unidade = function () {

    var that = this, list;

    /**
     *
     * @returns {*}
     */
    this.objLista = function () {
        return list;
    };


    /**
     *
     * @param info
     * @constructor
     */
    this.Exibir = function (info) {

        cell.detachObject();
        cell.progressOn();

        list = cell.attachList({
            container: "data_container",
            type: {
                template: "http->html/moradores_list.html",
                height: 120
            }
        });

        if (info !== null)
            that.MontaLista(info);
    };

    /**
     *
     * @param info
     * @constructor
     */
    this.MontaLista = function (info) {

        if (info === null) {
            dhtmlx.alert({
                title: 'Atenção',
                type: 'alert-error',
                text: 'Nenhum registro encontrado!<br>Por favor verifique a conexão de rede'
            });
            cell.progressOff();
            return;
        }

        list.parse(info, 'json');
        cell.progressOff();
    };

};