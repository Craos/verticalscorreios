/**
 * Created by oberd on 21/07/2017.
 */

var webservice = new Webservice();
dhtmlxEvent(window, 'load', function () {

    if (!sessionStorage.auth) {

        sessionStorage.credentials = JSON.stringify({
            id: '$2a$06$AFSMmoY2qaCqvZkT8esZGuqcXK3uFHPOtUiQJPq7ZpnYgPomRBaba',
            name: 'smart.correios',
            title: 'Smart Correios',
            redirect: '../smart.correios',
            typeuser: 'internal',
            version: '5'
        });

        window.location = '../smart.auth';
        return;
    }

    let that = this, siderbar;

    siderbar = new dhtmlXSideBar({
        parent: document.body,
        template: 'icons',
        icons_path: 'img/siderbar/',
        single_cell: false,
        width: 50,
        header: true,
        autohide: false,
        offsets: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        items: [
            {
                id: 'controle',
                text: 'Controle de encomendas',
                icon: 'autorizacao.png',
                selected: true
            },
            {
                id: 'historico',
                text: 'Histórico de processamento',
                icon: 'historico.png',
                selected: false
            }
        ]

    });

    siderbar.attachEvent('onSelect', function(id) {
        that.SelecionarOpcao(id);
    });

    this.SelecionarOpcao = function(id) {
        switch (id) {
            case 'controle':
                new Operacoes(siderbar.cells('controle'));
                break;
            case 'historico':
                new HistoricoEnvio(siderbar.cells('historico'));
                break;
        }
    };

    new Operacoes(siderbar.cells('controle'));


});