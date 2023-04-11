class SmartTestDeviceControl {
    /**
     * 
     * @param {Array} releSobe array contendo o rele responsavel por fazer a base subir o motor
     * @param {Array} releDesce array contendo o rele responsavel por fazer a base descer o motor
     * @param {string} fimDeCursoSuperior string informando a entrada relacionada ao fim de curso superior
     * @param {string} fimDeCursoInferior string informando a entrada relacionada ao fim de curso inferior
     * @param {string} bimanual string informando a entrada relacionada ao bimanual
     * @param {string} emergencia string informando a entrada relacionada a emergencia
     */
    constructor(releSobe, releDesce, fimDeCursoSuperior, fimDeCursoInferior, bimanual, emergencia) {
        this.FimDeCursoInferior = fimDeCursoInferior
        this.FimDeCursoSuperior = fimDeCursoSuperior
        this.Emergencia = emergencia
        this.ReleDesce = releDesce
        this.ReleSobe = releSobe
        this.Bimanual = bimanual

        this.EmergenciaAcionada = false
    }

    /**
     * Atua na descida do motor, até identificar o acionamento do fim de curso, ou estouro de timeout.
     * 
     * @param {function} callback 
     * @param {number} timeOut 
     */
    DesceMotor(callback, timeOut = 5000, nivelLogico = true) {

        let aguardaFechamento = setInterval(() => {
            if (pvi.daq.in[this.FimDeCursoInferior].value == nivelLogico) {
                clearInterval(aguardaFechamento)
                clearTimeout(timeOutFechamento)
                pvi.daq.desligaRele(this.ReleDesce)
                callback(true)
            } else {
                if (pvi.daq.in[this.Bimanual].value == true && !this.EmergenciaAcionada) {
                    pvi.daq.ligaRele(this.ReleDesce)
                } else {
                    pvi.daq.desligaRele(this.ReleDesce)
                }
            }
        }, 100)

        let timeOutFechamento = setTimeout(() => {
            clearInterval(aguardaFechamento)
            pvi.daq.desligaRele(this.ReleDesce)
            callback(false)
        }, timeOut)
    }

    /**
     * Atua na subida do motor, até identificar o acionamento do fim de curso, ou estouro de timeout.
     * 
     * @param {function} callback 
     * @param {number} timeOut 
     */
    SobeMotor(callback, timeOut = 5000, nivelLogico = true) {

        let aguardaFechamento = setInterval(() => {
            if (this.EmergenciaAcionada) {

                console.error("Emergência acionada - Subida do motor interrompida!")
                clearInterval(aguardaFechamento)
                clearTimeout(timeOutFechamento)

            } else if (pvi.daq.in[this.FimDeCursoSuperior].value == nivelLogico) {

                clearInterval(aguardaFechamento)
                clearTimeout(timeOutFechamento)

                pvi.daq.desligaRele(this.ReleSobe)
                callback(true)
            } else {
                pvi.daq.ligaRele(this.ReleSobe)
            }
        }, 100)

        let timeOutFechamento = setTimeout(() => {
            clearInterval(aguardaFechamento)
            pvi.daq.desligaRele(this.ReleSobe)
            callback(false)
        }, timeOut)
    }

    /**
     * Inicia monitoramento da entrada informada, caso desacionada, trava a execução do script
     * 
     * OBS: por segurança, só é aceito no monitoramento o DESACIONAMENTO da entrada.
     * 
     * @param {string} entrada 
     * @param {number} interval 
     */
    ObserverEmergencia(entrada = this.Emergencia, interval = 200, callback = null) {

        let monitor = setInterval(() => {

            if (!pvi.daq.in[entrada].value) {
                clearInterval(monitor)
                this.EmergenciaAcionada = true

                if (callback != null && typeof (callback) === "function") {
                    callback()
                } else {
                    pvi.runInstructionS("RESET", [])
                    alert("EMERGÊNCIA ACIONADA\n\nClique em OK para reinciar o teste")
                    location.reload()
                }
            }
        }, interval)
    }

    /**
     * Inicia monitoramento da entrada informada
     *  
     * @param {string} entrada 
     * @param {number} interval 
     */
    ObserverBimanual(callback, entrada = this.Bimanual, interval = 300, timeout = 15000, nivelLogico = true) {

        let monitor = setInterval(() => {
            if (pvi.daq.in[entrada].value == nivelLogico) {
                clearInterval(monitor)
                clearTimeout(timeOutMoonitor)
                callback(true)
            }
        }, interval)

        let timeOutMoonitor = setTimeout(() => {
            clearInterval(monitor)
            callback(false)
        }, timeout)
    }
}