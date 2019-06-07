let HistoricoEnvio = function (container) {

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


};