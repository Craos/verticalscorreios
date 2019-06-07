let Notificacao = function (lista) {

    let that = this, list, winAt;

    this.Iniciar = function (callback) {

        winAt = new dhtmlXWindows({
            image_path: "codebase/imgs/"
        });

        winAt.createWindow({
            id: "progresso",
            width: 900,
            height: 600,
            center: true
        });

        winAt.window('progresso').setText('Enviando as notificações');


        list = winAt.window('progresso').attachList({
            container:"data_container",
            type:{
                template:"http->./html/logenvio.html",
                height:"auto"
            }
        });


        let xhr = new XMLHttpRequest();

        xhr.open('POST', './ws/mail_send.php', true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
        xhr.setRequestHeader('cache-control', 'max-age=0');
        xhr.setRequestHeader('expires', '0');
        xhr.setRequestHeader('expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
        xhr.setRequestHeader('pragma', 'no-cache');
        xhr.timeout = 2880000;
        xhr.previus_text = '';

        xhr.onreadystatechange = function() {

            if (xhr.readyState === 4 && xhr.status === 500) {

                let result = JSON.parse(xhr.responseText);

                dhtmlx.message({
                    title: JSON.parse(sessionStorage.auth).title,
                    type: result.tipo,
                    text: result.mensagem
                });

            } else if (xhr.readyState > 2) {

                let new_response = xhr.responseText.substring(xhr.previus_text.length);

                let result;
                try {

                    if (new_response.length > 0) {
                        result = JSON.parse(new_response);
                        if (result.processamento !== undefined)
                            list.add(result.processamento, 0);
                    }
                }
                catch(e) {
                    console.exception(e);
                }

                xhr.previus_text = xhr.responseText;

            }
        };

        xhr.send(JSON.stringify(lista));

    };

};