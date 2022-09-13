class Reles {

    /**
     * Aceita string's e array's.
     * 
     * Formato esperado [Array's] : [1, 2, 5] 
     * 
     * formato esperado [String's] : "RL1, RL2, RL5"
     * @param {*} relesParaAcionamento 
     * @param {function} callback
     * @param {number} timeOut
     */
    static LigaReles(relesParaAcionamento, callback = () => { }, timeOut = 100) {

        if (typeof (relesParaAcionamento) === "string") {

            let reles = relesParaAcionamento.split(",")
            let relesParaDesacionar = new Array()
            let relesParaAcionar = new Array()

            relesParaAcionar = []
            relesParaDesacionar = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

            if (reles != "") {
                // Laco que preenche vetor de acionamento e remove os devidos elementos do vetor de desacionamento dos reles
                for (let indice = 0; indice < reles.length; indice++) {
                    relesParaAcionar.push(Number(reles[indice].substring(reles[indice].indexOf("RL") + "RL".length)))   // Separa o "RL" de cada elemento e popula vetor de acionamento com o numero do rele que sera acionado
                    relesParaDesacionar.splice(relesParaDesacionar.indexOf(relesParaAcionar[indice]), 1)                // Busca o elemento (numero do rele) que deve ser acionado e remove do vetor de desacionamento
                }
            }
            // Sistema de timeouts garante que os desacionamentos dos reles serao executados antes dos acionamentos
            setTimeout(() => {

                let selecionaRele

                for (let quantidadeReles = 0; quantidadeReles < relesParaDesacionar.length; quantidadeReles++) {
                    selecionaRele = relesParaDesacionar[quantidadeReles]
                    pvi.daq.desligaRele(selecionaRele)
                }

                setTimeout(() => {
                    let selecionaRele

                    for (let quantidadeReles = 0; quantidadeReles < relesParaAcionar.length; quantidadeReles++) {
                        selecionaRele = relesParaAcionar[quantidadeReles]
                        pvi.daq.ligaRele(selecionaRele)
                    }

                    callback()

                }, timeOut)

            }, timeOut)

        } else if (typeof (relesParaAcionamento) === "object") {

            console.log("Relés Acionados", relesParaAcionamento)

            let relesDaq = []
            let relesParaDesacionamento = []

            /**
             * Monta lista de reles do DAQ
             */
            for (let index = 1; index <= 18; index++) {
                relesDaq.push(index)
            }

            /**
             * Seleciona reles para desacionamento
             */
            relesDaq.forEach(releDaq => {
                if (!relesParaAcionamento.includes(releDaq)) {
                    relesParaDesacionamento.push(releDaq)
                }
            })

            /**
             * Desaciona reles selecionados
             */
            relesParaDesacionamento.forEach(rele => {
                pvi.daq.desligaRele(rele)
            })

            /**
             * Aciona reles passados inicialmente
             */
            relesParaAcionamento.forEach(rele => {
                pvi.daq.ligaRele(rele)
            })

            setTimeout(() => {
                callback()
            }, timeOut)
        }

    }

    /**
     * @param {number} relay 
     * @param {[number]} buffer 
     */
    static AddRelayToBuffer(relay, buffer) {
        buffer.push(relay)
    }

    /**
     * @param {number} relay 
     * @param {[number]} buffer 
     */
    static RemoveRelayFromBuffer(relay, buffer) {
        buffer.forEach((bufferRelay, index) => {
            if (bufferRelay == relay) {
                buffer.splice(index, 1)
            }
        })
    }

    /**
     * @param {[number]} buffer 
     */
    static ClearBufferRelay(buffer) {
        buffer.splice(0, buffer.length)
    }
}



