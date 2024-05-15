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

    /**
    * Instruções para o setup do fixture superior da nova revisão mecânica
    *
    * @param {HTMLElement} [element=document.getElementsByTagName('main')[0]] - O elemento ao qual o setup do fixture será anexado. O padrão é o primeiro elemento 'main' no document.
    * @return {Promise<Object>} Um objeto com o resultado da configuração e uma mensagem.
    *   - result: Um booleano indicando o sucesso da configuração.
    *   - msg: Uma mensagem em string descrevendo o resultado da configuração.
    *
    * @example
    * const result = await SetupFixture();
    * console.log(result); // { result: true, msg: "instrução bem sucedida" }
    */
    async SetupFixture(element = document.getElementsByTagName('main')[0]) {

        const Setup = new FixtureSetup(element)
        window.testeSetupFixture = Setup
        const emergency = Emergency(this)
        const result = await Promise.race([SetupModal(this), emergency])
        const hideModal = setInterval(() => { Setup.hide() }, 50);
        await Delay(450)
        clearInterval(hideModal)

        return result

        async function Emergency(context) {
            const retornoEmergencia = await EmergencyObserver(context)
            return { result: false, msg: retornoEmergencia.msg }
        }

        async function SetupModal(context) {

            const moveUpInitial = await MoveUp(context, 8000)
            if (!moveUpInitial.result) { return moveUpInitial }

            Setup.changeInfoSpan(`⚠️ Pule esta instrução apenas se a jiga que estiver utilizando for\nalguma das jigas: BS-80.1, BS-80.2 e BS-80.3. ⚠️`)

            let modalResult = await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/Fx_inferior.jpeg`,
                `⚠️ Pule esta instrução se a jiga que estiver utilizando for alguma\n das jigas: BS-80.1, BS-80.2 e BS-80.3. E faça o setup como normalmente. ⚠️
            \n\n Coloque o fixture inferior na base.\n\nem seguida clique em AVANÇAR ou pressione a tecla 'Enter'`)
            if (modalResult == "skip") { return { result: true, msg: `Jiga com revisão antiga` } }

            modalResult = await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/ajustaManipulo.gif`,
                `Ajuste todos os manipulos para que fiquem paralelos ao arco,\n para fazer isso pressione o manipulo pra baixo e gire no sentido anti-horario, como no gif.
            \n\nem seguida clique em AVANÇAR ou pressione a tecla 'Enter'`)
            if (modalResult == "skip") { return { result: true, msg: `Jiga com revisão antiga` } }

            modalResult = await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/encaixeAgulhas.jpeg`,
                `Coloque a placa no fixture, em seguida, coloque o fixture superior em cima, caso o fixture tenha agulhas, alinhe os fixtures de acordo com o encaixe das agulhas, 
             como na imagem.\n\nem seguida clique em AVANÇAR ou pressione a tecla 'Enter'`)
            if (modalResult == "skip") { return { result: true, msg: `Jiga com revisão antiga` } }

            Setup.hideDivButtonSkip()

            const moveDown = await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/manipulosPosicao.jpeg`,
                `Certifique-se de que todos os maipulos estão paralelos ao arco e então PRESSIONE O BIMANUAL`, undefined, MoveDown(context), false)
            if (!moveDown.result) { return moveDown }

            await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/ajustaComFixture.gif`,
                `Ajuste todos os manipulos para que prendam o fixture superior,\n para fazer isso pressione o manipulo pra baixo e gire no sentido horario, como no gif.
            \n\nquando o fixture superior estiver preso, clique em AVANÇAR ou pressione a tecla 'Enter'`)

            const moveUp = await MoveUp(context)
            if (!moveUp.result) { return moveUp }

            return { result: true, msg: `instrução bem sucedida` }
        }

        async function MoveDown(context, delay = 240000) {
            return new Promise((resolve) => {
                context.DesceMotor((result) => {
                    const mensagem = result ? `` : `Motor demorou para chegar ao destino`
                    resolve({ result: result, msg: mensagem })
                }, delay, false)
            })
        }

        async function MoveUp(context, delay = 10000) {
            return new Promise((resolve) => {
                context.SobeMotor((result) => {
                    const mensagem = result ? `` : `Motor demorou para chegar ao destino`
                    resolve({ result: result, msg: mensagem })
                }, delay, false)
            })
        }

        async function EmergencyObserver(context) {
            return new Promise((resolve) => {
                context.ObserverEmergencia(undefined, undefined, () => {
                    resolve({ triggered: true, msg: `Emergência acionada!` })
                })
            })
        }

        async function Delay(time = 10) {
            return new Promise((resolve) => {
                setTimeout(() => { resolve() }, time);
            })
        }
    }

}