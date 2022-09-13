class SmartTestDeviceControl {
    /**
     * @param {Array} releSobe array contendo o rele responsavel por fazer a base subir o motor
     * @param {Array} releDesce array contendo o rele responsavel por fazer a base descer o motor
     * @param {string} fimDeCursoSuperior string informando a entrada relacionada ao fim de curso superior
     * @param {string} fimDeCursoInferior string informando a entrada relacionada ao fim de curso inferior
     */
    constructor(releSobe, releDesce, fimDeCursoSuperior, fimDeCursoInferior) {
        this.ReleSobe = releSobe
        this.ReleDesce = releDesce
        this.FimDeCursoInferior = fimDeCursoInferior
        this.FimDeCursoSuperior = fimDeCursoSuperior
    }

    /**
     * Atua na descida do motor, até identificar o acionamento do fim de curso, ou estouro de timeout.
     * 
     * @param {function} callback 
     * @param {number} timeOut 
     */
    DesceMotor(callback, timeOut = 5000) {

        Reles.LigaReles(this.ReleDesce, () => {
            let aguardaFechamento = setInterval(() => {
                if (pvi.daq.in[this.FimDeCursoInferior].value) {
                    clearInterval(aguardaFechamento)
                    clearTimeout(timeOutFechamento)
                    Reles.LigaReles([], () => {
                        callback(true)
                    })
                }
            }, 100)
            let timeOutFechamento = setTimeout(() => {
                clearInterval(aguardaFechamento)
                Reles.LigaReles([], () => {
                    callback(false)
                })
            }, timeOut)
        })
    }

    /**
     * Atua na subida do motor, até identificar o acionamento do fim de curso, ou estouro de timeout.
     * 
     * @param {function} callback 
     * @param {number} timeOut 
     */
    SobeMotor(callback, timeOut = 5000) {

        Reles.LigaReles(this.ReleSobe, () => {

            let aguardaFechamento = setInterval(() => {
                if (pvi.daq.in[this.FimDeCursoSuperior].value) {
                    clearInterval(aguardaFechamento)
                    clearTimeout(timeOutFechamento)
                    Reles.LigaReles([], () => {
                        callback(true)
                    })
                }
            }, 100)

            let timeOutFechamento = setTimeout(() => {
                clearInterval(aguardaFechamento)
                Reles.LigaReles([], () => {
                    callback(false)
                })
            }, timeOut)
        })
    }

    /**
     * Inicia monitoramento da entrada informada, caso desacionada, trava a execução do script
     * 
     * OBS: por segurança, só é aceito no monitoramento o DESACIONAMENTO da entrada.
     * 
     * @param {string} entrada 
     * @param {number} interval 
     */
    ObserverEmergencia(entrada, interval = 300) {

        let monitor = setInterval(() => {

            if (!pvi.daq.in[entrada].value) {
                clearInterval(monitor)
                pvi.runInstructionS("RESET", [])
                alert("EMERGÊNCIA ACIONADA\n\nClique em OK para reinciar o teste")
                location.reload()
            }

        }, interval)
    }
}